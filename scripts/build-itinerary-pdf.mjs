/**
 * Builds the customer-facing brochure from the live trip data.
 *
 *   node scripts/build-itinerary-pdf.mjs                  (the spotlight trip)
 *   node scripts/build-itinerary-pdf.mjs jawai-udaipur
 *   node scripts/build-itinerary-pdf.mjs jawai-udaipur public/itineraries/x.pdf
 *
 * Output lands in public/itineraries/<slug>.pdf by default, so the brochure is
 * downloadable from the trip page rather than living in docs/ where only we can
 * see it. See src/config/itineraries.ts for the link.
 *
 * This is a mini magazine, not a package PDF, and the page order is the
 * argument rather than a table of contents:
 *
 *   cover → philosophy → the journey → day by day → the people →
 *   what's included → who it's for → price, practicals and the closing line
 *
 * Every word of it reads the same rows the website reads. That is the whole
 * reason this script exists: the brochure used to be a hand-made file, and the
 * moment the itinerary changed in the database it quietly started lying about
 * the dates, the price and the number of days. There is deliberately no
 * per-trip copy hard-coded in here any more — anything that needs saying about
 * one escape belongs in that escape's row, where the site can say it too.
 *
 * One thing the brochure carries that the website does not: exact clock times.
 * Activities are authored `Band (exact time) — What happens`; the site shows
 * only the band, because the customer-facing journey shows the experience.
 * Somebody still has to run the day, so the PDF prints both.
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
// Brand copy.
//
// The only text in this file that is not read from the database, and it is
// here because it is true of every escape rather than any one of them. If a
// line below ever needs to differ per trip, it has become trip data and wants
// a column, not a conditional.
// ---------------------------------------------------------------------------
const PHILOSOPHY = {
  eyebrow: "WHAT WE'RE ACTUALLY BUILDING",
  title: "You don't just visit a place. You experience it.",
  lede: "Outway Club is not a weekend-trip company. The trips are the way in. What we are building is a different way to travel — fewer places, longer in each, and real time with the people who live there. Four preferences decide every call we make, from who we eat with to what we leave out.",
  preferences: [
    ["People", "Places", "A place is the reason you booked. The people are the reason you remember it."],
    ["Stories", "Sightseeing", "Anyone can stand in front of a fort. We would rather you left knowing why."],
    ["Experiences", "Itineraries", "A full schedule is easy to sell and exhausting to live. Empty hours are in the plan."],
    ["Community", "Customers", "You arrive not knowing anyone. You leave on a group thread that stays open."],
  ],
  pillars: [
    ["People", "You come for the destination. You remember the people."],
    ["Place", "Understand a place, don't just visit it."],
    ["Culture", "Participate, don't observe from outside."],
    ["Experience", "Curate the journey, don't fill every minute."],
    ["Connection", "Arrive with strangers. Leave with stories."],
  ],
};

const COMMUNITY = {
  eyebrow: "THE PART THAT ISN'T ON THE ITINERARY",
  title: "You don't have to know anyone before you come. That's the point.",
  body: "Most people on an Outway escape book alone. The group is capped small enough that everyone is at one table by the first evening, and every evening has something in it whose only job is to make that easy — a question round a fire, a shared dinner, a letter written to somebody you met four days ago. Nothing about that appears on an invoice, and it is the thing people write to us about six months later.",
  closing: "You came for the destination. You leave remembering the people.",
};

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

// Naming a slug outright includes unpublished trips: an escape between dates is
// hidden from the catalogue but its brochure is still the thing ops send to
// somebody asking when it runs again — and for a draft edition it is the only
// surface that exists at all. Without a slug we take the spotlight trip, and
// that one has to be live.
let query = db.from("trips").select("*, destination:destinations(name, region, best_time)");

query = slugArg
  ? query.eq("slug", slugArg)
  : query
      .eq("is_published", true)
      .order("spotlight_rank", { ascending: true, nullsFirst: false })
      .limit(1);

const { data: trips, error: tripError } = await query;
if (tripError) throw tripError;

const trip = trips?.[0];
if (!trip) {
  console.error(slugArg ? `No trip with slug "${slugArg}".` : "No published trips.");
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

/**
 * The calendar date for a day row.
 *
 * Keyed off `day_number`, not the array index. An escape that leaves Delhi the
 * night before opens on Day 00, and counting from the index would print every
 * date on that trip a day late.
 */
