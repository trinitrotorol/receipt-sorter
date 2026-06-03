const notes = document.getElementById("raw-notes");
const period = document.getElementById("period");
const platform = document.getElementById("platform");
const reviewRequest = document.getElementById("review-request");
const previewButton = document.getElementById("preview-button");
const demoButton = document.getElementById("demo-button");
const csvButton = document.getElementById("csv-button");
const csvButtonBottom = document.getElementById("csv-button-bottom");
const reviewButton = document.getElementById("review-button");
const checklistButton = document.getElementById("checklist-button");
const cards = document.getElementById("result-cards");
const summary = document.getElementById("summary");
const checklist = document.getElementById("checklist");
const statusPill = document.getElementById("status-pill");
const reviewCount = document.getElementById("review-count");
const confidenceBar = document.getElementById("confidence-bar");

let latestPackage = null;

const demoText = [
  "6/1 メルカリ 売上 2,480円",
  "6/1 メルカリ 送料 750円",
  "6/2 BOOTH 売上 3,200円",
  "Amazon 梱包材 1,180円",
  "コンビニ コピー代 240円",
  "イベント交通費 680円"
].join("\n");

const categoryLabels = {
  sales: "売上",
  fee: "手数料",
  shipping: "発送",
  supplies: "備品",
  printing: "印刷",
  travel: "交通",
  software: "ソフト",
  meeting: "打合せ",
  needs_review: "要確認"
};

const expenseRules = [
  ["fee", /手数料|販売手数料|決済手数料/],
  ["shipping", /送料|配送|切手|レターパック|宅急便|ゆうパック/],
  ["supplies", /梱包|封筒|段ボール|ラベル|文具|備品/],
  ["printing", /コピー|印刷|プリント/],
  ["travel", /交通|電車|バス|タクシー|駐車|高速/],
  ["software", /サーバ|ドメイン|ソフト|アプリ|SaaS|月額/],
  ["meeting", /打ち合わせ|会議|カフェ|コーヒー/]
];

const incomeRules = /売上|入金|販売|報酬|BOOTH|BASE|メルカリ|Mercari|Shopify/i;
const categoryOptions = [
  ["sales", "売上"],
  ["fee", "手数料"],
  ["shipping", "発送"],
  ["supplies", "備品"],
  ["printing", "印刷"],
  ["travel", "交通"],
  ["software", "ソフト"],
  ["meeting", "打合せ"],
  ["needs_review", "要確認"]
];

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

function parseAmount(line) {
  const normalized = line.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 65248));
  const match = normalized.match(/([0-9][0-9,]*)\s*円?/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function categorize(line) {
  for (const [category, pattern] of expenseRules) {
    if (pattern.test(line)) return { type: "expense", category };
  }
  if (incomeRules.test(line)) return { type: "income", category: "sales" };
  return { type: "unknown", category: "needs_review" };
}

function parseNotes(raw) {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const classified = categorize(line);
      return {
        id: `line-${index + 1}`,
        type: classified.type,
        category: classified.category,
        amount: parseAmount(line),
        memo: line
      };
    });
}

function buildPackage() {
  const items = parseNotes(notes.value);
  const normalizedItems = normalizeItems(items);
  const totals = calculateTotals(normalizedItems);

  return {
    app: "receipt-sorter",
    version: "0.1.0",
    createdAt: new Date().toISOString(),
    period: period.value || null,
    platform: platform.value,
    reviewRequested: reviewRequest.checked,
    totals,
    items: normalizedItems,
    checklist: buildChecklist(normalizedItems, totals)
  };
}

function normalizeItems(items) {
  return items.map((item) => ({
    ...item,
    exportColumn: item.type === "income" ? "income" : "expense",
    note: item.type === "unknown" ? "分類を確認" : ""
  }));
}

