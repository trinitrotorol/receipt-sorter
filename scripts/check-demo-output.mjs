import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const elementStore = new Map();

function makeElement(id = "") {
  const classSet = new Set();
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    dataset: {},
    classList: {
      add: name => classSet.add(name),
      remove: name => classSet.delete(name),
      contains: name => classSet.has(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !classSet.has(name) : Boolean(force);
        if (shouldAdd) classSet.add(name);
        else classSet.delete(name);
      }
    },
    addEventListener() {},
    focus() {},
    scrollIntoView() {},
    querySelector() { return null; },
    closest() { return null; },
    click() {}
  };
}

const document = {
  getElementById(id) {
    if (!elementStore.has(id)) elementStore.set(id, makeElement(id));
    return elementStore.get(id);
  },
  createElement(tagName) {
    return makeElement(tagName);
  }
};

const context = {
  document,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  navigator: {},
  URL: {
    createObjectURL() { return "blob:test"; },
    revokeObjectURL() {}
  },
  Blob,
  Intl,
  Date,
  Number,
  Math,
  Boolean,
  String,
  console,
  window: {
    setTimeout() {},
    ReceiptSorterDebug: {}
  }
};
context.globalThis = context;

vm.createContext(context);
vm.runInContext(`${appSource}\nwindow.ReceiptSorterDebug = { parseAmount, parseAmounts, parseDate, parseNotes, normalizeItems, calculateTotals, demoText };`, context);

const { parseAmount, parseAmounts, parseDate, parseNotes, normalizeItems, calculateTotals, demoText } = context.window.ReceiptSorterDebug;
const amountCases = [
  ["6/1 メルカリ 売上 2,480円", 2480],
  ["2026/6/1 送料 750円", 750],
  ["6-2 BOOTH 決済手数料 176円", 176],
  ["6.2 BOOTH 決済手数料 176円", 176],
  ["6/5 コピー代 120", 120],
  ["6/7 これは何の支出か忘れた 580円", 580],
  ["6/8 送料込み売上 1,800円 送料210円", 1800],
  ["6月9日 売上 4,500円", 4500],
  ["６／１２ 売上 １，８００円", 1800],
  ["2026年6月10日 送料 ¥210", 210],
  ["2026-06-14 梱包材 ¥330", 330],
  ["注文ID 123456789 売上", 0],
  ["6/3 売上 1,200円 注文No.9876", 1200],
  ["6/3 メルカリ手数料 10%", 0],
  ["2026/6/16 送料メモ", 0],
  ["金額なしメモ", 0]
];

const failures = [];
for (const [line, expected] of amountCases) {
  const actual = parseAmount(line);
  if (actual !== expected) failures.push(`${line}: expected ${expected}, got ${actual}`);
}

