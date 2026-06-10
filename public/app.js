const notes = document.getElementById("raw-notes");
const period = document.getElementById("period");
const platform = document.getElementById("platform");
const previewButton = document.getElementById("preview-button");
const demoButton = document.getElementById("demo-button");
const emptyDemoButton = document.getElementById("empty-demo-button");
const startButton = document.getElementById("start-button");
const ownNotesButton = document.getElementById("own-notes-button");
const clearSampleButton = document.getElementById("clear-sample-button");
const saveButton = document.getElementById("save-button");
const loadButton = document.getElementById("load-button");
const deleteSaveButton = document.getElementById("delete-save-button");
const clearAllButton = document.getElementById("clear-all-button");
const saveStatus = document.getElementById("save-status");
const csvButtonBottom = document.getElementById("csv-button-bottom");
const reviewButton = document.getElementById("review-button");
const checklistButton = document.getElementById("checklist-button");
const dashboard = document.getElementById("dashboard");
const dashboardTitle = document.getElementById("dashboard-title");
const dashboardCopy = document.getElementById("dashboard-copy");
const cards = document.getElementById("result-cards");
const summary = document.getElementById("summary");
const checklist = document.getElementById("checklist");
const statusPill = document.getElementById("status-pill");
const reviewCount = document.getElementById("review-count");
const reviewMessage = document.getElementById("review-message");
const reviewCopy = document.getElementById("review-copy");
const tryOwnTitle = document.getElementById("try-own-title");
const tryOwnCopy = document.getElementById("try-own-copy");

let latestPackage = null;
let demoMode = false;

const saveKey = "receipt-sorter:draft:v1";

const demoText = [
  "6/1 メルカリ 売上 2,480円",
  "6/1 メルカリ 送料 750円",
  "6/2 BOOTH アクリルキー 売上 3,200円",
  "6/2 BOOTH 決済手数料 176円",
  "6/3 セリア 梱包材 440円",
  "6/5 コピー代 120円",
  "6/7 これは何の支出か忘れた 580円",
  "6/8 送料込み売上 1,800円 送料210円",
  "セリアで追加の袋を買った 金額忘れ"
].join("\n");

const categoryLabels = {
  sales: "売上",
  shipping: "送料",
  fee: "手数料",
  supplies: "梱包材",
  printing: "印刷",
  travel: "交通",
  software: "ソフト",
  meeting: "打合せ",
  other_expense: "その他経費",
  unknown: "用途不明",
  needs_review: "要確認"
};

const expenseRules = [
  ["fee", /手数料|販売手数料|決済手数料/],
  ["shipping", /送料|配送|切手|レターパック|宅急便|ゆうパック/],
  ["supplies", /梱包|封筒|段ボール|ラベル|袋|資材|文具|備品/],
  ["printing", /コピー|印刷|プリント/],
  ["travel", /交通|電車|バス|タクシー|駐車|高速/],
  ["software", /サーバ|ドメイン|ソフト|アプリ|SaaS|月額/],
  ["meeting", /打ち合わせ|会議|カフェ|コーヒー/]
];

const incomeRules = /売上|入金|販売|報酬/i;
const categoryOptions = [
  ["sales", "売上"],
  ["shipping", "送料"],
  ["fee", "手数料"],
  ["supplies", "梱包材"],
  ["printing", "印刷"],
  ["travel", "交通"],
  ["software", "ソフト"],
  ["meeting", "打合せ"],
  ["other_expense", "その他経費"],
  ["unknown", "用途不明"],
  ["needs_review", "要確認"]
];

const quickReviewOptions = [
  ["sales", "売上にする"],
  ["shipping", "送料にする"],
  ["supplies", "梱包材にする"],
  ["fee", "手数料にする"],
  ["printing", "印刷代にする"],
  ["travel", "交通費にする"],
  ["other_expense", "その他経費にする"],
  ["needs_review", "あとで確認"]
];

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

function parseAmount(line) {
  return parseAmounts(line).at(0) || 0;
}