function buildChecklist(items, totals) {
  const list = [];
  if (!items.length) list.push("左にメモを貼って、月次整理を作るを押してください。");
  if (totals.review) list.push(`${totals.review}件はカテゴリまたは金額だけ確認してください。`);
  if (!period.value) list.push("対象月を入れると保存ファイル名と月次確認がわかりやすくなります。");
  if (items.length && !totals.review) list.push("下ごしらえは完了です。売上履歴と証憑の保存状況だけ確認してください。");
  list.push("メルカリ/BOOTHの売上履歴と、送料・梱包材の証憑を照合してください。");
  list.push("税務判断ではなく、月次整理の補助として使ってください。");
  return list;
}

function calculateTotals(items) {
  return items.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      if (item.type === "expense") acc.expense += item.amount;
      if (item.type === "unknown" || item.amount === 0) acc.review += 1;
      return acc;
    },
    { income: 0, expense: 0, review: 0 }
  );
}

function refreshPackage(pkg) {
  pkg.totals = calculateTotals(pkg.items);
  pkg.checklist = buildChecklist(pkg.items, pkg.totals);
  return pkg;
}

function render(pkg) {
  const confidence = pkg.items.length ? Math.max(0, Math.round(((pkg.items.length - pkg.totals.review) / pkg.items.length) * 100)) : 0;
  statusPill.textContent = pkg.items.length ? (pkg.reviewRequested ? "レビュー用" : "整理済み") : "未整理";
  reviewCount.textContent = `${pkg.totals.review}件`;
  confidenceBar.style.width = `${confidence}%`;
  summary.innerHTML = `
    <div class="metric income"><span>売上候補</span><strong>${yen(pkg.totals.income)}</strong></div>
    <div class="metric expense"><span>経費候補</span><strong>${yen(pkg.totals.expense)}</strong></div>
    <div class="metric review"><span>不明行</span><strong>${pkg.totals.review}件</strong></div>
  `;
  cards.innerHTML = pkg.items.length
    ? pkg.items.map((item) => renderCard(item)).join("")
    : `<div class="empty">メモを貼ると、売上・経費・不明行に分かれます。<br>まずはサンプルで試せます。</div>`;
  checklist.innerHTML = `<ul>${pkg.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderCard(item) {
  return `
    <article class="item-card" data-id="${item.id}">
      <div class="card-fields">
        <label>
          <span>種類</span>
          <select class="type-select ${item.type}" aria-label="種類">
            <option value="income" ${item.type === "income" ? "selected" : ""}>売上</option>
            <option value="expense" ${item.type === "expense" ? "selected" : ""}>経費</option>
            <option value="unknown" ${item.type === "unknown" ? "selected" : ""}>確認</option>
          </select>
        </label>
        <label>
          <span>カテゴリ</span>
          <select class="category-select" aria-label="カテゴリ">
            ${categoryOptions.map(([value, label]) => `<option value="${value}" ${value === item.category ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>金額</span>
          <input class="amount-input" type="number" min="0" step="1" inputmode="numeric" value="${item.amount || ""}" aria-label="金額">
        </label>
      </div>
      <div class="memo">
        <strong>${item.amount ? yen(item.amount) : "金額なし"}</strong>
        <em class="type ${item.type}">${typeLabel(item.type)}</em>
        <span>${escapeHtml(item.memo)}</span>
      </div>
    </article>
  `;
}

function typeLabel(type) {
  if (type === "income") return "売上";
  if (type === "expense") return "経費";
  return "確認";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function downloadJson(pkg, name = "review-request") {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `receipt-sorter-${pkg.period || name}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(pkg) {
  const header = ["対象月", "販路", "種類", "カテゴリ", "金額", "メモ", "確認"];
  const rows = pkg.items.map((item) => [
    pkg.period || "",
    pkg.platform || "",
    typeLabel(item.type),
    categoryLabels[item.category] || item.category,
    item.amount || "",
    item.memo,
    item.note || ""
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toChecklist(pkg) {
  const lines = [
    `Receipt Sorter 確認リスト`,
    `対象月: ${pkg.period || "未指定"}`,
    `販路: ${pkg.platform || "未指定"}`,
    `売上候補: ${yen(pkg.totals.income)}`,
    `経費候補: ${yen(pkg.totals.expense)}`,
    `確認が必要: ${pkg.totals.review}件`,
    "",
    ...pkg.checklist.map((item) => `- ${item}`),
    "",
    "要確認行:",
    ...pkg.items
      .filter((item) => item.type === "unknown" || item.amount === 0 || item.category === "needs_review")
      .map((item) => `- ${item.memo}`)
  ];
  return lines.join("\n") + "\n";
}

async function copyChecklist(pkg) {
  const text = toChecklist(pkg);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }
  downloadText(text, `receipt-sorter-${pkg.period || "checklist"}.txt`);
  return "downloaded";
}

function setTypeFromCategory(item, category) {
  item.category = category;
  if (category === "sales") item.type = "income";
  if (category !== "sales" && category !== "needs_review") item.type = "expense";
  if (category === "needs_review") item.type = "unknown";
}

function setCategoryFromType(item, type) {
  item.type = type;
  if (type === "income") item.category = "sales";
  if (type === "unknown") item.category = "needs_review";
  if (type === "expense" && (item.category === "sales" || item.category === "needs_review")) {
    item.category = "supplies";
  }
}

function finalizeItem(item) {
  item.amount = Number.isFinite(item.amount) ? Math.max(0, Math.round(item.amount)) : 0;
  item.exportColumn = item.type === "income" ? "income" : "expense";
  item.note = item.type === "unknown" || item.amount === 0 ? "確認が必要" : "";
}

function runPreview() {
  latestPackage = buildPackage();
  render(latestPackage);
  setExportEnabled(true);
}

function setExportEnabled(enabled) {
  csvButton.disabled = !enabled;
  csvButtonBottom.disabled = !enabled;
  reviewButton.disabled = !enabled;
  checklistButton.disabled = !enabled;
}

previewButton.addEventListener("click", runPreview);

demoButton.addEventListener("click", () => {
  notes.value = demoText;
  if (!period.value) period.value = "2026-06";
  runPreview();
});

cards.addEventListener("change", (event) => {
  if (!latestPackage) return;
  const isCategory = event.target.classList.contains("category-select");
  const isType = event.target.classList.contains("type-select");
  const isAmount = event.target.classList.contains("amount-input");
  if (!isCategory && !isType && !isAmount) return;
  const card = event.target.closest(".item-card");
  const item = latestPackage.items.find((candidate) => candidate.id === card.dataset.id);
  if (!item) return;
  if (isCategory) setTypeFromCategory(item, event.target.value);
  if (isType) setCategoryFromType(item, event.target.value);
  if (isAmount) item.amount = Number(event.target.value) || 0;
  finalizeItem(item);
  render(refreshPackage(latestPackage));
});

csvButton.addEventListener("click", () => {
  if (latestPackage) downloadText(toCsv(latestPackage), `receipt-sorter-${latestPackage.period || "monthly"}.csv`, "text/csv");
});

csvButtonBottom.addEventListener("click", () => {
  if (latestPackage) downloadText(toCsv(latestPackage), `receipt-sorter-${latestPackage.period || "monthly"}.csv`, "text/csv");
});

checklistButton.addEventListener("click", async () => {
  if (!latestPackage) return;
  const previousLabel = checklistButton.textContent;
  try {
    const result = await copyChecklist(latestPackage);
    checklistButton.textContent = result === "copied" ? "コピー済み" : "TXT保存";
  } catch {
    downloadText(toChecklist(latestPackage), `receipt-sorter-${latestPackage.period || "checklist"}.txt`);
    checklistButton.textContent = "TXT保存";
  }
  window.setTimeout(() => {
    checklistButton.textContent = previousLabel;
  }, 1200);
});

reviewButton.addEventListener("click", () => {
  if (latestPackage) downloadJson({ ...latestPackage, reviewRequested: true }, "review-request");
});

render({
  totals: { income: 0, expense: 0, review: 0 },
  items: [],
  checklist: ["左にメモを貼って、月次整理を作るを押してください。"]
});
setExportEnabled(false);
