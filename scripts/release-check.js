/*
 * Release preflight. Run from the project folder:  node scripts/release-check.js
 * Exits with an error while anything that must be set before submitting is missing or still a placeholder.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const abs = (p) => path.join(root, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), "utf8");

const problems = [];
const warnings = [];
let passed = 0;

function ok(condition, message, level = "problem") {
  if (condition) {
    passed += 1;
    return;
  }
  (level === "warning" ? warnings : problems).push(message);
}

function walk(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === "node_modules" ? [] : walk(full, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

function pngInfo(file) {
  if (!exists(file)) return null;
  const buf = fs.readFileSync(abs(file));
  if (buf.length < 26 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf[25],
  };
}

// 1. App configuration
let expo = {};
try {
  expo = JSON.parse(read("app.json")).expo ?? {};
} catch (error) {
  problems.push("app.json is missing or is not valid JSON.");
}

ok(expo.name === "Gritio", 'app.json: name should be "Gritio".');
ok(
  /^\d+\.\d+\.\d+$/.test(expo.version ?? ""),
  "app.json: version should look like 1.0.0.",
);
ok(
  expo.orientation === "portrait",
  'app.json: orientation should be "portrait".',
  "warning",
);
ok(
  expo.userInterfaceStyle === "automatic",
  'app.json: userInterfaceStyle should be "automatic".',
);
ok(
  expo.ios?.supportsTablet === false,
  "app.json: ios.supportsTablet is not false (iPhone only for 1.0).",
  "warning",
);
ok(
  expo.ios?.config?.usesNonExemptEncryption === false,
  "app.json: ios.config.usesNonExemptEncryption should be false.",
);

const bundleId = expo.ios?.bundleIdentifier ?? "";
const packageName = expo.android?.package ?? "";
ok(
  /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)+$/.test(bundleId) &&
    !/yourname|example/i.test(bundleId),
  `app.json: ios.bundleIdentifier is "${bundleId}". Choose the real, permanent one.`,
);
ok(
  /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName) &&
    !/yourname|example/i.test(packageName),
  `app.json: android.package is "${packageName}". Choose the real, permanent one.`,
);

const plugins = expo.plugins ?? [];
const plugin = (name) =>
  plugins.find((p) => (Array.isArray(p) ? p[0] : p) === name);
const options = (name) =>
  Array.isArray(plugin(name)) ? (plugin(name)[1] ?? {}) : {};
ok(plugin("expo-router"), "app.json: the expo-router plugin is missing.");
ok(
  options("expo-notifications").icon,
  "app.json: the expo-notifications plugin needs the notification icon.",
);
ok(
  options("expo-local-authentication").faceIDPermission,
  "app.json: the expo-local-authentication plugin needs the Face ID text.",
);

const blocked = expo.android?.blockedPermissions ?? [];
for (const permission of [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
]) {
  ok(
    blocked.includes(permission),
    `app.json: ${permission} should be blocked (not needed, and restricted on Google Play).`,
  );
}

// 2. Icons and store graphics
const IMAGES = [
  ["assets/images/icon.png", 1024, 1024],
  ["assets/images/adaptive-icon.png", 1024, 1024],
  ["assets/images/adaptive-icon-monochrome.png", 1024, 1024],
  ["assets/images/splash-icon.png", 1024, 1024],
  ["assets/images/notification-icon.png", 96, 96],
  ["store/play-icon-512.png", 512, 512],
  ["store/play-feature-graphic.png", 1024, 500],
];
for (const [file, width, height] of IMAGES) {
  const info = pngInfo(file);
  ok(
    info && info.width === width && info.height === height,
    `${file} is missing or is not ${width} by ${height}. Run: node scripts/generate-assets.js`,
  );
}
const icon = pngInfo("assets/images/icon.png");
if (icon)
  ok(
    icon.colorType !== 6 && icon.colorType !== 4,
    "assets/images/icon.png has transparency. Apple rejects icons with an alpha channel.",
  );

// 3. In-app links
const links = exists("src/config/links.ts") ? read("src/config/links.ts") : "";
const email = (/supportEmail:\s*'([^']*)'/.exec(links) ?? [])[1] ?? "";
const policy = (/privacyPolicyUrl:\s*'([^']*)'/.exec(links) ?? [])[1] ?? "";
ok(
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),
  "src/config/links.ts: supportEmail is empty or not an email address.",
);
ok(
  /^https:\/\/\S+$/.test(policy),
  "src/config/links.ts: privacyPolicyUrl is empty or not an https address.",
);

// 4. Support and privacy site
for (const file of walk(abs("site"), [".html"])) {
  const rel = path.relative(root, file);
  const matches =
    fs.readFileSync(file, "utf8").match(/REPLACE_WITH_[A-Z_]+/g) ?? [];
  ok(
    matches.length === 0,
    `${rel} still contains ${[...new Set(matches)].join(", ")}.`,
  );
}
ok(
  exists("site/index.html") && exists("site/privacy.html"),
  "site/index.html and site/privacy.html are required.",
);

// 5. Build setup
const eas = exists("eas.json") ? JSON.parse(read("eas.json")) : null;
ok(
  eas && eas.build && eas.build.production,
  "eas.json: a production build profile is required.",
);

const pkg = JSON.parse(read("package.json"));
const deps = Object.keys(pkg.dependencies ?? {});
ok(
  pkg.scripts && pkg.scripts.test,
  'package.json: the "test" script is missing.',
);
ok(
  deps.includes("expo-dev-client"),
  "expo-dev-client is not installed (needed for development builds): npx expo install expo-dev-client",
  "warning",
);

// 6. Privacy promises: no data collecting libraries, no network calls, no dev tools in release code
const BANNED = [
  "firebase",
  "sentry",
  "amplitude",
  "mixpanel",
  "segment",
  "appsflyer",
  "adjust",
  "react-native-fbsdk",
  "google-mobile-ads",
  "purchases",
  "posthog",
  "bugsnag",
  "datadog",
  "onesignal",
];
for (const dep of deps) {
  ok(
    !BANNED.some((name) => dep.toLowerCase().includes(name)),
    `Dependency "${dep}" may collect data. Gritio promises it collects none.`,
  );
}

const FORBIDDEN = [
  [/\bfetch\s*\(/, "fetch("],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/new\s+WebSocket/, "WebSocket"],
  [/from\s+'axios'/, "axios"],
];
for (const file of walk(abs("src"), [".ts", ".tsx"])) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  for (const [pattern, name] of FORBIDDEN)
    ok(
      !pattern.test(text),
      `${rel} uses ${name}. Gritio must make no network requests.`,
    );
  if (
    !rel.endsWith(path.join("config", "links.ts")) &&
    /https?:\/\//.test(text)
  ) {
    warnings.push(
      `${rel} contains a web address. Check that the app never requests it.`,
    );
  }
  if (
    !rel.startsWith(path.join("src", "dev")) &&
    /from\s+['"]@\/dev\//.test(text)
  ) {
    problems.push(
      `${rel} imports development tools statically. Use a dynamic import inside a __DEV__ check.`,
    );
  }
}

// Report
console.log(`${passed} checks passed.`);
if (warnings.length > 0) {
  console.log(`\n${warnings.length} to review:`);
  warnings.forEach((w) => console.log(`  REVIEW  ${w}`));
}
if (problems.length > 0) {
  console.log(`\n${problems.length} to fix before release:`);
  problems.forEach((p) => console.log(`  FIX     ${p}`));
  process.exit(1);
}
console.log("\nReady for a release build.");
