/**
 * Turns the unprocessed originals in raw-images/ into the web JPEGs the site
 * actually serves.
 *
 *   node scripts/import-photography.mjs            # write every slot
 *   node scripts/import-photography.mjs jawai      # only the paths matching "jawai"
 *
 * raw-images/ is gitignored and holds one PNG per slot, named
 * `<set>-<slot>-<subject>.png`. This reads that folder, trims any uniform
 * white print border the generator left around the frame, crops to the exact
 * aspect ratio the layout expects, and writes a stripped sRGB JPEG into
 * public/images. EXIF — GPS included — does not survive, because sharp only
 * carries metadata through when asked to.
 *
 * The sizes below must stay in step with scripts/generate-placeholders.mjs and
 * public/images/README.md. A source in the wrong shape is centre-cropped
 * rather than squashed, so a photograph framed to the documented ratio is the
 * one that survives the trip intact.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const SLOTS = [
  // Jawai — Escape 001, early September, the tail of the monsoon.
  { source: "jawai-hero-granite-country.png", file: "jawai/hero.jpg", w: 2400, h: 1350 },
  { source: "jawai-gallery-1-rabari-shepherd.png", file: "jawai/gallery-1.jpg", w: 1600, h: 1200 },
  { source: "jawai-gallery-2-open-jeep.png", file: "jawai/gallery-2.jpg", w: 2000, h: 1125 },
  { source: "jawai-gallery-3-leopard-on-granite.png", file: "jawai/gallery-3.jpg", w: 1400, h: 1750 },
  { source: "jawai-gallery-4-chai-at-sunset.png", file: "jawai/gallery-4.jpg", w: 1200, h: 1200 },
  { source: "jawai-gallery-5-story-circle.png", file: "jawai/gallery-5.jpg", w: 1200, h: 1200 },
  { source: "jawai-gallery-6-jawai-bandh.png", file: "jawai/gallery-6.jpg", w: 1200, h: 1200 },

  // Jodhpur — Escape 002, late October, post-monsoon.
  { source: "jodhpur-hero-blue-city.png", file: "jodhpur/hero.jpg", w: 2400, h: 1350 },
  { source: "jodhpur-gallery-1-old-city-lane.png", file: "jodhpur/gallery-1.jpg", w: 1600, h: 1200 },
  // The matte on this one is a U rather than a full frame: a 30px white band
  // runs the whole bottom edge and turns up both sides for the last few
  // hundred rows. borderInset only finds bands that cross an entire edge, so
  // the two uprights are named here rather than guessed at.
  {
    source: "jodhpur-gallery-2-toorji-ka-jhalra.png",
    file: "jodhpur/gallery-2.jpg",
    w: 1200,
    h: 1200,
    inset: { left: 34, right: 34, bottom: 34 },
  },
  { source: "jodhpur-gallery-3-marwari-thali.png", file: "jodhpur/gallery-3.jpg", w: 1200, h: 1200 },
  { source: "jodhpur-gallery-4-jaswant-thada.png", file: "jodhpur/gallery-4.jpg", w: 1200, h: 1200 },

  // The Outway set. Not a place — these carry the brand argument, and they are
  // referenced from code rather than from a trip row.
  { source: "outway-the-table-shared-dinner.png", file: "outway/the-table.jpg", w: 2000, h: 1125 },
  { source: "outway-story-circle-under-the-stars.png", file: "outway/story-circle.jpg", w: 1400, h: 1750 },
  { source: "outway-the-letter-last-evening.png", file: "outway/the-letter.jpg", w: 1200, h: 1200 },
  { source: "outway-the-road-jawai-to-udaipur.png", file: "outway/the-road.jpg", w: 2000, h: 1125 },
];

/**
 * Width of the uniform near-white frame on each edge, if there is one.
 *
 * Some of the sources come back matted like a photographic print. Left in, that
 * white band reads as a rendering bug once the file sits in a dark pine
 * section, and `object-cover` cannot crop it away because it is on all four
 * sides. Detection is deliberately strict — a row only counts as border if
 * essentially every pixel in it is near-white — so a genuinely blown-out sky
 * or a white marble wall running to the edge is left alone.
 */
async function borderInset(image) {
  const { width, height } = await image.metadata();
  const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;

  const pale = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
  };
  const rowIsBorder = (y) => {
    for (let x = 0; x < width; x += 4) if (!pale(x, y)) return false;
    return true;
  };
  const colIsBorder = (x) => {
    for (let y = 0; y < height; y += 4) if (!pale(x, y)) return false;
    return true;
  };

  let top = 0;
  while (top < height / 4 && rowIsBorder(top)) top += 1;
  let bottom = 0;
  while (bottom < height / 4 && rowIsBorder(height - 1 - bottom)) bottom += 1;
  let left = 0;
  while (left < width / 4 && colIsBorder(left)) left += 1;
  let right = 0;
  while (right < width / 4 && colIsBorder(width - 1 - right)) right += 1;

  // A pixel of slop on each side, so a soft edge doesn't leave a pale hairline.
  const pad = (n) => (n > 0 ? n + 2 : 0);
  return { top: pad(top), bottom: pad(bottom), left: pad(left), right: pad(right), width, height };
}

const filter = process.argv[2];
const raw = path.join(process.cwd(), "raw-images");
const root = path.join(process.cwd(), "public", "images");

let written = 0;
let missing = 0;

for (const slot of SLOTS) {
  if (filter && !slot.file.includes(filter) && !slot.source.includes(filter)) continue;

  const origin = path.join(raw, slot.source);
  if (!fs.existsSync(origin)) {
    console.log(`${slot.file.padEnd(28)} skipped — raw-images/${slot.source} is not there`);
    missing += 1;
    continue;
  }

  const image = sharp(origin);
  const found = await borderInset(image);
  const inset = { ...found, ...slot.inset };
  const cropped = inset.top || inset.bottom || inset.left || inset.right;
  const trimmed = cropped
    ? image.extract({
        left: inset.left,
        top: inset.top,
        width: inset.width - inset.left - inset.right,
        height: inset.height - inset.top - inset.bottom,
      })
    : image;

  const destination = path.join(root, slot.file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });

  await trimmed
    .resize(slot.w, slot.h, { fit: "cover", position: "centre" })
    .toColorspace("srgb")
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(destination);

  const { size } = fs.statSync(destination);
  const note = cropped ? "  (white border trimmed)" : "";
  console.log(`${slot.file.padEnd(28)} ${slot.w}×${slot.h}  ${(size / 1024).toFixed(0)}KB${note}`);
  written += 1;
}

console.log(`\n${written} image(s) written to public/images${missing ? `, ${missing} still missing` : ""}.`);
