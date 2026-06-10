import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = new URL("../", import.meta.url);
const publicDir = new URL("../public/", import.meta.url);
const configText = await readFile(new URL("../public/sales-config.js", import.meta.url), "utf8");
const salesEnabled = /salesEnabled:\s*true/.test(configText);
const stripePaymentUrl = configText.match(/stripePaymentUrl:\s*"([^"]+)"/)?.[1] || "";

const forbiddenPublicPatterns = [
  { name: "file upload input", pattern: /<input\b[^>]*type=["']?file/i },
  { name: "form action", pattern: /<form\b[^>]*\baction\s*=/i },
  { name: "network fetch", pattern: /\bfetch\s*\(/i },
  { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/i },
  { name: "sendBeacon", pattern: /\bsendBeacon\s*\(/i },
  { name: "inline live key", pattern: /\b(?:sk|pk)_live_[A-Za-z0-9]+/i },
  { name: "active external checkout", pattern: /https:\/\/(?:buy|checkout)\.stripe\.com/i },
  { name: "analytics tag", pattern: /gtag|google-analytics|plausible|googletagmanager/i },
  { name: "remote script", pattern: /<script\b[^>]*\bsrc=["']https?:\/\//i }
];

const requiredPublicFiles = [
  "index.html",
  "app.html",
  "checkout.html",
  "success.html",
  "legal.html",
  "privacy.html",
  "sales-config.js",
  "styles.css"
];

const forbiddenPublicNames = [
  ".env",
  ".env.local",
  "wrangler.toml",
  "package-lock.json"
];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  }));
  return nested.flat();
}

const failures = [];
const publicFiles = await listFiles(publicDir.pathname);
const publicRelatives = publicFiles.map(file => path.relative(publicDir.pathname, file));

for (const file of requiredPublicFiles) {
  if (!publicRelatives.includes(file)) {
    failures.push(`public/${file}: missing`);
  }
}

for (const file of publicFiles) {
  const relative = path.relative(publicDir.pathname, file);
  if (forbiddenPublicNames.includes(path.basename(relative))) {
    failures.push(`public/${relative}: forbidden public file`);
  }

  if (/\.(?:html|js)$/i.test(file)) {
    const text = await readFile(file, "utf8");
    for (const rule of forbiddenPublicPatterns) {
      if (salesEnabled && rule.name === "active external checkout") {
        if (rule.pattern.test(text) && !text.includes(stripePaymentUrl)) {
          failures.push(`public/${relative}: unexpected external checkout`);
        }
        continue;
      }
      if (rule.pattern.test(text)) {
        failures.push(`public/${relative}: ${rule.name}`);
      }
    }
  }
}

for (const localOnly of [".env.local", ".wrangler"]) {
  try {
    await stat(new URL(localOnly, rootDir));
  } catch {
    continue;
  }
  if (publicRelatives.some(file => file === localOnly || file.startsWith(`${localOnly}/`))) {
    failures.push(`local-only ${localOnly} is under public/`);
  }
}

if (failures.length > 0) {
  console.error("Security check failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Security check passed: no upload inputs, server-submit forms, external send calls, live keys, unexpected external checkout links, analytics tags, or local secret files in public output.");
