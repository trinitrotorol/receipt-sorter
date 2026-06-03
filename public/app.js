const notes = document.getElementById("raw-notes");
const period = document.getElementById("period");
const useCase = document.getElementById("use-case");
const reviewRequest = document.getElementById("review-request");
const previewButton = document.getElementById("preview-button");
const demoButton = document.getElementById("demo-button");
const downloadButton = document.getElementById("download-button");
const cards = document.getElementById("result-cards");
const summary = document.getElementById("summary");
const checklist = document.getElementById("checklist");
const statusPill = document.getElementById("status-pill");
const reviewCount = document.getElementById("review-count");
const confidenceBar = document.getElementById("confidence-bar");

let latestPackage = null;

const demoText = [
  "6/1 コンビニ コピー代 240円",
  "6/2 BOOTH 売上 3,200円",
  "Amazon 梱包材 1,180円",
  "メルカリ 送料 750円",
  "打ち合わせ交通費 680円"
].join("\n");

const categoryLabels = {
  sales: "売上",
  shipping: "発送",
  supplies: "備品",
  printing: "印刷",
  travel: "交通",
  software: "ソフト",
  meeting: "打合せ",
  needs_review: "要確認"
};

const expenseRules = [
  ["shipping", /送料|配送|切手|レターパック|宅急便|ゆうパック/],
  ["supplies", /梱包|封筒|段ボール|ラベル|文具|備品/],
  ["printing", /コピー|印刷|プリント/],
  ["travel", /交通|電車|バス|タクシー|駐車|高速/],
  ["software", /サーバ|ドメイン|ソフト|アプリ|SaaS|月額/],
  ["meeting", /打ち合わせ|会議|カフェ|コーヒー/]
];

const incomeRules = /売上|入金|販売|報酬|BOOTH|BASE|メルカリ|Mercari|Shopify/i;

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
  if (incomeRules.test(line)) return { type: "income", category: "sales" };
  for (const [category, pattern] of expenseRules) {
    if (pattern.test(line)) return { type: "expense", category };
  }
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
    useCase: useCase.value,
    reviewRequested: reviewRequest.checked,
    totals,
    items,
    checklist: buildChecklist(items, totals)
  };
}

function buildChecklist(items, totals) {
  const list = [];
  if (!items.length) list.push("左にメモを貼って、仕分けるを押してください。");
  if (totals.review) list.push(`${totals.review}件はカテゴリまたは金額の確認が必要です。`);
  if (!period.value) list.push("対象月を入れると保存ファイル名と月次確認がわかりやすくなります。");
  if (items.length && !totals.review) list.push("初期整理は完了です。証憑の保存状況だけ確認してください。");
  list.push("会計ソフトに入れる前に、売上と経費を別々に確認してください。");
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
    <article class="item-card">
      <span class="type ${item.type}">${typeLabel(item.type)}</span>
      <div class="memo">
        <strong>${categoryLabels[item.category] || item.category}</strong>
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

function downloadJson(pkg) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `receipt-sorter-${pkg.period || "request"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function runPreview() {
  latestPackage = buildPackage();
  render(latestPackage);
  downloadButton.disabled = false;
}

previewButton.addEventListener("click", runPreview);

demoButton.addEventListener("click", () => {
  notes.value = demoText;
  if (!period.value) period.value = "2026-06";
  runPreview();
});

downloadButton.addEventListener("click", () => {
  if (latestPackage) downloadJson(latestPackage);
});

render({
  totals: { income: 0, expense: 0, review: 0 },
  items: [],
  checklist: ["左にメモを貼って、仕分けるを押してください。"]
});