function normalizeText(line) {
  return line.normalize("NFKC").replace(/[−―‐]/g, "-").replace(/[△▲]/g, "-");
}

function parseAmounts(line) {
  const normalized = normalizeText(line);
  const withoutDates = normalized
    .replace(/(?:(20\d{2})[/-])?\d{1,2}[/-]\d{1,2}/g, " ")
    .replace(/(?:(20\d{2})[.-])?\d{1,2}[.-]\d{1,2}/g, " ")
    .replace(/(?:(20\d{2})年)?\d{1,2}月\d{1,2}日?/g, " ")
    .replace(/[（(][^）)]*(?:から訂正|訂正前|修正前)[^）)]*[）)]/g, " ");
  const matches = [...withoutDates.matchAll(/([￥¥])?\s*([0-9][0-9,]*)\s*(円)?/g)];
  const amounts = matches
    .filter((match) => {
      const [, currency, digits, yenMark] = match;
      const start = match.index || 0;
      const before = withoutDates.slice(Math.max(0, start - 12), start);
      const after = withoutDates.slice(start + match[0].length, start + match[0].length + 12);
      const context = `${before}${match[0]}${after}`;
      if (/%|%/.test(after.trimStart().at(0) || "")) return false;
      if (/(?:No\.?|ID|#|注文|取引|管理|番号|残高)\s*$/i.test(before)) return false;
      if (/[x×]\s*$/.test(before)) return false;
      if (currency || yenMark || digits.includes(",")) return true;
      if (/^(?:\s*[点個件枚つ名回番号]|%|割|倍|[x×])/.test(after)) return false;
      if (/残高[^0-9￥¥]*$/.test(before)) return false;
      if (/(?:No\.?|ID|注文|取引|管理|番号)/i.test(context) && !currency && !yenMark) return false;
      return digits.replace(/,/g, "").length <= 4;
    })
    .map(([, , digits]) => Number(digits.replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  return [...amounts].sort((a, b) => b - a);
}

function parseDate(line) {
  const normalized = normalizeText(line);
  const match = normalized.match(/(?:(20\d{2})[/-])?(\d{1,2})[/-](\d{1,2})/) ||
    normalized.match(/(?:(20\d{2})[.-])?(\d{1,2})[.-](\d{1,2})/) ||
    normalized.match(/(?:(20\d{2})年)?(\d{1,2})月(\d{1,2})日?/);
  if (!match) return "";
  const year = match[1] || (period.value ? period.value.split("-")[0] : "");
  const month = match[2].padStart(2, "0");
  const day = match[3].padStart(2, "0");
  return year ? `${year}-${month}-${day}` : `${month}/${day}`;
}

function categorize(line) {
  const normalized = normalizeText(line);
  if (/返品|返金|キャンセル|取消|取り消し|戻り|払い戻し|相殺|マイナス|-\s*[0-9]/.test(normalized)) {
    return { type: "unknown", category: "needs_review", note: "返品/返金/取消を確認" };
  }
  const phraseMatch =
    (/販売手数料|決済手数料|メルカリ手数料|ラクマ手数料|BOOTH手数料/i.test(normalized) && ["fee", "手数料"]) ||
    (/送料\s*無料|送料無料|手数料\s*無料|手数料無料|送料込み|送料込/.test(normalized) && ["ignore_expense", "無料/込み表現を確認"]);
  const expenseLine = phraseMatch?.[0] === "ignore_expense"
    ? normalized.replace(/送料\s*無料|送料無料|手数料\s*無料|手数料無料|送料込み|送料込/g, "")
    : normalized;
  const expenseMatch = phraseMatch?.[0] && phraseMatch[0] !== "ignore_expense"
    ? [phraseMatch[0]]
    : expenseRules.find(([, pattern]) => pattern.test(expenseLine));
  const incomeLine = phraseMatch?.[0] && phraseMatch[0] !== "ignore_expense"
    ? normalized.replace(/販売手数料|決済手数料|メルカリ手数料|ラクマ手数料|BOOTH手数料/gi, "")
    : normalized;
  const incomeMatch = incomeRules.test(incomeLine);
  if (expenseMatch && incomeMatch) {
    return { type: "unknown", category: "needs_review", note: "売上/経費を確認" };
  }
  if (expenseMatch) return { type: "expense", category: expenseMatch[0], note: "" };
  if (incomeMatch) return { type: "income", category: "sales", note: "" };
  return { type: "unknown", category: "needs_review", note: "分類を確認" };
}

function buildItemNote(item) {
  const reasons = [];
  if (item.type === "unknown" || item.category === "needs_review") reasons.push(item.note || "分類を確認");
  if ((item.amountCandidates?.length || 0) > 1) reasons.push("複数金額を確認");
  if (item.flags?.length) reasons.push(...item.flags);
  if (!item.amount) reasons.push("金額を確認");
  if (!item.date) reasons.push("日付を確認");
  return [...new Set(reasons)].join(" / ");
}

function needsReview(item) {
  return item.type === "unknown" || item.amount === 0 || item.category === "needs_review" || !item.date || (item.amountCandidates?.length || 0) > 1 || Boolean(item.flags?.length);
}

function detectFlags(line) {
  const normalized = normalizeText(line);
  const flags = [];
  if (/[0-9][0-9,]*\s*円?\s*[x×]\s*[0-9]/.test(normalized)) flags.push("単価/数量を確認");
  if (/%|％/.test(normalized)) flags.push("割合を確認");
  if (/残高/.test(normalized)) flags.push("残高を確認");
  return flags;
}

function parseNotes(raw) {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const classified = categorize(line);
      const amountCandidates = parseAmounts(line);
      const flags = detectFlags(line);
      return {
        id: `line-${index + 1}`,
        type: classified.type,
        category: classified.category,
        amount: amountCandidates.at(0) || 0,
        amountCandidates,
        flags,
        date: parseDate(line),
        memo: line,
        sourceMemo: line,
        note: classified.note || ""
      };
    });
}

function buildPackage() {
  const items = parseNotes(notes.value);
  const normalizedItems = normalizeItems(items);
  const totals = calculateTotals(normalizedItems);

  return {
    app: "receipt-sorter",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    period: period.value || null,
    platform: platform.value,
    reviewRequested: Boolean(totals.review),
    totals,
    items: normalizedItems,
    checklist: buildChecklist(normalizedItems, totals)
  };
}

function normalizeItems(items) {
  return items.map((item) => ({
    ...item,
    sourceMemo: item.sourceMemo || item.memo,
    exportColumn: item.type === "income" ? "income" : "expense",
    note: buildItemNote(item)
  }));
}

function buildChecklist(items, totals) {
  const list = [];
  if (!items.length) list.push("左にメモを貼って、月次整理を作るを押してください。");
  if (totals.review) list.push(`${totals.review}件はカテゴリまたは金額だけ確認してください。`);
  if (!period.value) list.push("対象月を入れると保存ファイル名と月次確認がわかりやすくなります。");
  if (items.length && !totals.review) list.push("下ごしらえは完了です。売上履歴と証憑の保存状況だけ確認してください。");
  list.push("メルカリの売上履歴と、送料・梱包材の証憑を照合してください。");
  list.push("税務判断ではなく、月次整理の補助として使ってください。");
  return list;
}

function calculateTotals(items) {
  return items.reduce(
    (acc, item) => {
      const reviewNeeded = needsReview(item);
      if (item.type === "income" && !reviewNeeded) acc.income += item.amount;
      if (item.type === "expense" && !reviewNeeded) acc.expense += item.amount;
      if (reviewNeeded) acc.review += 1;
      const category = item.category || "needs_review";
      if (!reviewNeeded) acc.categoryTotals[category] = (acc.categoryTotals[category] || 0) + item.amount;
      return acc;
    },
    { income: 0, expense: 0, review: 0, categoryTotals: {} }
  );
}

function refreshPackage(pkg) {
  pkg.period = period.value || null;
  pkg.platform = platform.value;
  pkg.totals = calculateTotals(pkg.items);
  pkg.reviewRequested = Boolean(pkg.totals.review);
  pkg.checklist = buildChecklist(pkg.items, pkg.totals);
  return pkg;
}

function render(pkg) {
  const hasResults = pkg.items.length > 0;
  const autoCount = Math.max(0, pkg.items.length - pkg.totals.review);
  dashboard.classList.toggle("has-results", hasResults);
  dashboard.classList.toggle("demo-results", hasResults && demoMode);
  statusPill.textContent = hasResults ? "整理済み" : "未整理";
  dashboardTitle.textContent = hasResults
    ? (pkg.totals.review ? `要確認 ${pkg.totals.review}件` : `${periodLabel(pkg.period)}の整理完了`)
    : "確認リスト";
  dashboardCopy.textContent = hasResults
    ? "迷う行だけ見直してください。"
    : "メモを貼ると、確認リストが表示されます。";
  reviewCount.textContent = `${pkg.totals.review}件`;
  reviewMessage.textContent = pkg.totals.review
    ? `候補 ${autoCount}件 / 要確認 ${pkg.totals.review}件`
    : `候補 ${autoCount}件 / 要確認なし`;
  reviewCopy.textContent = pkg.totals.review
    ? `要確認 ${pkg.totals.review}件だけ保存できます。`
    : "確認リストを保存できます。";
  tryOwnTitle.textContent = demoMode ? "次は自分のメモで。" : "この結果を確認";
  tryOwnCopy.textContent = demoMode
    ? "販売履歴や送料メモを貼るだけです。"
    : "違う行はチップで直せます。";
  reviewButton.textContent = pkg.totals.review
    ? `JSON保存（要確認${pkg.totals.review}件）`
    : "JSON保存（控え）";
  reviewButton.disabled = !hasResults || !pkg.totals.review;
  const net = pkg.totals.income - pkg.totals.expense;
  summary.innerHTML = `
    <div class="metric income"><span>売上メモ</span><strong>${yen(pkg.totals.income)}</strong></div>
    <div class="metric expense"><span>経費メモ</span><strong>${yen(pkg.totals.expense)}</strong></div>
    <div class="metric review"><span>確認メモ</span><strong>${pkg.totals.review}件</strong></div>
    <div class="metric net"><span>差し引き目安</span><strong>${yen(net)}</strong></div>
    <p class="metric-note">売上候補 - 経費候補のメモ上の目安です。税務判断ではありません。</p>
    <div class="category-breakdown">${renderCategoryTotals(pkg.totals.categoryTotals)}</div>
  `;
  cards.innerHTML = pkg.items.length
    ? renderResults(pkg)
    : `<div class="empty">メモを貼ると、売上メモ・経費メモ・確認が必要なメモに分かれます。<br>まずはサンプルで試せます。</div>`;
  checklist.innerHTML = `
    <h3>コピーされる内容プレビュー</h3>
    <pre>${escapeHtml(toChecklist(pkg).trim())}</pre>
  `;
}

function renderCategoryTotals(categoryTotals = {}) {
  const entries = categoryOptions
    .map(([value, label]) => [value, label, categoryTotals[value] || 0])
    .filter(([, , total]) => total > 0);
  if (!entries.length) return "<span>カテゴリ別合計は整理後に表示されます。</span>";
  return entries
    .map(([, label, total]) => `<span>${label}<strong>${yen(total)}</strong></span>`)
    .join("");
}

function periodLabel(value) {
  if (!value) return "今回";
  const [year, month] = value.split("-");
  return `${year}年${Number(month)}月`;
}

function renderResults(pkg) {
  const reviewItems = pkg.items.filter(needsReview);
  const confirmedItems = pkg.items.filter((item) => !needsReview(item));
  return `
    ${reviewItems.length ? renderReviewSection(reviewItems) : renderNoReviewSection()}
    <details class="details-panel" ${demoMode ? "open" : ""}>
      <summary>整理済みの明細 ${confirmedItems.length}件を見る</summary>
      <div class="confirmed-list">
        ${confirmedItems.map((item) => renderCard(item)).join("")}
      </div>
    </details>
  `;
}

function renderReviewSection(items) {
  return `
    <section class="review-needed">
      <h3>要確認</h3>
      ${items.map((item) => renderReviewCard(item)).join("")}
    </section>
  `;
}

function renderNoReviewSection() {
  return `
    <section class="no-review">
      <h3>要確認なし</h3>
    </section>
  `;
}

function renderReviewCard(item) {
  return `
    <article class="review-card" data-id="${item.id}">
      <div>
        <p class="review-question">分類を選ぶ</p>
        <strong>${item.amount ? yen(item.amount) : "金額なし"}</strong>
        <span>${escapeHtml(item.memo)}</span>
        ${(item.amountCandidates?.length || 0) > 1 ? `<small>金額候補: ${item.amountCandidates.map(yen).join(" / ")}</small>` : ""}
        ${item.note ? `<small>要確認理由: ${escapeHtml(item.note)}</small>` : ""}
      </div>
      <div class="quick-options" aria-label="整理候補">
        ${quickReviewOptions.map(([value, label]) => `<button type="button" class="category-chip" data-category="${value}">${label}</button>`).join("")}
      </div>
      <details>
        <summary>詳細を編集</summary>
        ${renderEditFields(item)}
      </details>
    </article>
  `;
}

function renderConfirmedRow(item) {
  return `
    <article class="confirmed-row" data-id="${item.id}">
      <div>
        <em class="type ${item.type}">${typeLabel(item.type)}</em>
        <strong>${item.amount ? yen(item.amount) : "金額なし"}</strong>
      </div>
      <span>${escapeHtml(item.memo)}</span>
    </article>
  `;
}

function renderCard(item) {
  return `
    <article class="item-card" data-id="${item.id}">
      <div class="memo">
        <strong>${item.amount ? yen(item.amount) : "金額なし"}</strong>
        <em class="type ${item.type}">${typeLabel(item.type)}</em>
        <span>${escapeHtml(item.memo)}</span>
        <small>${escapeHtml(item.date || "日付未確認")} / ${escapeHtml(categoryLabels[item.category] || item.category)}${item.note ? ` / ${escapeHtml(item.note)}` : ""}</small>
        <small>元メモ: ${escapeHtml(item.sourceMemo || item.memo)}</small>
      </div>
      ${renderEditFields(item)}
    </article>
  `;
}

function renderEditFields(item) {
  return `
      <div class="card-fields">
        <label>
          <span>日付</span>
          <input class="date-input" type="text" value="${escapeHtml(item.date || "")}" placeholder="6/1" aria-label="日付">
        </label>
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
        <label class="memo-field">
          <span>メモ</span>
          <input class="memo-input" type="text" value="${escapeHtml(item.memo)}" aria-label="メモ">
        </label>
        <button type="button" class="item-delete ghost danger">行を削除</button>
      </div>
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

function formatSavedAt(value) {
  if (!value) return "";
  const savedAt = new Date(value);
  if (Number.isNaN(savedAt.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(savedAt);
}

function hasSavedDraft() {
  try {
    return Boolean(localStorage.getItem(saveKey));
  } catch {
    return false;
  }
}

function updateSaveStatus(message) {
  const saved = readDraft();
  const savedAt = saved?.savedAt ? formatSavedAt(saved.savedAt) : "";
  saveStatus.textContent = message || (savedAt ? `保存済み ${savedAt}` : "未保存");
  loadButton.disabled = !saved;
  deleteSaveButton.disabled = !saved;
}

function buildDraft() {
  const pkg = latestPackage ? refreshPackage(latestPackage) : buildPackage();
  return {
    savedAt: new Date().toISOString(),
    rawNotes: notes.value,
    period: period.value || "",
    platform: platform.value,
    demoMode,
    package: pkg
  };
}

function readDraft() {
  try {
    const saved = localStorage.getItem(saveKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveDraft() {
  try {
    localStorage.setItem(saveKey, JSON.stringify(buildDraft()));
    updateSaveStatus("保存しました");
    window.setTimeout(() => updateSaveStatus(), 1200);
  } catch {
    updateSaveStatus("保存できませんでした");
  }
}

function restoreDraft() {
  const draft = readDraft();
  if (!draft) {
    updateSaveStatus("保存はありません");
    return;
  }
  notes.value = draft.rawNotes || "";
  period.value = draft.period || "";
  platform.value = draft.platform || "mercari";
  demoMode = Boolean(draft.demoMode);
  latestPackage = draft.package?.items ? refreshPackage(draft.package) : buildPackage();
  render(latestPackage);
  setExportEnabled(latestPackage.items.length > 0);
  updateSaveStatus("復元しました");
  window.setTimeout(() => updateSaveStatus(), 1200);
}

function deleteDraft() {
  try {
    localStorage.removeItem(saveKey);
    updateSaveStatus("削除しました");
    window.setTimeout(() => updateSaveStatus(), 1200);
  } catch {
    updateSaveStatus("削除できませんでした");
  }
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
  const header = ["対象月", "販路", "日付", "種類", "カテゴリ", "金額", "メモ", "元メモ", "確認"];
  const rows = pkg.items.map((item) => [
    pkg.period || "",
    pkg.platform || "",
    item.date || "",
    typeLabel(item.type),
    categoryLabels[item.category] || item.category,
    item.amount || "",
    item.memo,
    item.sourceMemo || item.memo,
    item.note || ""
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toChecklist(pkg) {
  const lines = [
    `メルカリなどのフリマ販売メモ整理 確認リスト`,
    `対象月: ${pkg.period || "未指定"}`,
    `販路: ${pkg.platform || "未指定"}`,
    `売上メモ: ${yen(pkg.totals.income)}`,
    `経費メモ: ${yen(pkg.totals.expense)}`,
    `確認が必要なメモ: ${pkg.totals.review}件`,
    "",
    ...pkg.checklist.map((item) => `- ${item}`),
    "",
    "明細:",
    ...pkg.items.map((item) => {
      const date = item.date || "日付未確認";
      const amount = item.amount ? yen(item.amount) : "金額未確認";
      const candidates = (item.amountCandidates?.length || 0) > 1 ? ` / 候補: ${item.amountCandidates.map(yen).join(" / ")}` : "";
      const category = categoryLabels[item.category] || item.category;
      const note = item.note ? ` / ${item.note}` : "";
      return `- ${date} / ${typeLabel(item.type)} / ${category} / ${amount}${candidates} / ${item.memo}${note}`;
    }),
    "",
    "確認が必要なメモ:",
    ...pkg.items
      .filter(needsReview)
      .map((item) => `- ${item.memo}${item.note ? `（${item.note}）` : ""}`)
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
  if (!["sales", "needs_review", "unknown"].includes(category)) item.type = "expense";
  if (category === "needs_review" || category === "unknown") item.type = "unknown";
}

function setCategoryFromType(item, type) {
  item.type = type;
  if (type === "income") item.category = "sales";
  if (type === "unknown") item.category = "needs_review";
  if (type === "expense" && (item.category === "sales" || item.category === "needs_review")) {
    item.category = "other_expense";
  }
}

function finalizeItem(item) {
  item.amount = Number.isFinite(item.amount) ? Math.max(0, Math.round(item.amount)) : 0;
  item.exportColumn = item.type === "income" ? "income" : "expense";
  item.sourceMemo = item.sourceMemo || item.memo;
  item.note = buildItemNote(item);
}

function runPreview() {
  demoMode = false;
  latestPackage = buildPackage();
  render(latestPackage);
  setExportEnabled(true);
}

function setExportEnabled(enabled) {
  csvButtonBottom.disabled = !enabled;
  reviewButton.disabled = !enabled || !latestPackage?.totals.review;
  checklistButton.disabled = !enabled;
}

previewButton.addEventListener("click", runPreview);

[notes, period, platform].forEach((field) => {
  const markChanged = () => {
    if (latestPackage) refreshPackage(latestPackage);
    saveStatus.textContent = hasSavedDraft() ? "変更あり" : "未保存";
  };
  field.addEventListener("input", markChanged);
  field.addEventListener("change", markChanged);
});

startButton.addEventListener("click", () => {
  notes.focus();
  notes.scrollIntoView({ behavior: "smooth", block: "center" });
});

function resetForOwnNotes() {
  demoMode = false;
  notes.value = "";
  latestPackage = {
    totals: { income: 0, expense: 0, review: 0 },
    items: [],
    checklist: ["左にメモを貼って、月次整理を作るを押してください。"]
  };
  render(latestPackage);
  setExportEnabled(false);
  notes.focus();
  notes.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAll() {
  demoMode = false;
  notes.value = "";
  period.value = "";
  latestPackage = {
    totals: { income: 0, expense: 0, review: 0, categoryTotals: {} },
    items: [],
    checklist: ["左にメモを貼って、月次整理を作るを押してください。"]
  };
  render(latestPackage);
  setExportEnabled(false);
  updateSaveStatus("入力内容を削除しました");
  window.setTimeout(() => updateSaveStatus(), 1200);
}

function runDemo() {
  demoMode = true;
  notes.value = demoText;
  if (!period.value) period.value = "2026-06";
  latestPackage = buildPackage();
  render(latestPackage);
  setExportEnabled(true);
}

demoButton.addEventListener("click", runDemo);
emptyDemoButton?.addEventListener("click", runDemo);

ownNotesButton.addEventListener("click", resetForOwnNotes);
clearSampleButton.addEventListener("click", resetForOwnNotes);
saveButton.addEventListener("click", saveDraft);
loadButton.addEventListener("click", restoreDraft);
deleteSaveButton.addEventListener("click", deleteDraft);
clearAllButton.addEventListener("click", clearAll);

cards.addEventListener("change", (event) => {
  if (!latestPackage) return;
  const isCategory = event.target.classList.contains("category-select");
  const isType = event.target.classList.contains("type-select");
  const isAmount = event.target.classList.contains("amount-input");
  const isDate = event.target.classList.contains("date-input");
  const isMemo = event.target.classList.contains("memo-input");
  if (!isCategory && !isType && !isAmount && !isDate && !isMemo) return;
  const card = event.target.closest("[data-id]");
  if (!card) return;
  const item = latestPackage.items.find((candidate) => candidate.id === card.dataset.id);
  if (!item) return;
  if (isCategory) setTypeFromCategory(item, event.target.value);
  if (isType) setCategoryFromType(item, event.target.value);
  if (isAmount) item.amount = Number(event.target.value) || 0;
  if (isDate) item.date = event.target.value.trim();
  if (isMemo) item.memo = event.target.value.trim() || item.sourceMemo || "";
  finalizeItem(item);
  render(refreshPackage(latestPackage));
  saveStatus.textContent = hasSavedDraft() ? "変更あり" : "未保存";
});

cards.addEventListener("click", (event) => {
  if (!latestPackage) return;
  if (event.target.classList.contains("item-delete")) {
    const card = event.target.closest("[data-id]");
    latestPackage.items = latestPackage.items.filter((candidate) => candidate.id !== card?.dataset.id);
    render(refreshPackage(latestPackage));
    setExportEnabled(latestPackage.items.length > 0);
    saveStatus.textContent = hasSavedDraft() ? "変更あり" : "未保存";
    return;
  }
  if (!event.target.classList.contains("category-chip")) return;
  const card = event.target.closest("[data-id]");
  const item = latestPackage.items.find((candidate) => candidate.id === card.dataset.id);
  if (!item) return;
  setTypeFromCategory(item, event.target.dataset.category);
  finalizeItem(item);
  render(refreshPackage(latestPackage));
  saveStatus.textContent = hasSavedDraft() ? "変更あり" : "未保存";
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
  totals: { income: 0, expense: 0, review: 0, categoryTotals: {} },
  items: [],
  checklist: ["左にメモを貼って、月次整理を作るを押してください。"]
});
setExportEnabled(false);
updateSaveStatus();
