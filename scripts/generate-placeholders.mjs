/**
 * Generates on-brand placeholder photography.
 *
 * These exist so the site never requests a missing file — a real JPEG at the
 * exact path and aspect ratio each layout expects. Drop real photography over
 * the top with the same filenames and nothing else needs to change.
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Prompts for the real images are in docs/photography-prompts.md.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const PINE = { deep: "#102019", mid: "#1E3D32", light: "#2C5A49" };
const CREAM = "#FBF7F0";
const GOLD = "#D9A441";

const TARGETS = [
  { file: "escape-001/hero.jpg", w: 2400, h: 1350, label: "Escape 001", sub: "Udaipur × Mount Abu" },
  { file: "escape-001/gallery-1.jpg", w: 1600, h: 1200, label: "Escape 001", sub: "Ambrai Ghat" },
  { file: "escape-001/gallery-2.jpg", w: 2000, h: 1125, label: "Escape 001", sub: "The Aravalli drive" },
  { file: "escape-001/gallery-3.jpg", w: 1400, h: 1750, label: "Escape 001", sub: "Dilwara" },
  { file: "escape-001/gallery-4.jpg", w: 1200, h: 1200, label: "Escape 001", sub: "Guru Shikhar" },
  { file: "escape-001/gallery-5.jpg", w: 1200, h: 1200, label: "Escape 001", sub: "Nakki Lake" },
  { file: "udaipur/hero.jpg", w: 2400, h: 1350, label: "Udaipur", sub: "Rajasthan" },
  { file: "udaipur/gallery-1.jpg", w: 1200, h: 1200, label: "Udaipur", sub: "The ghats" },
  { file: "udaipur/gallery-2.jpg", w: 1200, h: 1200, label: "Udaipur", sub: "Old city" },
  { file: "udaipur/gallery-3.jpg", w: 1200, h: 1200, label: "Udaipur", sub: "Lake Pichola" },
  { file: "udaipur/gallery-4.jpg", w: 1200, h: 1200, label: "Udaipur", sub: "On the table" },
];

/** Layered ridgelines, scaled to the frame so every crop looks composed. */
function ridges(w, h) {
  const base = h * 0.72;
  const layer = (offset, opacity, amplitude) => {
    const y = base + offset;
    const points = [
      `0,${h}`,
      `0,${y + amplitude * 0.5}`,
      `${w * 0.18},${y - amplitude}`,
      `${w * 0.31},${y - amplitude * 0.35}`,
      `${w * 0.47},${y - amplitude * 1.5}`,
      `${w * 0.62},${y - amplitude * 0.4}`,
      `${w * 0.78},${y - amplitude * 1.1}`,
      `${w},${y - amplitude * 0.2}`,
      `${w},${h}`,
    ].join(" ");
    return `<polygon points="${points}" fill="${CREAM}" opacity="${opacity}"/>`;
  };

  return [
    layer(h * 0.06, 0.05, h * 0.2),
    layer(h * 0.15, 0.045, h * 0.14),
    layer(h * 0.24, 0.04, h * 0.09),
  ].join("");
}

function svg({ w, h, label, sub }) {
  const unit = Math.min(w, h);
  const markSize = unit * 0.1;
  const cx = w / 2;
  const cy = h / 2 - unit * 0.06;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.65" y2="1">
      <stop offset="0%" stop-color="${PINE.light}"/>
      <stop offset="55%" stop-color="${PINE.mid}"/>
      <stop offset="100%" stop-color="${PINE.deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.38" r="0.62">
      <stop offset="0%" stop-color="${CREAM}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${CREAM}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${ridges(w, h)}
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  <g transform="translate(${cx - markSize} ${cy - markSize * 0.55})">
    <path d="M0 ${markSize * 1.1} L${markSize * 0.62} ${markSize * 0.28} L${markSize * 1.02} ${markSize * 0.78} L${markSize * 1.28} ${markSize * 0.5} L${markSize * 2} ${markSize * 1.1}"
      fill="none" stroke="${GOLD}" stroke-opacity="0.85"
      stroke-width="${Math.max(2, unit * 0.007)}" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${markSize * 1.55}" cy="${markSize * 0.2}" r="${markSize * 0.16}"
      fill="none" stroke="${GOLD}" stroke-opacity="0.85" stroke-width="${Math.max(2, unit * 0.007)}"/>
  </g>

  <text x="${cx}" y="${cy + unit * 0.16}" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif" font-size="${unit * 0.062}"
    font-weight="600" fill="${CREAM}" fill-opacity="0.9">${label}</text>

  <text x="${cx}" y="${cy + unit * 0.235}" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-size="${unit * 0.026}"
    letter-spacing="${unit * 0.012}" fill="${CREAM}" fill-opacity="0.5">${sub.toUpperCase()}</text>

  <text x="${cx}" y="${h - unit * 0.055}" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-size="${unit * 0.019}"
    letter-spacing="${unit * 0.008}" fill="${CREAM}" fill-opacity="0.28">PHOTOGRAPHY PENDING</text>
</svg>`;
}

const root = path.join(process.cwd(), "public", "images");

for (const target of TARGETS) {
  const destination = path.join(root, target.file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });

  await sharp(Buffer.from(svg(target)))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(destination);

  const { size } = fs.statSync(destination);
  console.log(`${target.file.padEnd(30)} ${target.w}×${target.h}  ${(size / 1024).toFixed(0)}KB`);
}

console.log(`\n${TARGETS.length} placeholders written to public/images.`);
console.log("Overwrite them with real photography using the same filenames.");
