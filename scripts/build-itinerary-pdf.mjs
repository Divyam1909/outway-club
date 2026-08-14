/**
 * Builds the customer-facing itinerary PDF from the live trip data.
 *
 *   node scripts/build-itinerary-pdf.mjs                  (the spotlight trip)
 *   node scripts/build-itinerary-pdf.mjs udaipur-mount-abu
 *   node scripts/build-itinerary-pdf.mjs udaipur-mount-abu docs/custom-name.pdf
 *
 * This exists because the brochure used to be a hand-made file: the moment the
 * itinerary changed in the database, the PDF quietly started lying about the
 * dates, the price and the number of days. Now it reads the same rows the trip
 * page reads, so regenerating is the fix rather than a redesign.
 *
 * Operator-only, like scripts/db.mjs — it uses the service-role key and
 * Playwright's bundled Chromium to print. Both are already devDependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("@playwright/test");

// ---------------------------------------------------------------------------
// Brochure-only copy.
//
// Everything else on the page comes from the database. These two notes are
// sales copy that has no column to live in, so they are kept here where they
// are easy to find rather than buried in the template below. A day note is
// matched against the day title, case-insensitively.
// ---------------------------------------------------------------------------
const EXTENDING_NOTE = {
  title: "Extending your stay?",
  body: "Kumbhalgarh Fort and the Ranakpur Jain temple, both under two and a half hours from Udaipur, are the two side trips most people wish they'd added on afterwards. Ask your trip captain and we'll help you book the extra day, either side of the dates above.",
};

const DAY_NOTES = [
  {
    match: /dilwara/i,
    title: "Good to know",
    body: "Dilwara bans phones, cameras and leather items inside, and requires shoulders and knees covered. Nothing to carry in but yourself.",
  },
];

// ---------------------------------------------------------------------------
// Environment + data
// ---------------------------------------------------------------------------
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const slugArg = process.argv[2];
const outArg = process.argv[3];

let query = db
  .from("trips")
  .select("*, destination:destinations(name, region, best_time)")
  .eq("is_published", true);

query = slugArg
  ? query.eq("slug", slugArg)
  : query.order("spotlight_rank", { ascending: true, nullsFirst: false }).limit(1);

const { data: trips, error: tripError } = await query;
if (tripError) throw tripError;

const trip = trips?.[0];
if (!trip) {
  console.error(slugArg ? `No published trip with slug "${slugArg}".` : "No published trips.");
  process.exit(1);
}

const [{ data: days, error: dayError }, { data: departures, error: depError }] = await Promise.all([
  db.from("itinerary_days").select("*").eq("trip_id", trip.id).order("day_number"),
  db
    .from("departures")
    .select("start_date, end_date, status")
    .eq("trip_id", trip.id)
    .order("start_date")
    .limit(1),
]);

if (dayError) throw dayError;
if (depError) throw depError;

const departure = departures?.[0] ?? null;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rupees = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

/**
 * Dates arrive as plain `YYYY-MM-DD` from PostgREST. Parsing them with the
 * Date constructor and reading them back locally is what shifts a trip a day
 * earlier in IST, so the parts are handled as integers throughout.
 */
