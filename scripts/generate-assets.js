/*
 * Generates the app icon set from a segmented "G" that is drawn in code.
 * No font is needed. Run from the project folder:  node scripts/generate-assets.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const IMAGES = path.join(ROOT, "assets", "images");
const STORE = path.join(ROOT, "store");
const CHARCOAL = "#222222";
const GOLD = "#C49A45";
const CREAM = "#F7F6F2";
const WHITE = "#FFFFFF";

// Shape of the G. Tweak these and run the script again.
const SEGMENTS = 5; // how many arcs make up the ring
const GAP = 34; // space between arcs, measured along the ring's center line
const MOUTH = 60; // degrees of opening at the top right of the G
const R = 232; // ring radius (center line)
const SW = 96; // stroke width of the ring and the bar

const C = 512; // the G is drawn on a 1024 canvas, centered here
const SIZE = 2 * (R + SW / 2); // outer height and width of the G
const DEG = 180 / Math.PI;

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (deg) =>
  `${(C + R * Math.cos(rad(deg))).toFixed(2)} ${(C + R * Math.sin(rad(deg))).toFixed(2)}`;

/**
 * The G as separate pieces: a ring cut into arcs, plus a bar for the crossbar.
 * Each piece mirrors a segment of the progress bar on the Today screen.
 */
function glyph(arcColor, barColor) {
  const gapDeg = (GAP / R) * DEG;
  const start = -MOUTH;
  // The last arc stops one gap before it would reach the crossbar.
  const end = -360 + gapDeg;
  const each = (start - end - gapDeg * (SEGMENTS - 1)) / SEGMENTS;

  let arcs = "";
  for (let i = 0; i < SEGMENTS; i++) {
    const a1 = start - i * (each + gapDeg);
    const a2 = a1 - each;
    arcs += `<path d="M ${pt(a1)} A ${R} ${R} 0 0 0 ${pt(a2)}" fill="none" stroke="${arcColor}" stroke-width="${SW}"/>`;
  }
  const bar = `<rect x="${C}" y="${C - SW}" width="${R + SW / 2}" height="${SW}" fill="${barColor}"/>`;
  return arcs + bar;
}

/** Scales the G to the given height and centers it on (cx, cy). */
function place(cx, cy, height, arcColor, barColor) {
  const s = height / SIZE;
  const tx = cx - C * s;
  const ty = cy - C * s;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${glyph(arcColor, barColor)}</g>`;
}

const svg = (w, h, inner, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  (bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : "") +
  `${inner}</svg>`;

async function writePng(file, markup, opaque) {
  let image = sharp(Buffer.from(markup));
  if (opaque) image = image.flatten({ background: CHARCOAL });
  await image.png().toFile(file);
  console.log("wrote", path.relative(ROOT, file));
}

async function main() {
  fs.mkdirSync(IMAGES, { recursive: true });
  fs.mkdirSync(STORE, { recursive: true });

  // App Store icon: square, opaque, no rounded corners (the phone rounds it).
  const icon = svg(1024, 1024, place(512, 512, 600, GOLD, CREAM), CHARCOAL);
  await writePng(path.join(IMAGES, "icon.png"), icon, true);
  await writePng(path.join(STORE, "app-store-icon-1024.png"), icon, true);

  // Android adaptive icon files. The app.json still points at these, so they stay.
  await writePng(
    path.join(IMAGES, "adaptive-icon.png"),
    svg(1024, 1024, place(512, 512, 440, GOLD, CREAM)),
    false,
  );
  await writePng(
    path.join(IMAGES, "adaptive-icon-monochrome.png"),
    svg(1024, 1024, place(512, 512, 440, WHITE, WHITE)),
    false,
  );

  // Native splash image, shown for a moment before the animated splash.
  await writePng(
    path.join(IMAGES, "splash-icon.png"),
    svg(1024, 1024, place(512, 512, 600, GOLD, CREAM)),
    false,
  );

  // Notification icon: pure white on transparent, 96 by 96.
  await writePng(
    path.join(IMAGES, "notification-icon.png"),
    svg(96, 96, place(48, 48, 70, WHITE, WHITE)),
    false,
  );

  console.log(
    "\nDone. Open store/app-store-icon-1024.png and zoom out to check it small.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
