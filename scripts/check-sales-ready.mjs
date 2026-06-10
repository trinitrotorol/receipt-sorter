import { readFile } from "node:fs/promises";

const configText = await readFile(new URL("../public/sales-config.js", import.meta.url), "utf8");
const publicFiles = ["checkout.html", "success.html", "legal.html", "privacy.html"];

const configRequirements = [
  ["salesEnabled: true", "salesEnabled must be true"],
  [/stripePaymentUrl:\s*"https:\/\/buy\.stripe\.com\/[^"]+"/, "stripePaymentUrl must be a Stripe Payment Link"],
  [/supportEmail:\s*"[^"@\s]+@[^"@\s]+\.[^"@\s]+"/, "supportEmail must be set"],
  [/sellerName:\s*"[^"]{2,}"/, "sellerName must be set"],
  [/operatorName:\s*"[^"]{2,}"/, "operatorName must be set"],
  [/locationAndPhoneDisplay:\s*"[^"]{8,}"/, "locationAndPhoneDisplay must be set"],
  [/priceTaxStatus:\s*"[^"]{4,}"/, "priceTaxStatus must be set"],
  [/paymentMethod:\s*"[^"]{4,}"/, "paymentMethod must be set"],
  [/paymentTiming:\s*"[^"]{4,}"/, "paymentTiming must be set"],
  [/deliveryTiming:\s*"[^"]{4,}"/, "deliveryTiming must be set"],
  [/deliveryMethod:\s*"[^"]{4,}"/, "deliveryMethod must be set"],
  [/refundPolicy:\s*"[^"]{8,}"/, "refundPolicy must be set"]
];

const requiredPublicTextByFile = {
  "checkout.html": [
    "Stripe",
    "購入前の最終確認",
    "1,980円（税込）",
    "無料デモとの差分",
    "返金",
    "返金申請期限",
    "提供時期",
    "支払方法",
    "問い合わせ先",
    "arrelumen@gmail.com"
  ],
  "success.html": [
    "Stripe",
    "決済後24時間以内",
    "返金",
    "次にやること",
    "arrelumen@gmail.com"
  ],
  "legal.html": [
    "Stripe",
    "購入前確認",
    "特定商取引法に基づく表記",
    "1,980円（税込）",
    "返金",
    "提供時期",
    "支払方法",
    "お問い合わせ",
    "arrelumen@gmail.com",
    "販売者情報開示請求",
    "請求があった場合に遅滞なく"
  ],
  "privacy.html": [
    "プライバシーポリシー",
    "arrelumen@gmail.com",
    "Cloudflare Pages",
    "カード番号を保持しません"
  ]
};

const failures = [];

for (const [rule, message] of configRequirements) {
  if (typeof rule === "string") {
    if (!configText.includes(rule)) failures.push(message);
  } else if (!rule.test(configText)) {
    failures.push(message);
  }
}

for (const file of publicFiles) {
  const text = await readFile(new URL(`../public/${file}`, import.meta.url), "utf8");
  for (const required of requiredPublicTextByFile[file] || []) {
    if (!text.includes(required)) {
      failures.push(`${file}: missing "${required}"`);
    }
  }
}

if (failures.length > 0) {
  console.error("Sales is not ready:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Sales-ready checks passed.");