function parseDate(value) {
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const fmt = (date, options) =>
  date.toLocaleDateString("en-GB", { timeZone: "UTC", ...options });

const dayDate = (index) => {
  if (!departure) return null;
  const start = parseDate(departure.start_date);
  start.setUTCDate(start.getUTCDate() + index);
  return start;
};

function dateRange() {
  if (!departure) return null;
  const from = parseDate(departure.start_date);
  const to = parseDate(departure.end_date);
  const sameMonth = from.getUTCMonth() === to.getUTCMonth();
  const left = sameMonth ? fmt(from, { day: "numeric" }) : fmt(from, { day: "numeric", month: "long" });
  return `${left} – ${fmt(to, { day: "numeric", month: "long", year: "numeric" })}`;
}

const asArray = (value) => (Array.isArray(value) ? value : []);

/** "5:30 PM — Sunset boat" splits into a time column and a label column. */
function splitActivity(activity) {
  const match = String(activity).match(/^\s*([^—]{1,18}?)\s+—\s+(.*)$/);
  return match ? { time: match[1], label: match[2] } : { time: "", label: String(activity) };
}

const saving = Number(trip.price_per_person) - Number(trip.discounted_price);

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
const footer = (right) => `
  <div class="foot">
    <span>OUTWAY CLUB${trip.edition_number ? ` · ESCAPE ${String(trip.edition_number).padStart(3, "0")}` : ""}</span>
    <span>${esc(right)}</span>
  </div>`;

const coverPage = `
<section class="page cover">
  <div>
    <div class="mark"><span class="dot"></span>OUTWAY CLUB</div>
    <p class="tagline">Journeys, not tour packages.</p>
  </div>

  <div>
    <h1>${esc(trip.title)}</h1>
    ${trip.edition_number ? `<span class="pill">ESCAPE ${String(trip.edition_number).padStart(3, "0")}</span>` : ""}
    <p class="cover-sub">${esc(trip.short_description)}</p>
    ${departure ? `<p class="cover-dates"><strong>${esc(dateRange())}</strong> · ${trip.duration_nights} nights</p>` : ""}
  </div>

  <div class="cover-bar">
    <div class="stats">
      <div><span class="stat">${trip.duration_days}D/${trip.duration_nights}N</span><span class="stat-label">DURATION</span></div>
      <div><span class="stat">${trip.group_size_min}–${trip.group_size_max}</span><span class="stat-label">GROUP SIZE</span></div>
      <div><span class="stat cap">${esc(trip.difficulty)}</span><span class="stat-label">DIFFICULTY</span></div>
    </div>
    <div class="price">
      ${saving > 0 ? `<div class="was">${rupees(trip.price_per_person)}</div>` : ""}
      <div class="now">${rupees(trip.discounted_price)}</div>
      <div class="price-label">per person, all taxes in</div>
      ${saving > 0 ? `<span class="save">Save ${rupees(saving)}</span>` : ""}
    </div>
  </div>
</section>`;

const overviewPage = `
<section class="page">
  <p class="eyebrow">THE TRIP</p>
  <h2>${esc(trip.short_description.split(",")[0])}</h2>
  <hr class="rule" />
  <p class="lede">${esc(trip.description)}</p>

  <div class="facts">
    <div class="fact"><span class="fact-label">STARTING POINT</span><strong>${esc(trip.starting_point)}</strong></div>
    <div class="fact"><span class="fact-label">BEST TIME</span><strong>${esc(trip.destination?.best_time ?? "—")}</strong></div>
    <div class="fact"><span class="fact-label">ROUTE</span><strong>${esc(trip.destination?.name ?? "")} → ${esc(trip.title.replace(/^.*×\s*/, ""))} → ${esc(trip.destination?.name ?? "")}</strong></div>
  </div>

  <p class="eyebrow mt">TRIP HIGHLIGHTS</p>
  <div class="grid">
    ${asArray(trip.highlights)
      .map((item) => `<div class="card"><span class="bullet"></span>${esc(item)}</div>`)
      .join("")}
  </div>

  <div class="callout">
    <strong>${esc(EXTENDING_NOTE.title)}</strong> ${esc(EXTENDING_NOTE.body)}
  </div>
  ${footer(trip.title)}
</section>`;

const dayPages = asArray(days)
  .map((day, index) => {
    const date = dayDate(index);
    const note = DAY_NOTES.find((entry) => entry.match.test(day.title));
    const meals = [
      ["Breakfast", day.meals?.breakfast],
      ["Lunch", day.meals?.lunch],
      ["Dinner", day.meals?.dinner],
    ];

    return `
<section class="page">
  <div class="day-head">
    <span class="day-num">${day.day_number}</span>
    <div>
      <h2 class="day-title">${esc(day.title)}</h2>
      ${date ? `<p class="day-date">${fmt(date, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p>` : ""}
    </div>
  </div>

  <p class="lede">${esc(day.description)}</p>

  <table class="times">
    ${asArray(day.activities)
      .map((activity) => {
        const { time, label } = splitActivity(activity);
        return `<tr><td class="t">${esc(time)}</td><td>${esc(label)}</td></tr>`;
      })
      .join("")}
  </table>

  <div class="chips">
    ${meals
      .map(
        ([label, included]) =>
          `<span class="chip ${included ? "on" : ""}">${label} — ${included ? "included" : "not included"}</span>`
      )
      .join("")}
    ${day.accommodation ? `<span class="chip stay">Stay: ${esc(day.accommodation)}</span>` : ""}
  </div>

  ${note ? `<div class="callout"><strong>${esc(note.title)} —</strong> ${esc(note.body)}</div>` : ""}
  ${footer(`DAY ${day.day_number} OF ${days.length}`)}
</section>`;
  })
  .join("");

const finePrintPage = `
<section class="page">
  <p class="eyebrow">THE FINE PRINT, UPFRONT</p>
  <h2>What's included, what isn't, what to pack</h2>
  <hr class="rule" />

  <div class="two">
    <div>
      <h3>Included</h3>
      <ul class="ticks">
        ${asArray(trip.inclusions).map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>
    <div>
      <h3>Not included</h3>
      <ul class="crosses">
        ${asArray(trip.exclusions).map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>
  </div>

  <h3 class="mt">Things to carry</h3>
  <ul class="two dots">
    ${asArray(trip.things_to_carry).map((item) => `<li>${esc(item)}</li>`).join("")}
  </ul>
  ${footer("INCLUSIONS & PACKING LIST")}
</section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --cream: #FBF7F0; --cream-100: #FFFFFF; --cream-300: #F0E7D6;
    --ink: #221F1A; --ink-700: #3A362E; --ink-500: #6B6257;
    --pine: #1E3D32; --pine-700: #102019; --pine-50: #EAF0EC;
    --clay: #B05622; --gold: #D9A441; --gold-100: #F6E7C8;
    --border: #DED5C2;
  }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, system-ui, sans-serif; color: var(--ink-700); -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .page {
    width: 210mm; height: 297mm; padding: 18mm 16mm 14mm;
    background: var(--cream); position: relative;
    page-break-after: always; display: flow-root;
  }
  .page:last-child { page-break-after: auto; }

  h1, h2, h3, .stat, .now { font-family: "Playfair Display", Georgia, serif; color: var(--ink); }

  /* --- Cover ------------------------------------------------------------ */
  .cover {
    background: var(--pine); color: var(--cream-100);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 20mm 16mm 0;
  }
  .mark { font-size: 8.5pt; letter-spacing: .22em; font-weight: 600; color: var(--cream-100); }
  .dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--gold); margin-right: 8px; vertical-align: 2px; }
  .tagline { font-size: 9.5pt; font-style: italic; color: #B9C6BE; margin-top: 6px; }
  .cover h1 { font-size: 40pt; color: var(--cream-100); line-height: 1.1; }
  .pill { display: inline-block; margin-top: 14px; border: 1px solid var(--gold); color: var(--gold); border-radius: 999px; padding: 5px 14px; font-size: 7.5pt; letter-spacing: .18em; font-weight: 600; }
  .cover-sub { margin-top: 22px; font-size: 11pt; color: #CBD6D0; }
  .cover-dates { margin-top: 6px; font-size: 11pt; color: var(--cream-100); }
  .cover-bar { background: var(--pine-700); margin: 0 -16mm; padding: 12mm 16mm; display: flex; justify-content: space-between; align-items: flex-end; }
  .stats { display: flex; gap: 16mm; }
  .stat { display: block; font-size: 15pt; color: var(--cream-100); }
  .cap { text-transform: capitalize; }
  .stat-label { font-size: 6.5pt; letter-spacing: .16em; color: #8FA39A; }
  .price { text-align: right; }
  .was { font-size: 10pt; color: #8FA39A; text-decoration: line-through; }
  .now { font-size: 26pt; color: var(--gold); line-height: 1.1; }
  .price-label { font-size: 7.5pt; color: #B9C6BE; }
  .save { display: inline-block; margin-top: 6px; background: var(--gold); color: var(--pine-700); border-radius: 999px; padding: 3px 10px; font-size: 7.5pt; font-weight: 600; }

  /* --- Shared ----------------------------------------------------------- */
  .eyebrow { font-size: 7.5pt; letter-spacing: .2em; font-weight: 600; color: var(--clay); }
  h2 { font-size: 19pt; margin-top: 8px; }
  .rule { border: 0; border-top: 2px solid var(--gold); margin: 12px 0 16px; }
  .lede { font-size: 9.5pt; line-height: 1.75; color: var(--ink-700); }
  .mt { margin-top: 20px; }

  .facts { display: flex; gap: 8px; margin-top: 18px; }
  .fact { flex: 1; background: var(--cream-300); border-radius: 10px; padding: 11px 13px; font-size: 9pt; }
  .fact-label { display: block; font-size: 6.5pt; letter-spacing: .14em; color: var(--ink-500); margin-bottom: 5px; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .card { background: var(--cream-100); border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 8.5pt; line-height: 1.55; position: relative; padding-left: 26px; }
  .bullet { position: absolute; left: 12px; top: 15px; width: 5px; height: 5px; border-radius: 50%; background: var(--clay); }

  .callout { margin-top: 16px; border-left: 3px solid var(--pine); background: var(--pine-50); border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 8.5pt; line-height: 1.6; }

  /* --- Day pages -------------------------------------------------------- */
  .day-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
  .day-num { flex: none; width: 34px; height: 34px; border-radius: 50%; background: var(--pine); color: var(--cream-100); font-family: "Playfair Display", serif; font-size: 14pt; display: flex; align-items: center; justify-content: center; }
  .day-title { font-size: 17pt; line-height: 1.25; }
  .day-date { font-size: 7.5pt; letter-spacing: .16em; color: var(--clay); font-weight: 600; margin-top: 5px; }

  .times { width: 100%; border-collapse: collapse; margin-top: 18px; }
  .times td { border-bottom: 1px dotted var(--border); padding: 9px 0; font-size: 9pt; vertical-align: top; }
  .times .t { width: 30mm; font-weight: 600; color: var(--ink); font-size: 8.5pt; }

  .chips { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { background: var(--cream-300); border-radius: 999px; padding: 5px 12px; font-size: 7.5pt; color: var(--ink-500); }
  .chip.on { background: var(--pine-50); color: var(--pine); font-weight: 500; }
  .chip.stay { background: var(--gold-100); color: #6B4E12; }

  /* --- Fine print ------------------------------------------------------- */
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
  /* A grid row is as tall as its tallest cell, which leaves ragged gaps down a
     packing list of mixed-length items. Flowing columns pack it tight. */
  ul.two { display: block; column-count: 2; column-gap: 10mm; }
  ul.two li { break-inside: avoid; }
  h3 { font-size: 12pt; margin-bottom: 10px; }
  ul { list-style: none; }
  ul li { font-size: 8.5pt; line-height: 1.6; margin-bottom: 9px; padding-left: 18px; position: relative; }
  .ticks li::before { content: "✓"; position: absolute; left: 0; color: var(--pine); font-weight: 600; }
  .crosses li::before { content: "✕"; position: absolute; left: 0; color: var(--ink-500); }
  .dots li::before { content: ""; position: absolute; left: 2px; top: 7px; width: 5px; height: 5px; border-radius: 50%; background: var(--clay); }

  .foot { position: absolute; left: 16mm; right: 16mm; bottom: 10mm; display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 7px; font-size: 6.5pt; letter-spacing: .12em; color: var(--ink-500); }
</style></head>
<body>${coverPage}${overviewPage}${dayPages}${finePrintPage}</body></html>`;

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------
const outPath =
  outArg ?? path.join("docs", `${trip.slug}-itinerary.pdf`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({ path: outPath, format: "A4", printBackground: true });
} finally {
  await browser.close();
}

const pages = 2 + (days?.length ?? 0) + 1;
console.log(
  `wrote ${outPath} — ${trip.title}, ${trip.duration_days}D/${trip.duration_nights}N, ` +
    `${departure ? dateRange() : "no departure"}, ${rupees(trip.discounted_price)} (${pages} pages)`
);
