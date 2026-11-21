/*
 * Generates the app icon set and the store graphics from the Fraunces font already in node_modules.
 * Run from the project folder:  node scripts/generate-assets.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const opentype = require("opentype.js");

const ROOT = path.join(__dirname, "..");
const IMAGES = path.join(ROOT, "assets", "images");
const STORE = path.join(ROOT, "store");
const CHARCOAL = "#222222";
const GOLD = "#C49A45";

function findFont() {
  const base = path.join(
    ROOT,
    "node_modules",
    "@expo-google-fonts",
    "fraunces",
  );
  const found = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ttf")) found.push(full);
    }
  })(base);
  const named = (name) => found.find((f) => path.basename(f) === name);
  const pick =
    named("Fraunces_700Bold.ttf") ||
    named("Fraunces_600SemiBold.ttf") ||
    found.find((f) => !/italic/i.test(f));
  if (!pick)
    throw new Error(
      "Could not find a Fraunces font in node_modules/@expo-google-fonts/fraunces.",
    );
  return pick;
}

function loadFont() {
  const buffer = fs.readFileSync(findFont());
  return opentype.parse(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  );
}

/** Turns text into a path, measured at a large size so it can be scaled and centered exactly. */
function shape(font, text) {
  const p = font.getPath(text, 0, 0, 1000);
  return { d: p.toPathData(2), box: p.getBoundingBox() };
}

/** Scales the shape to the given height and centers it on (cx, cy). */
function place(info, cx, cy, height, fill) {
  const { box } = info;
  const w = box.x2 - box.x1;
  const h = box.y2 - box.y1;
  const s = height / h;
  const tx = cx - s * (box.x1 + w / 2);
  const ty = cy - s * (box.y1 + h / 2);
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})"><path d="${info.d}" fill="${fill}"/></g>`;
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

  const font = loadFont();
  const g = shape(font, "G");
  const word = shape(font, "Gritio");

  // App Store icon: square, opaque, no rounded corners (the phone rounds it).
  await writePng(
    path.join(IMAGES, "icon.png"),
    svg(1024, 1024, place(g, 512, 512, 560, GOLD), CHARCOAL),
    true,
  );

  // Android adaptive icon: the foreground sits inside the safe zone, the background color is set in app.json.
  await writePng(
    path.join(IMAGES, "adaptive-icon.png"),
    svg(1024, 1024, place(g, 512, 512, 400, GOLD)),
    false,
  );
  await writePng(
    path.join(IMAGES, "adaptive-icon-monochrome.png"),
    svg(1024, 1024, place(g, 512, 512, 400, "#FFFFFF")),
    false,
  );

  // Native splash image, shown for a moment before the animated splash.
  await writePng(
    path.join(IMAGES, "splash-icon.png"),
    svg(1024, 1024, place(g, 512, 512, 600, GOLD)),
    false,
  );

  // Android notification icon: pure white on transparent, 96 by 96.
  await writePng(
    path.join(IMAGES, "notification-icon.png"),
    svg(96, 96, place(g, 48, 48, 66, "#FFFFFF")),
    false,
  );

  // Store graphics.
  await writePng(
    path.join(STORE, "app-store-icon-1024.png"),
    svg(1024, 1024, place(g, 512, 512, 560, GOLD), CHARCOAL),
    true,
  );
  await sharp(path.join(IMAGES, "icon.png"))
    .resize(512, 512)
    .png()
    .toFile(path.join(STORE, "play-icon-512.png"));
  console.log("wrote store/play-icon-512.png");
  await writePng(
    path.join(STORE, "play-feature-graphic.png"),
    svg(1024, 500, place(word, 512, 250, 170, GOLD), CHARCOAL),
    true,
  );

  console.log(
    "\nDone. Open assets/images/icon.png and store/play-feature-graphic.png to check them.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
