/*
 * Scans the app's visible strings for wording that could read as guilt or blame.
 * Run from the project folder:  node scripts/audit-copy.js
 * Findings are reviewed by a person: a word is not always wrong, so the ALLOWED list holds
 * phrases that are fine in context (for example system errors, or a positive "behind you").
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

const WORDS = [
  "missed",
  "miss",
  "failed",
  "failure",
  "overdue",
  "behind",
  "lost",
  "late",
  "broke",
  "broken",
  "lazy",
  "should have",
  "you didn't",
  "give up",
  "gave up",
  "streak lost",
  "losing",
  "disappoint",
  "guilt",
  "punish",
];

const ALLOWED = [
  "behind you",
  "restore failed",
  "be lost",
  "will be lost",
  "can be lost",
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const STRING_RE = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;

function candidates(line) {
  const found = [];
  let m;
  STRING_RE.lastIndex = 0;
  while ((m = STRING_RE.exec(line))) found.push(m[2]);
  const bare = /^\s*([A-Za-z][^<>{}=;()]*)$/.exec(line);
  if (bare) found.push(bare[1]);
  const inline = />([^<>{}]+)</g;
  while ((m = inline.exec(line))) found.push(m[1]);
  return found;
}

const matchers = WORDS.map((word) => ({
  word,
  re: new RegExp(`\\b${word}\\b`, "i"),
}));
const findings = [];

for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (
      !line ||
      line.startsWith("//") ||
      line.startsWith("*") ||
      line.startsWith("/*")
    )
      return;
    if (line.startsWith("import ") || line.includes("console.")) return;

    for (const text of candidates(raw)) {
      const lower = text.toLowerCase();
      if (ALLOWED.some((phrase) => lower.includes(phrase))) continue;
      for (const { word, re } of matchers) {
        if (re.test(text)) {
          findings.push(
            `${path.relative(path.join(__dirname, ".."), file)}:${i + 1}  [${word}]  ${text.trim()}`,
          );
        }
      }
    }
  });
}

if (findings.length === 0) {
  console.log("No wording concerns found.");
  process.exit(0);
}
console.log(`${findings.length} string(s) to review:\n`);
findings.forEach((f) => console.log(f));
process.exit(1);
