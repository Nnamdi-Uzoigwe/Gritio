/*
 * Checks every text and graphic color pair in src/theme/tokens.ts against WCAG.
 * Text needs 4.5:1, meaningful graphics and input borders need 3:1.
 * Run from the project folder:  node scripts/contrast-report.js
 */
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "theme", "tokens.ts"),
  "utf8",
);

function block(name) {
  const match = source.match(
    new RegExp(`export const ${name}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!match) throw new Error(`Could not find ${name} in tokens.ts`);
  return match[1];
}

function hexMap(text) {
  const map = {};
  const re = /^\s*([A-Za-z]+):\s*'(#[0-9A-Fa-f]{6})'/gm;
  let m;
  while ((m = re.exec(text))) map[m[1]] = m[2];
  return map;
}

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};
const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, bg, alpha) =>
  "#" +
  rgb(fg)
    .map((c, i) =>
      Math.round(c * alpha + rgb(bg)[i] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const TEXT_PAIRS = [
  [
    "text",
    [
      "background",
      "surface",
      "surfaceSunken",
      "primarySoft",
      "successSoft",
      "warningSoft",
      "errorSoft",
    ],
  ],
  ["textSecondary", ["background", "surface", "surfaceSunken", "primarySoft"]],
  ["textMuted", ["background", "surface", "surfaceSunken", "primarySoft"]],
  ["primaryText", ["background", "surface", "surfaceSunken", "primarySoft"]],
  ["onPrimary", ["primary"]],
  ["onSuccess", ["success"]],
  ["success", ["background", "surface", "successSoft"]],
  ["warning", ["background", "surface", "warningSoft"]],
  ["error", ["background", "surface", "errorSoft"]],
];

const GRAPHIC_PAIRS = [
  ["primaryGraphic", ["background", "surface", "surfaceSunken", "primarySoft"]],
  ["inputBorder", ["background", "surface"]],
  ["success", ["surfaceSunken"]],
];

let failures = 0;
const report = (theme, value, min, label) => {
  const pass = value >= min;
  if (!pass) failures += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${theme.padEnd(5)}  ${label.padEnd(44)} ${value.toFixed(2)}  (needs ${min})`,
  );
};

function checkTheme(theme, colors, tints) {
  for (const [fg, backgrounds] of TEXT_PAIRS) {
    for (const bg of backgrounds)
      report(theme, ratio(colors[fg], colors[bg]), 4.5, `${fg} on ${bg}`);
  }
  report(
    theme,
    ratio("#FFFFFF", colors.warning),
    4.5,
    "white swipe text on warning",
  );

  for (const [fg, backgrounds] of GRAPHIC_PAIRS) {
    for (const bg of backgrounds)
      report(
        theme,
        ratio(colors[fg], colors[bg]),
        3,
        `${fg} on ${bg} (graphic)`,
      );
  }

  // Focus area icons sit on their own tint at about 13% over the surface, in both themes.
  for (const [id, tint] of Object.entries(tints)) {
    const base = blend(tint, colors.surface, 0x22 / 255);
    report(theme, ratio(tint, base), 3, `${id} icon on its tint (graphic)`);
  }
}

const light = hexMap(block("lightColors"));
const dark = hexMap(block("darkColors"));
const tints = hexMap(block("focusAreaTints"));
checkTheme("light", light, tints);
checkTheme("dark", dark, tints);

console.log(
  failures === 0
    ? "\nAll pairs pass."
    : `\n${failures} pair(s) fail. Adjust the colors in src/theme/tokens.ts and run again.`,
);
process.exit(failures === 0 ? 0 : 1);