const amountCandidateCases = [
  ["6/8 送料込み売上 1,800円 送料210円", [1800, 210]],
  ["6/3 セリア 2点 梱包材 440円", [440]],
  ["6/16 売上 1,200円 手数料120円 送料210円", [1200, 210, 120]],
  ["6/5 売上 1,800円 残高 12,340円", [1800]],
  ["6/6 送料 210円（230円から訂正）", [210]],
  ["6/4 梱包材 110円×3", [110]]
];
for (const [line, expected] of amountCandidateCases) {
  const actual = parseAmounts(line);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${line}: expected amount candidates ${expected.join("/")}, got ${actual.join("/")}`);
  }
}

document.getElementById("period").value = "2026-06";
const dateCases = [
  ["6/1 メルカリ 売上 2,480円", "2026-06-01"],
  ["6.2 BOOTH 決済手数料 176円", "2026-06-02"],
  ["6月9日 売上 4,500円", "2026-06-09"],
  ["６／１２ 売上 １，８００円", "2026-06-12"],
  ["2026年6月10日 送料 ¥210", "2026-06-10"]
];
for (const [line, expected] of dateCases) {
  const actual = parseDate(line);
  if (actual !== expected) failures.push(`${line}: expected date ${expected}, got ${actual}`);
}

const demoItems = normalizeItems(parseNotes(demoText));
const totals = calculateTotals(demoItems);
if (totals.income !== 5680) failures.push(`demo income expected 5680, got ${totals.income}`);
if (totals.expense !== 1486) failures.push(`demo expense expected 1486, got ${totals.expense}`);
if (totals.review !== 3) failures.push(`demo review expected 3, got ${totals.review}`);
if (demoItems.at(-3)?.amount !== 580) failures.push(`demo unknown amount expected 580, got ${demoItems.at(-3)?.amount}`);
if (demoItems.at(-2)?.amount !== 1800) failures.push(`demo ambiguous amount expected 1800, got ${demoItems.at(-2)?.amount}`);
if (demoItems.at(-2)?.note !== "売上/経費を確認 / 複数金額を確認") failures.push(`demo ambiguous line note mismatch: ${demoItems.at(-2)?.note}`);
if (demoItems.at(-1)?.note !== "金額を確認 / 日付を確認") failures.push(`demo missing amount/date note mismatch: ${demoItems.at(-1)?.note}`);

const edgeItems = normalizeItems(parseNotes([
  "6/3 売上 1,200円 2点",
  "6/3 売上 1,200円 注文No.9876",
  "6/3 メルカリ手数料 10%",
  "6/4 梱包材 110円×3",
  "6/5 売上 1,800円 残高 12,340円",
  "6/7 売上キャンセル -1,200円",
  "6/7 返品 売上 1,200円",
  "6/8 送料返金 210円",
  "6/9 販売手数料 250円",
  "6/10 送料無料 売上 1,500円",
  "6/11 手数料無料 売上 1,200円",
  "2026/6/16 送料メモ"
].join("\n")));
const edgeByMemo = Object.fromEntries(edgeItems.map(item => [item.memo, item]));
const edgeTotals = calculateTotals(edgeItems);
if (edgeByMemo["6/3 売上 1,200円 2点"].amount !== 1200) failures.push("quantity amount should remain 1200");
if (edgeByMemo["6/3 売上 1,200円 注文No.9876"].amount !== 1200) failures.push("order no should not override amount");
if (!edgeByMemo["6/3 メルカリ手数料 10%"].note.includes("割合を確認")) failures.push("percentage fee should need rate review");
if (!edgeByMemo["6/4 梱包材 110円×3"].note.includes("単価/数量を確認")) failures.push("unit quantity should need review");
if (!edgeByMemo["6/5 売上 1,800円 残高 12,340円"].note.includes("残高を確認")) failures.push("balance should need review");
if (!edgeByMemo["6/7 売上キャンセル -1,200円"].note.includes("返品/返金/取消を確認")) failures.push("cancel should need review");
if (!edgeByMemo["6/7 返品 売上 1,200円"].note.includes("返品/返金/取消を確認")) failures.push("return should need review");
if (!edgeByMemo["6/8 送料返金 210円"].note.includes("返品/返金/取消を確認")) failures.push("refund should need review");
if (edgeByMemo["6/9 販売手数料 250円"].type !== "expense" || edgeByMemo["6/9 販売手数料 250円"].category !== "fee") failures.push("sales fee should be fee expense");
if (edgeByMemo["6/10 送料無料 売上 1,500円"].type !== "income") failures.push("free shipping sale should stay income");
if (edgeByMemo["6/11 手数料無料 売上 1,200円"].type !== "income") failures.push("free fee sale should stay income");
if (edgeByMemo["2026/6/16 送料メモ"].amount !== 0 || !edgeByMemo["2026/6/16 送料メモ"].note.includes("金額を確認")) failures.push("date-only shipping memo should not use year as amount");
if (edgeTotals.income !== 5100) failures.push(`edge income expected 5100, got ${edgeTotals.income}`);
if (edgeTotals.expense !== 250) failures.push(`edge expense expected 250, got ${edgeTotals.expense}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Demo parsing checks passed.");
