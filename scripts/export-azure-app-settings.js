/**
 * Reads .env.local and writes Azure Static Web Apps / App Service "advanced edit" JSON:
 * [ { "name": "KEY", "value": "..." }, ... ]
 *
 * Output path (repo root): azure-app-settings.generated.json
 * Run: npm run export:azure-env
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const outName = "azure-app-settings.generated.json";
const outPath = path.join(root, outName);

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local at:", envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);
const map = new Map();

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const name = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (name) map.set(name, value);
}

const arr = [...map.entries()].map(([name, value]) => ({ name, value }));
fs.writeFileSync(outPath, JSON.stringify(arr, null, 2) + "\n", "utf8");

console.log("Wrote Azure app settings JSON:");
console.log(outPath);
console.log("(" + arr.length + " entries)");
