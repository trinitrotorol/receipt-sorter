const form = document.getElementById("cleanup-form");
const notes = document.getElementById("raw-notes");
const period = document.getElementById("period");
const useCase = document.getElementById("use-case");
const reviewRequest = document.getElementById("review-request");
const previewButton = document.getElementById("preview-button");
const downloadButton = document.getElementById("download-button");
const resultBody = document.getElementById("result-body");
const summary = document.getElementById("summary");
const checklist = document.getElementById("checklist");
const statusPill = document.getElementById("status-pill");

let latestPackage = null;

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
      if (item.type === "unknown") acc.unknown += 1;
      return acc;
    },
    { income: 0, expense: 0, unknown: 0 }
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
  if (!items.length) list.push("メモが空です。");
  if (totals.unknown) list.push(`${totals.unknown}件はカテゴリ確認が必要です。`);
  if (items.some((item) => item.amount === 0)) list.push("金額が読み取れない行があります。");
  if (!period.value) list.push("対象月を入れると月次整理に使いやすくなります。");
  if (!list.length) list.push("初期整理は完了です。証憑の保管状況を確認してください。");
  return list;
}

function render(pkg) {
  statusPill.textContent = pkg.reviewRequested ? "レビュー依頼用" : "プレビュー";
  summary.innerHTML = `
    <div class="metric"><span>売上候補</span><strong>${yen(pkg.totals.income)}</strong></div>
    <div class="metric"><span>経費候補</span><strong>${yen(pkg.totals.expense)}</strong></div>
    <div class="metric"><span>要確認</span><strong>${pkg.totals.unknown}件</strong></div>
  `;
  resultBody.innerHTML = pkg.items
    .map(
      (item) => `
        <tr>
          <td>${item.type}</td>
          <td>${item.category}</td>
          <td>${item.amount ? yen(item.amount) : "-"}</td>
          <td>${escapeHtml(item.memo)}</td>
        </tr>
      `
    )
    .join("");
  checklist.innerHTML = `<ul>${pkg.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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

previewButton.addEventListener("click", () => {
  latestPackage = buildPackage();
  render(latestPackage);
  downloadButton.disabled = false;
});

downloadButton.addEventListener("click", () => {
  if (latestPackage) downloadJson(latestPackage);
});

form.addEventListener("submit", (event) => event.preventDefault());

