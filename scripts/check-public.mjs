import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const publicDir = new URL("../public/", import.meta.url);
const remoteBaseUrl = process.argv[2] || "";
const configText = await readFile(new URL("../public/sales-config.js", import.meta.url), "utf8");
const salesEnabled = /salesEnabled:\s*true/.test(configText);
const stripePaymentUrl = configText.match(/stripePaymentUrl:\s*"([^"]+)"/)?.[1] || "";
const allowedMailtoPattern = /mailto:arrelumen@gmail\.com(?:\?[^"'<>\\\s]*)?/gi;

const forbidden = [
  { name: "mailto link", pattern: /mailto:/i },
  { name: "form submission", pattern: /<form\b[^>]*\baction\s*=/i },
  { name: "fetch call", pattern: /\bfetch\s*\(/i },
  { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/i },
  { name: "sendBeacon", pattern: /\bsendBeacon\s*\(/i },
  { name: "active Stripe link", pattern: /https:\/\/(?:buy|checkout)\.stripe\.com/i },
  { name: "Gumroad", pattern: /gumroad/i },
  { name: "external checkout link", pattern: /https:\/\/(?:buy|checkout)/i },
  { name: "analytics", pattern: /gtag|google-analytics|plausible|analytics/i },
  { name: "live payment key", pattern: /\b(?:sk|pk)_live_[A-Za-z0-9]+/i }
];

const forbiddenText = [
  "ベータ版提供中",
  "1,980円ベータは承認待ち",
  "ベータ版 1,980円",
  "ベータ版は1,980円の買い切り予定です。",
  "購入前確認ページを用意しています。",
  "1,980円 買い切りベータ",
  "販売前",
  "承認待ち",
  "準備ページ",
  "有効化します",
  "正式販売時",
  "使う予定",
  "購入導線は導入・有効化していません",
  "決済リンクを有効化します",
  "税込/税別"
];

const requiredByFile = {
  "index.html": [
    "無料デモ公開中。製品版 v1.0 販売中",
    "購入前の最終確認",
    "1,980円（税込）",
    "特定商取引法に基づく表記",
    "プライバシー"
  ],
  "app.html": [
    "購入前の最終確認",
    "1,980円（税込）",
    "無料デモとの差分",
    "個人番号、カード番号、顧客住所、実注文ID、医療・給与・税務書類、取引先秘密情報、その他の機密情報",
    "特定商取引法に基づく表記",
    "プライバシー"
  ],
  "legal.html": [
    "特定商取引法に基づく表記",
    "1,980円（税込）",
    "販売者情報開示請求",
    "請求があった場合に遅滞なく電子メールで提供",
    "arrelumen@gmail.com",
    "Stripe Payment Link"
  ],
  "privacy.html": [
    "現行版では、入力した販売メモを Receipt Sorter のサーバーへ送信しません",
    "Cloudflare Pages",
    "カード番号を保持しません",
    "Stripe Payment Linkによる製品版 v1.0 購入"
  ],
  "checkout.html": [
    "購入前の最終確認",
    "Stripeで購入する",
    "1,980円（税込）",
    "Receipt Sorter 製品版 v1.0",
    "無料デモとの差分",
    "動作環境",
    "よくある質問",
    "外部AI",
    "確定申告、税務相談、申告書作成",
    "返金申請期限",
    "特定商取引法に基づく表記"
  ],
  "furima-monthly-memo.html": [
    "メルカリなどのフリマ販売メモを月末に整理する方法",
    "会計入力前に確認しやすく整理する方法",
    "Receipt Sorterは株式会社メルカリのサービスではありません",
    "フリマサービスとの自動接続、会計ソフト連携、自動仕訳、税務判断は行いません",
    "売上候補",
    "送料候補",
    "手数料候補",
    "梱包材候補",
    "無料デモを開く",
    "購入前の最終確認へ"
  ],
  "success.html": [
    "決済後の案内",
    "決済後24時間以内",
    "このページの表示だけでは購入完了を証明しません",
    "次にやること",
    "arrelumen@gmail.com"
  ]
};

const remotePathToFile = {
  "/": "index.html",
  "/app": "app.html",
  "/legal": "legal.html",
  "/privacy": "privacy.html",
  "/checkout": "checkout.html",
  "/furima-monthly-memo": "furima-monthly-memo.html",
  "/success": "success.html"
};

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  }));
  return files.flat();
}

async function readTargets() {
  if (!remoteBaseUrl) {
    const files = await listFiles(publicDir.pathname);
    const checked = files.filter(file => /\.(?:html|js)$/i.test(file));
    return Promise.all(checked.map(async file => ({
      relative: path.relative(publicDir.pathname, file),
      text: await readFile(file, "utf8")
    })));
  }

  const base = remoteBaseUrl.replace(/\/$/, "");
  return Promise.all(Object.entries(remotePathToFile).map(async ([urlPath, relative]) => {
    const response = await fetch(`${base}${urlPath}`, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`${urlPath}: HTTP ${response.status}`);
    }
    return { relative, text: await response.text() };
  }));
}

const checked = await readTargets();
const failures = [];

for (const { relative, text } of checked) {
  for (const rule of forbidden) {
    if (rule.name === "mailto link") {
      const remaining = text.replace(allowedMailtoPattern, "");
      if (rule.pattern.test(remaining)) {
        failures.push(`${relative}: forbidden mailto link`);
      }
      continue;
    }
    if (salesEnabled && ["active Stripe link", "external checkout link"].includes(rule.name)) {
      if (text.match(rule.pattern) && !text.includes(stripePaymentUrl)) {
        failures.push(`${relative}: unexpected external checkout link`);
      }
      continue;
    }
    if (rule.pattern.test(text)) {
      failures.push(`${relative}: forbidden ${rule.name}`);
    }
  }

  for (const phrase of forbiddenText) {
    if (text.includes(phrase)) {
      failures.push(`${relative}: stale or unsafe phrase "${phrase}"`);
    }
  }

  for (const required of requiredByFile[relative] || []) {
    if (!text.includes(required)) {
      failures.push(`${relative}: missing required text "${required}"`);
    }
  }

  if (relative === "checkout.html" && salesEnabled) {
    const purchaseSectionIndex = text.indexOf("<h2>購入へ進む</h2>");
    const firstStripeIndex = text.indexOf(stripePaymentUrl);
    if (purchaseSectionIndex === -1) {
      failures.push(`${relative}: missing purchase confirmation section`);
    }
    if (firstStripeIndex === -1) {
      failures.push(`${relative}: missing Stripe payment link`);
    }
    if (purchaseSectionIndex !== -1 && firstStripeIndex !== -1 && firstStripeIndex < purchaseSectionIndex) {
      failures.push(`${relative}: Stripe payment link appears before purchase confirmation section`);
    }
    const stripeLinkCount = text.split(stripePaymentUrl).length - 1;
    if (stripeLinkCount !== 1) {
      failures.push(`${relative}: expected exactly one Stripe payment link, found ${stripeLinkCount}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${checked.length} ${remoteBaseUrl ? "remote" : "local"} public files; purchase/external-send guards passed.`);
