import { readFile } from "node:fs/promises";

const sellerInfoUrl = new URL("../private/seller-info.md", import.meta.url);
const requiredLabels = ["販売事業者", "運営責任者", "所在地", "電話番号"];

let text = "";
try {
  text = await readFile(sellerInfoUrl, "utf8");
} catch (error) {
  console.error("private/seller-info.md is missing. Create it from the private seller information template before accepting purchases.");
  process.exit(1);
}

const failures = [];
for (const label of requiredLabels) {
  const pattern = new RegExp(`^- ${label}:[ \\t]*([^\\r\\n]*)$`, "m");
  const value = text.match(pattern)?.[1]?.trim() || "";
  if (!value) {
    failures.push(`${label} is empty`);
  }
}

if (failures.length > 0) {
  console.error(`Seller information is incomplete:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Seller information private check passed.");
