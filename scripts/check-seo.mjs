import { readFile } from "node:fs/promises";

const publicDir = new URL("../public/", import.meta.url);
const remoteBaseUrl = process.argv[2] || "";
const siteBase = "https://receipt-sorter.pages.dev";
const ogImageUrl = `${siteBase}/assets/month-end-desk-900.webp`;

const indexablePages = [
  { path: "/", file: "index.html", canonical: `${siteBase}/` },
  { path: "/app", file: "app.html", canonical: `${siteBase}/app` },
  { path: "/checkout", file: "checkout.html", canonical: `${siteBase}/checkout` },
  { path: "/furima-monthly-memo", file: "furima-monthly-memo.html", canonical: `${siteBase}/furima-monthly-memo` },
  { path: "/legal", file: "legal.html", canonical: `${siteBase}/legal` },
  { path: "/privacy", file: "privacy.html", canonical: `${siteBase}/privacy` }
];

const sitemapUrls = indexablePages.map(page => page.canonical);
const forbiddenTrademarkPhrases = [
  "メルカリ月末メモ",
  "メルカリ用",
  "メルカリ対応",
  "メルカリ連携",
  "メルカリ公式",
  "メルカリ専用"
];

async function readText(relativeOrPath) {
  if (!remoteBaseUrl) {
    return readFile(new URL(`../public/${relativeOrPath}`, import.meta.url), "utf8");
  }

  const base = remoteBaseUrl.replace(/\/$/, "");
  const urlPath = relativeOrPath.startsWith("/") ? relativeOrPath : `/${relativeOrPath}`;
  const response = await fetch(`${base}${urlPath}`, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${urlPath}: HTTP ${response.status}`);
  }
  return response.text();
}

function attrValue(html, selector) {
  const match = html.match(selector);
  return match?.[1]?.trim() || "";
}

function titleValue(html) {
  return attrValue(html, /<title>([^<]+)<\/title>/i);
}

function metaName(html, name) {
  return attrValue(html, new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, "i"));
}

function metaProperty(html, property) {
  return attrValue(html, new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, "i"));
}

function canonicalValue(html) {
  return attrValue(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
}

function ldJsonBlocks(html) {
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => JSON.parse(match[1]));
}

function includesAny(text, needles) {
  return needles.filter(needle => text.includes(needle));
}

const failures = [];
const pageTexts = new Map();

for (const page of indexablePages) {
  const text = await readText(remoteBaseUrl ? page.path : page.file);
  pageTexts.set(page.file, text);

  const checks = [
    ["title", titleValue(text)],
    ["description", metaName(text, "description")],
    ["canonical", canonicalValue(text)],
    ["og:title", metaProperty(text, "og:title")],
    ["og:description", metaProperty(text, "og:description")],
    ["og:url", metaProperty(text, "og:url")],
    ["og:image", metaProperty(text, "og:image")],
    ["twitter:card", metaName(text, "twitter:card")]
  ];

  for (const [name, value] of checks) {
    if (!value) failures.push(`${page.file}: missing ${name}`);
  }

  if (canonicalValue(text) !== page.canonical) {
    failures.push(`${page.file}: canonical mismatch`);
  }
  if (metaProperty(text, "og:url") !== page.canonical) {
    failures.push(`${page.file}: og:url mismatch`);
  }
  if (metaProperty(text, "og:image") !== ogImageUrl) {
    failures.push(`${page.file}: og:image mismatch`);
  }

  for (const phrase of includesAny(text, forbiddenTrademarkPhrases)) {
    failures.push(`${page.file}: risky trademark phrase "${phrase}"`);
  }
}

const checkoutLd = ldJsonBlocks(pageTexts.get("checkout.html") || "");
const productBlocks = checkoutLd.filter(block => block["@type"] === "Product");
if (productBlocks.length !== 1) {
  failures.push(`checkout.html: expected exactly one Product JSON-LD block, found ${productBlocks.length}`);
} else {
  const product = productBlocks[0];
  const offer = product.offers || {};
  const requiredProductFields = [
    ["name", product.name],
    ["description", product.description],
    ["image", product.image],
    ["offers.price", offer.price],
    ["offers.priceCurrency", offer.priceCurrency],
    ["offers.url", offer.url]
  ];
  for (const [name, value] of requiredProductFields) {
    if (!value) failures.push(`checkout.html Product JSON-LD: missing ${name}`);
  }
  for (const unsupported of ["review", "aggregateRating", "ratingValue", "reviewRating", "inventoryLevel"]) {
    if (JSON.stringify(product).includes(unsupported)) {
      failures.push(`checkout.html Product JSON-LD: unsupported field ${unsupported}`);
    }
  }
}

for (const page of indexablePages.filter(page => page.file !== "checkout.html")) {
  const products = ldJsonBlocks(pageTexts.get(page.file) || "").filter(block => block["@type"] === "Product");
  if (products.length > 0) {
    failures.push(`${page.file}: Product JSON-LD should only be on checkout`);
  }
}

const successText = await readText(remoteBaseUrl ? "/success" : "success.html");
if (!/<meta\s+name=["']robots["']\s+content=["']noindex["']/i.test(successText)) {
  failures.push("success.html: missing noindex");
}

const robotsText = await readText("robots.txt");
if (!robotsText.includes(`Sitemap: ${siteBase}/sitemap.xml`)) {
  failures.push("robots.txt: missing sitemap URL");
}
if (/Disallow:\s*\/success\b/i.test(robotsText)) {
  failures.push("robots.txt: must not block /success; use noindex instead");
}

const sitemapText = await readText("sitemap.xml");
for (const url of sitemapUrls) {
  if (!sitemapText.includes(`<loc>${url}</loc>`)) {
    failures.push(`sitemap.xml: missing ${url}`);
  }
}
if (sitemapText.includes(`${siteBase}/success`)) {
  failures.push("sitemap.xml: must not include /success");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`SEO checks passed for ${indexablePages.length} ${remoteBaseUrl ? "remote" : "local"} pages.`);
