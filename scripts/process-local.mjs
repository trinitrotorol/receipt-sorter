import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "data/queue/latest.json";
const absoluteInput = path.resolve(inputPath);
const request = JSON.parse(fs.readFileSync(absoluteInput, "utf8"));

const result = {
  app: "receipt-sorter",
  processedAt: new Date().toISOString(),
  source: path.relative(process.cwd(), absoluteInput),
  status: "reviewed",
  totals: request.totals,
  suggestedActions: buildActions(request),
  reviewedItems: request.items.map((item) => reviewItem(item))
};

fs.mkdirSync("data/results", { recursive: true });
const outPath = path.join("data/results", `${Date.now()}-result.json`);
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(outPath);

function reviewItem(item) {
  const flags = [];
  if (!item.amount) flags.push("amount_missing");
  if (item.type === "unknown") flags.push("category_review");
  if (/交通費|電車|バス|タクシー|駐車|高速/.test(item.memo) && item.category !== "travel") {
    flags.push("travel_candidate");
  }
  return {
    ...item,
    flags,
    confidence: flags.length ? "medium" : "high"
  };
}

function buildActions(request) {
  const actions = [];
  if (request.totals.unknown > 0) {
    actions.push(`${request.totals.unknown}件のカテゴリを確認してください。`);
  }
  if (request.items.some((item) => !item.amount)) {
    actions.push("金額が読み取れない行を修正してください。");
  }
  actions.push("領収書・販売履歴などの証憑が保存されているか確認してください。");
  actions.push("会計ソフトへ入れる前に、売上と経費を別シートに分けてください。");
  return actions;
}

