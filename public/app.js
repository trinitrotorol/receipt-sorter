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
  const totals = items.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      if (item.type === "expense") acc.expense += item.amount;
      if (item.type === "unknown" || item.amount === 0) acc.review += 1;
      return acc;
    },
    { income: 0, expense: 0, review: 0 }
  );

  return {
    app: "receipt-sorter",
    version: "0.1.0",
    createdAt: new Date().toISOString(),
    period: period.value || null,
    platform: platform.value,
    reviewRequested: reviewRequest.checked,
    totals,
    items: normalizedItems,
    checklist: buildChecklist(items, totals)
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
  if (!items.length) list.push("左にメモを貼って、仕分けるを押してください。");
  if (totals.review) list.push(`${totals.review}件はカテゴリまたは金額の確認が必要です。`);
  if (!period.value) list.push("対象月を入れると保存ファイル名と月次確認がわかりやすくなります。");
  if (items.length && !totals.review) list.push("初期整理は完了です。証憑の保存状況だけ確認してください。");
  list.push("メルカリ/BOOTHの売上履歴と、送料・梱包材の証憑を照合してください。");
  list.push("税務判断ではなく、月次整理の補助として使ってください。");
  return list;
}

function render(pkg) {
  const confidence = pkg.items.length ? Math.max(0, Math.round(((pkg.items.length - pkg.totals.review) / pkg.items.length) * 100)) : 0;
  statusPill.textContent = pkg.reviewRequested ? "レビュー用" : "整理済み";
  reviewCount.textContent = `${pkg.totals.review}件`;
  confidenceBar.style.width = `${confidence}%`;
  summary.innerHTML = `
    <div class="metric income"><span>売上候補</span><strong>${yen(pkg.totals.income)}</strong></div>
    <div class="metric expense"><span>経費候補</span><strong>${yen(pkg.totals.expense)}</strong></div>
    <div class="metric review"><span>確認</span><strong>${pkg.totals.review}件</strong></div>
  `;
  cards.innerHTML = pkg.items.length
    ? pkg.items.map((item) => renderCard(item)).join("")
    : `<div class="empty">メモを貼ると、ここに仕分け結果が表示されます。<br>まずはサンプルを押して試せます。</div>`;
  checklist.innerHTML = `<ul>${pkg.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderCard(item) {
  return `
    <article class="item-card" data-id="${item.id}">
      <span class="type ${item.type}">${typeLabel(item.type)}</span>
      <div class="memo">
        <select class="category-select" aria-label="カテゴリ">
          ${categoryOptions.map(([value, label]) => `<option value="${value}" ${value === item.category ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <span>${escapeHtml(item.memo)}</span>
      </div>
      <div class="amount">${item.amount ? yen(item.amount) : "金額なし"}</div>
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
  if (!event.target.classList.contains("category-select") || !latestPackage) return;
  const card = event.target.closest(".item-card");
  const item = latestPackage.items.find((candidate) => candidate.id === card.dataset.id);
  if (!item) return;
  item.category = event.target.value;
  if (item.category === "sales") item.type = "income";
  if (item.category !== "sales" && item.category !== "needs_review") item.type = "expense";
  if (item.category === "needs_review") item.type = "unknown";
  item.exportColumn = item.type === "income" ? "income" : "expense";
  item.note = item.type === "unknown" || item.amount === 0 ? "確認が必要" : "";
  latestPackage.totals = latestPackage.items.reduce(
    (acc, current) => {
      if (current.type === "income") acc.income += current.amount;
      if (current.type === "expense") acc.expense += current.amount;
      if (current.type === "unknown" || current.amount === 0) acc.review += 1;
      return acc;
    },
    { income: 0, expense: 0, review: 0 }
  );
  latestPackage.checklist = buildChecklist(latestPackage.items, latestPackage.totals);
  render(latestPackage);
});

csvButton.addEventListener("click", () => {
  if (latestPackage) downloadText(toCsv(latestPackage), `receipt-sorter-${latestPackage.period || "monthly"}.csv`, "text/csv");
});

csvButtonBottom.addEventListener("click", () => {
  if (latestPackage) downloadText(toCsv(latestPackage), `receipt-sorter-${latestPackage.period || "monthly"}.csv`, "text/csv");
});

checklistButton.addEventListener("click", () => {
  if (latestPackage) downloadText(toChecklist(latestPackage), `receipt-sorter-${latestPackage.period || "checklist"}.txt`);
});

reviewButton.addEventListener("click", () => {
  if (latestPackage) downloadJson({ ...latestPackage, reviewRequested: true }, "review-request");
});

render({
  totals: { income: 0, expense: 0, review: 0 },
  items: [],
  checklist: ["左にメモを貼って、仕分けるを押してください。"]
});
setExportEnabled(false);
