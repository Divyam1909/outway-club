/**
 * Takes the image model's corner mark off the originals in raw-images/.
 *
 *   node scripts/clean-generated-mark.mjs          # every PNG in raw-images/
 *   node scripts/clean-generated-mark.mjs jawai    # only names matching "jawai"
 *
 * Run this before `npm run images:import`, which crops and exports whatever it
 * finds. Untouched copies are kept in raw-images/_originals/ — that folder is
 * the source of truth, and re-running reads from it, so the operation is
 * idempotent rather than compounding.
 *
 * These frames were generated, not photographed, and the site says so in
 * public/images/README.md and docs/still-to-do.md. Taking the mark out of the
 * corner does not change that, and is not meant to.
 *
 * ## How it works
 *
 * The mark is white composited over the frame at a fixed opacity and a fixed
 * inset from the bottom-right corner, so it is not damage to be painted over —
 * it is one blend to invert:
 *
 *     shown = under * (1 - a) + 255 * a      =>      under = (shown - 255a) / (1 - a)
 *
 * `assets/generated-mark-mask.png` holds the shape's coverage and CORE_OPACITY
 * its opacity. Both were measured rather than guessed: pooling all sixteen
 * frames and solving least squares per ring of the shape,
 *
 *     a = Σ (shown - scene)(255 - scene) / Σ (255 - scene)²
 *
 * against a harmonic reconstruction of the scene behind the mark. Frames with a
 * dark scene dominate that sum, which is the right weighting — they are the
 * ones where a white overlay actually shows.
 *
 * Recovery is then exact wherever the shape is fully on or fully off. It is not
 * exact on the one part-covered ring at its outline, where the true coverage
 * varies along the edge by a fraction of a pixel and a single number for the
 * ring leaves a stippled hairline; those pixels are refilled from the corrected
 * pixels around them afterwards. What survives is a handful of specks at the
 * four points of the star, visible at 300% on a smooth dark area and not at
 * all in the exported JPEGs.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const CORE_OPACITY = 0.308774;
const INSET_X = 240;
const INSET_Y = 241;

const raw = path.join(process.cwd(), "raw-images");
const originals = path.join(raw, "_originals");
const filter = process.argv[2];

const maskFile = path.join(process.cwd(), "assets", "generated-mark-mask.png");
const { data: coverage, info: maskInfo } = await sharp(maskFile)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const S = maskInfo.width;
if (maskInfo.height !== S) throw new Error("the mark mask must be square");

const alphaAt = (i) => (coverage[i] / 255) * CORE_OPACITY;

// The part-covered outline, plus a pixel, is where the algebra is weakest and
// where the refill happens. The extra pixel is for the four points of the
// star, which are sharp enough that a ring measured on the pixel grid loses
// them — and that is exactly where leftovers collect.
const outline = new Uint8Array(S * S);
for (let i = 0; i < S * S; i++) if (coverage[i] > 0 && coverage[i] < 254) outline[i] = 1;
{
  const grown = Uint8Array.from(outline);
  for (let y = 1; y < S - 1; y++)
    for (let x = 1; x < S - 1; x++) {
      if (outline[y * S + x]) continue;
      if (outline[(y - 1) * S + x] || outline[(y + 1) * S + x] ||
          outline[y * S + x - 1] || outline[y * S + x + 1]) grown[y * S + x] = 1;
    }
  outline.set(grown);
}

if (!fs.existsSync(raw)) {
  console.log("raw-images/ is not there — nothing to clean.");
  process.exit(0);
}
fs.mkdirSync(originals, { recursive: true });

let cleaned = 0;
for (const file of fs.readdirSync(raw).filter((n) => n.toLowerCase().endsWith(".png"))) {
  if (filter && !file.includes(filter)) continue;

  // First run for a file banks the original; every run after that works from
  // the banked copy, so cleaning twice is the same as cleaning once.
  const kept = path.join(originals, file);
  if (!fs.existsSync(kept)) fs.copyFileSync(path.join(raw, file), kept);

  const { data, info } = await sharp(kept).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  if (W < S + INSET_X || H < S + INSET_Y) {
    console.log(`${file.padEnd(42)} skipped — too small for the mark to be where it always is`);
    continue;
  }
  const ox = W - INSET_X - S / 2;
  const oy = H - INSET_Y - S / 2;

  const undone = Buffer.from(data);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const a = alphaAt(y * S + x);
      if (a <= 0) continue;
      const i = ((oy + y) * W + (ox + x)) * C;
      for (let c = 0; c < 3; c++)
        undone[i + c] = Math.round(Math.min(255, Math.max(0, (data[i + c] - 255 * a) / (1 - a))));
    }

  const out = Buffer.from(undone);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (!outline[y * S + x]) continue;
      const i = ((oy + y) * W + (ox + x)) * C;
      for (let c = 0; c < 3; c++) {
        const near = [];
        for (let dy = -4; dy <= 4; dy++)
          for (let dx = -4; dx <= 4; dx++) {
            const sx = x + dx, sy = y + dy;
            if (sx < 0 || sy < 0 || sx >= S || sy >= S) continue;
            if (outline[sy * S + sx]) continue;         // only pixels the algebra got right
            near.push(undone[((oy + sy) * W + (ox + sx)) * C + c]);
          }
        if (near.length >= 8) {
          near.sort((p, q) => p - q);
          out[i + c] = near[near.length >> 1];
        }
      }
    }

  await sharp(out, { raw: { width: W, height: H, channels: C } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(raw, file));
  console.log(`${file.padEnd(42)} ${W}×${H}  mark removed`);
  cleaned += 1;
}

console.log(`\n${cleaned} frame(s) cleaned. Originals are in raw-images/_originals/.`);
console.log("Run `npm run images:import` to re-export public/images.");
