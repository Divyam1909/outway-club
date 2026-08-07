/**
 * Generates every derived logo the site serves from a single source file.
 *
 * Operator tool, run by hand after the brand mark changes:
 *   node scripts/build-brand-assets.mjs assets/brand/outway-logo.png
 *
 * The master artwork lives in assets/brand/ — outside public/, so the 1.5MB
 * original is never served to a browser. Only the derivatives below are.
 *
 * The supplied artwork is a black circle sitting on a near-white square. Every
 * place the site shows it, it is masked to a circle — so this trims the flat
 * border away first, then bakes the circular alpha in. That means the mark
 * renders correctly against cream, pine and whatever background a social
 * preview card puts behind it, instead of carrying a white halo.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
  console.error('usage: node scripts/build-brand-assets.mjs "<path-to-logo.png>"');
  process.exit(1);
}

const BRAND_DIR = "public/brand";
const APP_DIR = "src/app";

/** Brand cream — the site background, used where alpha isn't available. */
const CREAM = { r: 251, g: 247, b: 240, alpha: 1 };
/** The mark's own black, used to flatten iOS icons (which can't be transparent). */
const MARK_BLACK = { r: 10, g: 10, b: 10, alpha: 1 };

fs.mkdirSync(BRAND_DIR, { recursive: true });

/** Trims the flat border, leaving the mark itself edge to edge. */
function trimmed() {
  return sharp(source).trim({ threshold: 15 });
}

/** Circular alpha mask at the requested size. */
function circleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

async function roundPng(size, out) {
  const square = await trimmed()
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();

  await sharp(square)
    .composite([{ input: circleMask(size), blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  report(out);
}

async function build() {
  // --- Site UI: navbar, footer, auth screens, structured data ---------------
  await roundPng(512, path.join(BRAND_DIR, "logo.png"));

  // --- Opaque square, for anywhere alpha isn't supported --------------------
  await trimmed()
    .resize(1024, 1024, { fit: "cover" })
    .flatten({ background: CREAM })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(BRAND_DIR, "logo.jpg"));
  report(path.join(BRAND_DIR, "logo.jpg"));

  // --- Social preview: a 1.91:1 card, since a square logo gets cropped ------
  const markSize = 380;
  const mark = await trimmed()
    .resize(markSize, markSize, { fit: "cover" })
    .png()
    .toBuffer();
  const roundMark = await sharp(mark)
    .composite([{ input: circleMask(markSize), blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: CREAM },
  })
    .composite([{ input: roundMark, top: (630 - markSize) / 2, left: (1200 - markSize) / 2 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(BRAND_DIR, "og-default.png"));
  report(path.join(BRAND_DIR, "og-default.png"));

  // --- Favicon (Next.js serves src/app/icon.png automatically) -------------
  await roundPng(256, path.join(APP_DIR, "icon.png"));

  // --- iOS home screen. Apple composites onto black, so flatten deliberately.
  await trimmed()
    .resize(180, 180, { fit: "cover" })
    .flatten({ background: MARK_BLACK })
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, "apple-icon.png"));
  report(path.join(APP_DIR, "apple-icon.png"));
}

function report(file) {
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ${file} — ${kb} KB`);
}

console.log(`Building brand assets from ${source}`);
await build();
console.log("done");