const dayDate = (dayNumber) => {
  if (!departure) return null;
  const first = days?.[0]?.day_number ?? 0;
  const start = parseDate(departure.start_date);
  start.setUTCDate(start.getUTCDate() + (dayNumber - first));
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

/**
 * `Label — the sentence` splits into a lead and a body; a line without a dash
 * comes back as body-only. Mirrors splitLead() in src/lib/utils.ts.
 */
function splitLead(line) {
  const match = String(line).match(/^\s*(.{1,60}?)\s+—\s+([\s\S]+)$/);
  if (!match) return { lead: null, body: String(line).trim() };
  return { lead: match[1].trim(), body: match[2].trim() };
}

/**
 * `Band (exact time) — What happens` splits into a time column and a label.
 * Mirrors splitActivity() in src/lib/utils.ts — change one, change the other.
 * The brochure prints the band and the exact time; the website prints only the
 * band.
 */
function splitActivity(activity) {
  const { lead, body } = splitLead(activity);
  if (lead === null) return { band: "", exact: null, label: body };

  const timed = lead.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return timed
    ? { band: timed[1].trim(), exact: timed[2].trim(), label: body }
    : { band: lead, exact: null, label: body };
}

/** `Label — body` rendered as a bolded lead followed by its sentence. */
function leadHtml(line) {
  const { lead, body } = splitLead(line);
  return lead ? `<strong>${esc(lead)}.</strong> ${esc(body)}` : esc(body);
}

/**
 * What the brochure prints, and it has to match the website exactly.
 *
 * Three things can move the price and the PDF used to know about one of them:
 * the list price, an optional `discounted_price`, and any auto-applying promo
 * code covering this trip. A brochure quoting ₹18,999 while the site quotes
 * ₹16,999 is worse than no brochure, so all three are resolved here — the same
 * precedence src/lib/promo-rules.ts uses, deliberately, because these two
 * places disagreeing is exactly the bug this script exists to prevent.
 */
const listPrice = Number(trip.price_per_person);
const basePrice = Number(trip.discounted_price ?? trip.price_per_person);

const { data: autoPromos } = await db
  .from("promo_codes")
  .select("*")
  .eq("is_active", true)
  .eq("auto_apply", true);

const now = Date.now();
let promoDiscount = 0;
let promoLabel = null;

for (const promo of autoPromos ?? []) {
  const tripIds = Array.isArray(promo.trip_ids) ? promo.trip_ids : [];
  if (tripIds.length > 0 && !tripIds.includes(trip.id)) continue;
  if (promo.starts_at && now < new Date(promo.starts_at).getTime()) continue;
  if (promo.ends_at && now > new Date(promo.ends_at).getTime()) continue;
  if (basePrice < Number(promo.min_order_amount ?? 0)) continue;
  if (Number(promo.min_travelers ?? 1) > 1) continue;

  const value = Number(promo.discount_value);
  let off =
    promo.discount_type === "percent" ? (basePrice * value) / 100 : value;
  if (
    promo.discount_type === "percent" &&
    promo.max_discount_amount !== null &&
    promo.max_discount_amount !== undefined
  ) {
    off = Math.min(off, Number(promo.max_discount_amount));
  }
  off = Math.max(0, Math.min(Math.round(off), Math.round(basePrice)));

  if (off > promoDiscount) {
    promoDiscount = off;
    promoLabel = promo.label;
  }
}

const finalPrice = Math.max(0, basePrice - promoDiscount);
const saving = Math.max(0, listPrice - finalPrice);

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
const edition = trip.edition_number
  ? `ESCAPE ${String(trip.edition_number).padStart(3, "0")}`
  : null;

const footer = (right) => `
  <div class="foot">
    <span>OUTWAY CLUB${edition ? ` · ${edition}` : ""}</span>
    <span>${esc(right)}</span>
  </div>`;

const coverPage = `
<section class="page cover">
  <div>
    <div class="mark"><span class="dot"></span>OUTWAY CLUB</div>
    <p class="tagline">Escape Ordinary. Meet The World, One Journey At A Time.</p>
  </div>

  <div>
    <h1>${esc(trip.title)}</h1>
    ${edition ? `<span class="pill">${edition}</span>` : ""}
    ${trip.promise ? `<p class="cover-promise">${esc(trip.promise)}</p>` : ""}
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
      ${saving > 0 ? `<div class="was">${rupees(listPrice)}</div>` : ""}
      <div class="now">${rupees(finalPrice)}</div>
      <div class="price-label">per person, all taxes in</div>
      ${saving > 0 ? `<span class="save">${promoLabel ? `${esc(promoLabel)} · ` : ""}Save ${rupees(saving)}</span>` : ""}
    </div>
  </div>
</section>`;

const philosophyPage = `
<section class="page">
  <p class="eyebrow">${PHILOSOPHY.eyebrow}</p>
  <h2>${esc(PHILOSOPHY.title)}</h2>
  <hr class="rule" />
  <p class="lede">${esc(PHILOSOPHY.lede)}</p>

  <div class="prefs">
    ${PHILOSOPHY.preferences
      .map(
        ([over, under, body]) => `
      <div class="pref">
        <div class="pref-head">${esc(over)} <span class="gt">&gt;</span> <s>${esc(under)}</s></div>
        <div class="pref-body">${esc(body)}</div>
      </div>`
      )
      .join("")}
  </div>

  <p class="eyebrow mt">HOW AN ESCAPE IS DESIGNED</p>
  <p class="sub">Five things decide what goes in, and what gets left out. Every one of them removes something — that is how you can tell they are real.</p>
  <table class="pillars">
    ${PHILOSOPHY.pillars
      .map(
        ([name, line], index) => `
      <tr>
        <td class="pillar-n">${String(index + 1).padStart(2, "0")}</td>
        <td class="pillar-name">${esc(name)}</td>
        <td class="pillar-line">${esc(line)}</td>
      </tr>`
      )
      .join("")}
  </table>
  ${footer("THE PHILOSOPHY")}
</section>`;

const journeyPage = `
<section class="page">
  <p class="eyebrow">THE JOURNEY</p>
  <h2>${esc(trip.title)}</h2>
  <hr class="rule" />
  <p class="lede">${esc(trip.description)}</p>

  ${
    asArray(trip.feelings).length > 0
      ? `<div class="feelings">
          ${asArray(trip.feelings)
            .map((feeling) => {
              const { lead, body } = splitLead(feeling);
              return `<div class="feeling"><span class="feeling-where">${esc(lead ?? "")}</span><span class="feeling-what">${esc(body)}</span></div>`;
            })
            .join("")}
        </div>`
      : ""
  }

  ${
    asArray(trip.journey_route).length > 0
      ? `<p class="eyebrow mt">THE SHAPE OF IT</p>
         <ol class="route">
           ${asArray(trip.journey_route)
             .map((step, index) => {
               const { lead, body } = splitLead(step);
               return `<li><span class="route-n">${String(index + 1).padStart(2, "0")}</span><span class="route-lead">${esc(lead ?? body)}</span>${lead ? `<span class="route-body">${esc(body)}</span>` : ""}</li>`;
             })
             .join("")}
         </ol>`
      : ""
  }
  ${footer("THE JOURNEY")}
</section>`;

const highlightsPage =
  asArray(trip.highlights).length > 0
    ? `
<section class="page">
  <p class="eyebrow">WHAT YOU'LL REMEMBER</p>
  <h2>The moments this escape was built around</h2>
  <hr class="rule" />
  <div class="grid">
    ${asArray(trip.highlights)
      .map((item) => `<div class="card"><span class="bullet"></span>${esc(item)}</div>`)
      .join("")}
  </div>

  <div class="facts mt">
    <div class="fact"><span class="fact-label">STARTING POINT</span><strong>${esc(trip.starting_point ?? "—")}</strong></div>
    <div class="fact"><span class="fact-label">BEST TIME</span><strong>${esc(trip.destination?.best_time ?? "—")}</strong></div>
  </div>
  ${footer("HIGHLIGHTS")}
</section>`
    : "";

const dayPages = asArray(days)
  .map((day) => {
    const date = dayDate(day.day_number);
    const meals = [
      ["Breakfast", day.meals?.breakfast],
      ["Lunch", day.meals?.lunch],
      ["Dinner", day.meals?.dinner],
    ];

    return `
<section class="page">
  <div class="day-head">
    <span class="day-num">${String(day.day_number).padStart(2, "0")}</span>
    <div>
      <h2 class="day-title">${esc(day.title)}</h2>
      ${date ? `<p class="day-date">${fmt(date, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p>` : ""}
    </div>
  </div>

  <p class="lede">${esc(day.description)}</p>

  <table class="times">
    ${asArray(day.activities)
      .map((activity) => {
        const { band, exact, label } = splitActivity(activity);
        // Band on top, exact time under it in clay. The website prints only
        // the band; this column is the reason the brochure is what ops and
        // the trip captain actually run the day from.
        const when =
          (band ? esc(band) : "") +
          (exact ? `<span class="exact">${esc(exact)}</span>` : "");
        return `<tr><td class="t">${when}</td><td>${esc(label)}</td></tr>`;
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

  ${footer(`DAY ${String(day.day_number).padStart(2, "0")} OF ${String(days[days.length - 1].day_number).padStart(2, "0")}`)}
</section>`;
  })
  .join("");

const communityPage = `
<section class="page">
  <p class="eyebrow">${COMMUNITY.eyebrow}</p>
  <h2>${esc(COMMUNITY.title)}</h2>
  <hr class="rule" />
  <p class="lede">${esc(COMMUNITY.body)}</p>

  ${
    asArray(trip.really_booking).length > 0
      ? `<div class="booking-block">
          <p class="block-eyebrow">WHAT YOU'RE REALLY BOOKING</p>
          <ul class="arrows">
            ${asArray(trip.really_booking).map((item) => `<li>${leadHtml(item)}</li>`).join("")}
          </ul>
        </div>`
      : ""
  }
  ${footer("THE PEOPLE")}
</section>`;

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

const audiencePage =
  asArray(trip.who_for).length > 0 || asArray(trip.not_for).length > 0
    ? `
<section class="page">
  <p class="eyebrow">BEFORE YOU BOOK</p>
  <h2>Is this your kind of journey?</h2>
  <hr class="rule" />
  <p class="lede">${trip.group_size_max} people share this one. We would genuinely rather you read the right-hand column and book something else than read it afterwards.</p>

  <div class="two mt">
    <div>
      <h3>This is for you if</h3>
      <ul class="ticks">
        ${asArray(trip.who_for).map((item) => `<li>${leadHtml(item)}</li>`).join("")}
      </ul>
    </div>
    <div>
      <h3>Not for you if</h3>
      <ul class="crosses">
        ${asArray(trip.not_for).map((item) => `<li>${leadHtml(item)}</li>`).join("")}
      </ul>
    </div>
  </div>
  ${footer("WHO IT'S FOR")}
</section>`
    : "";

const closingPage = `
<section class="page closing">
  <div>
    <div class="mark"><span class="dot"></span>OUTWAY CLUB</div>
  </div>

  <div>
    <p class="closing-line">&ldquo;${esc(COMMUNITY.closing)}&rdquo;</p>

    <div class="closing-price">
      ${saving > 0 ? `<span class="was">${rupees(listPrice)}</span>` : ""}
      <span class="now">${rupees(finalPrice)}</span>
      <span class="price-label">per person, all taxes in</span>
    </div>

    <p class="closing-meta">
      ${esc(trip.title)}${edition ? ` · ${edition}` : ""}${departure ? ` · ${esc(dateRange())}` : ""}
      · ${trip.duration_days}D/${trip.duration_nights}N · capped at ${trip.group_size_max}
    </p>

    <p class="closing-how">
      Booking is a two-minute form on the trip page, then a person confirms your seat within one
      business day. Nothing is charged online and nothing is held until we have both said yes.
    </p>
  </div>

  <div class="closing-foot">
    <span>outway.club/trips/${esc(trip.slug)}</span>
    <span>hello@outway.club</span>
  </div>
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

  h1, h2, h3, .stat, .now, .pillar-name, .feeling-what, .closing-line { font-family: "Playfair Display", Georgia, serif; color: var(--ink); }

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
  .cover-promise { margin-top: 20px; font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: 16pt; color: var(--gold); line-height: 1.3; }
  .cover-sub { margin-top: 14px; font-size: 10.5pt; color: #CBD6D0; line-height: 1.6; }
  .cover-dates { margin-top: 8px; font-size: 11pt; color: var(--cream-100); }
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
  h2 { font-size: 19pt; margin-top: 8px; line-height: 1.25; }
  .rule { border: 0; border-top: 2px solid var(--gold); margin: 12px 0 16px; }
  .lede { font-size: 9.5pt; line-height: 1.75; color: var(--ink-700); }
  .sub { font-size: 8.5pt; line-height: 1.65; color: var(--ink-500); margin-top: 6px; }
  .mt { margin-top: 20px; }

  .facts { display: flex; gap: 8px; }
  .fact { flex: 1; background: var(--cream-300); border-radius: 10px; padding: 11px 13px; font-size: 8.5pt; line-height: 1.5; }
  .fact-label { display: block; font-size: 6.5pt; letter-spacing: .14em; color: var(--ink-500); margin-bottom: 5px; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .card { background: var(--cream-100); border: 1px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 8.5pt; line-height: 1.55; position: relative; padding-left: 26px; }
  .bullet { position: absolute; left: 12px; top: 15px; width: 5px; height: 5px; border-radius: 50%; background: var(--clay); }

  /* --- Philosophy -------------------------------------------------------- */
  .prefs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10mm; margin-top: 20px; }
  .pref { border-top: 1px solid var(--border); padding-top: 10px; }
  .pref-head { font-family: "Playfair Display", Georgia, serif; font-size: 14pt; color: var(--ink); }
  .gt { color: var(--gold); }
  .pref-head s { color: var(--ink-500); font-size: 12pt; }
  .pref-body { font-size: 8.5pt; line-height: 1.6; color: var(--ink-500); margin-top: 5px; }

  .pillars { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .pillars td { border-bottom: 1px dotted var(--border); padding: 9px 0; vertical-align: baseline; }
  .pillar-n { width: 12mm; font-size: 7.5pt; color: var(--clay); font-weight: 600; }
  .pillar-name { width: 32mm; font-size: 13pt; }
  .pillar-line { font-size: 9pt; font-style: italic; color: var(--pine); }

  /* --- Journey ----------------------------------------------------------- */
  .feelings { display: flex; gap: 8px; margin-top: 16px; }
  .feeling { flex: 1; background: var(--pine-50); border-radius: 10px; padding: 11px 13px; text-align: center; }
  .feeling-where { display: block; font-size: 6.5pt; letter-spacing: .16em; font-weight: 600; color: var(--ink-500); text-transform: uppercase; }
  .feeling-what { display: block; font-size: 14pt; color: var(--pine); margin-top: 3px; }

  .route { list-style: none; margin-top: 10px; column-count: 2; column-gap: 10mm; }
  .route li { break-inside: avoid; padding: 7px 0 7px 13mm; position: relative; border-bottom: 1px dotted var(--border); }
  .route-n { position: absolute; left: 0; top: 8px; font-size: 7.5pt; font-weight: 600; color: var(--clay); }
  .route-lead { display: block; font-size: 9pt; font-weight: 600; color: var(--ink); }
  .route-body { display: block; font-size: 8pt; line-height: 1.5; color: var(--ink-500); margin-top: 2px; }

  /* --- Day pages -------------------------------------------------------- */
  .day-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
  .day-num { flex: none; width: 34px; height: 34px; border-radius: 50%; background: var(--pine); color: var(--cream-100); font-family: "Playfair Display", serif; font-size: 12pt; display: flex; align-items: center; justify-content: center; }
  .day-title { font-size: 17pt; line-height: 1.25; }
  .day-date { font-size: 7.5pt; letter-spacing: .16em; color: var(--clay); font-weight: 600; margin-top: 5px; }

  .times { width: 100%; border-collapse: collapse; margin-top: 18px; }
  .times td { border-bottom: 1px dotted var(--border); padding: 9px 0; font-size: 9pt; vertical-align: top; }
  .times .t { width: 34mm; font-weight: 600; color: var(--ink); font-size: 8.5pt; padding-right: 6mm; }
  .times .exact { display: block; font-weight: 500; font-size: 7.5pt; color: var(--clay); letter-spacing: .04em; }

  .chips { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { background: var(--cream-300); border-radius: 999px; padding: 5px 12px; font-size: 7.5pt; color: var(--ink-500); }
  .chip.on { background: var(--pine-50); color: var(--pine); font-weight: 500; }
  .chip.stay { background: var(--gold-100); color: #6B4E12; }

  /* --- Community --------------------------------------------------------- */
  .booking-block { margin-top: 20px; border-left: 3px solid var(--pine); background: var(--pine-50); border-radius: 0 10px 10px 0; padding: 14px 16px; }
  .block-eyebrow { font-size: 7pt; letter-spacing: .18em; font-weight: 600; color: var(--pine); margin-bottom: 10px; }
  .arrows { list-style: none; }
  .arrows li { font-size: 8.5pt; line-height: 1.6; margin-bottom: 9px; padding-left: 16px; position: relative; }
  .arrows li:last-child { margin-bottom: 0; }
  .arrows li::before { content: "→"; position: absolute; left: 0; color: var(--clay); }

  /* --- Fine print / audience -------------------------------------------- */
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

  /* --- Closing ----------------------------------------------------------- */
  .closing {
    background: var(--pine); color: var(--cream-100);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 20mm 16mm 16mm;
  }
  .closing-line { font-size: 24pt; font-style: italic; color: var(--cream-100); line-height: 1.35; max-width: 150mm; }
  .closing-price { margin-top: 26px; display: flex; align-items: baseline; gap: 10px; }
  .closing-price .was { font-size: 11pt; }
  .closing-price .now { font-size: 24pt; }
  .closing-meta { margin-top: 14px; font-size: 9pt; color: #CBD6D0; }
  .closing-how { margin-top: 10px; font-size: 9pt; line-height: 1.7; color: #B9C6BE; max-width: 140mm; }
  .closing-foot { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,.18); padding-top: 9px; font-size: 7.5pt; letter-spacing: .1em; color: #8FA39A; }

  .foot { position: absolute; left: 16mm; right: 16mm; bottom: 10mm; display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 7px; font-size: 6.5pt; letter-spacing: .12em; color: var(--ink-500); }
</style></head>
<body>${coverPage}${philosophyPage}${journeyPage}${highlightsPage}${dayPages}${communityPage}${finePrintPage}${audiencePage}${closingPage}</body></html>`;

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------
const outPath = outArg ?? path.join("public", "itineraries", `${trip.slug}.pdf`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({ path: outPath, format: "A4", printBackground: true });
} finally {
  await browser.close();
}

const pages = (html.match(/class="page/g) ?? []).length;
console.log(
  `wrote ${outPath} — ${trip.title}, ${trip.duration_days}D/${trip.duration_nights}N, ` +
    `${departure ? dateRange() : "no departure"}, ${rupees(finalPrice)}` +
    `${promoLabel ? ` after ${promoLabel}` : ""} (${pages} pages)` +
    `${trip.is_published ? "" : " — DRAFT, this escape is not on the public site"}`
);
