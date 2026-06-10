# Receipt Sorter fulfillment checklist

Use this checklist for each Stripe Payment Link purchase until webhooks or a customer portal exist.

## Before accepting purchases

- Confirm there are no outstanding Stripe account restrictions, onboarding requirements, or information requests that could block payment processing, buyer emails, or payouts.
- Confirm Stripe email notifications for successful payments are enabled.
- Confirm the Stripe Payment Link collects the buyer email address.
- Confirm `arrelumen@gmail.com` can send and receive support mail.
- Keep `public/checkout.html`, `public/legal.html`, `public/privacy.html`, and `public/success.html` consistent before deployment.
- Keep a local sales log ready. Do not commit real buyer emails, Stripe transaction IDs, or support details to the public repo.
- For the first purchase, use `revenue/launch/receipt-sorter-first-purchase-monitoring-2026-06-06-2017.md` as the local watch card and keep any real sales log outside the public repo.

## For each purchase

1. Check Stripe for a successful payment.
2. Record the buyer email, payment time, payment status, Stripe transaction identifier, and 24-hour delivery deadline in the local sales log.
3. Send the use-start email within 24 hours from the successful payment timestamp.
4. Record the sent time and sender account in the local sales log.
5. If email delivery fails, retry once and keep the failure note in the local sales log.
6. If the buyer asks for a refund, verify whether it matches the published refund conditions before acting in Stripe.

## Post-purchase feedback

- Ask the owner before sending any feedback request.
- Send at most one feedback request, 48-72 hours after the use-start email.
- Do not send a feedback request when a refund, dispute, missing-email, failed delivery, sensitive-file, or unresolved support stop condition is active.
- Keep the request to workflow fit, missing value, and JPY 1,980 purchase satisfaction.
- Do not ask for receipts, tax documents, customer data, marketplace exports, screenshots containing personal data, or real order identifiers.
- Classify replies locally as `fit_paid`, `fit_unclear`, `wrong_job`, `support_risk`, or `refund_risk` before changing the product or copy.
- Treat two or more `support_risk` or `refund_risk` replies in the first five buyers as a stop signal before widening promotion.

## Stop conditions

- If Stripe asks for additional account, identity, business, payout, or compliance information, stop before widening promotion and ask the owner to resolve it in the official Stripe dashboard.
- If the buyer email is missing from Stripe, do not guess. Contact the owner before fulfillment.
- If a payment is pending, failed, disputed, or refunded, do not send the use-start email until the payment status is clear.
- If more than 24 hours have passed since successful payment and no use-start email was sent, prioritize fulfillment immediately and keep the delay note. If the buyer contacts support and the issue is not resolved within 48 hours after that contact, the published refund condition may apply.
- If the buyer sends sensitive files, tax documents, customer data, card details, or personal-number data, do not process them. Ask them to remove sensitive details and use anonymized text only.
- If login, account issuance, private builds, Stripe webhooks, customer databases, automated emails, or analytics are added later, redo the security and privacy review before using this checklist unchanged.

## Local sales log fields

Keep real entries in a private local file or trusted payment/support system, not in public docs.

- Payment received at:
- 24-hour delivery deadline:
- Buyer email:
- Stripe payment/session identifier:
- Payment status:
- Use-start email sent at:
- Sender account:
- Delivery result:
- Feedback request approved by owner:
- Feedback request sent at:
- Feedback reply classification:
- Support/refund notes:

## Use-start email template

Subject: Receipt Sorter 製品版 v1.0 の利用開始案内

Receipt Sorter 製品版 v1.0 をご購入いただきありがとうございます。

決済確認が完了しました。以下を確認して利用を開始してください。

- 利用URL: https://receipt-sorter.pages.dev/app
- 購入前確認: https://receipt-sorter.pages.dev/checkout
- 特定商取引法に基づく表記: https://receipt-sorter.pages.dev/legal
- プライバシーポリシー: https://receipt-sorter.pages.dev/privacy

まず無料デモと同じ画面で、販売メモを貼り付けて確認リストを作成してください。入力内容はブラウザ内で処理され、Receipt Sorter のサーバーへは送信されません。下書き保存を使う場合は、同じブラウザのローカル保存領域に保存されます。

このツールは販売メモの整理補助です。税務相談、節税判断、申告書作成、レシート画像OCR、会計ソフト自動連携は含みません。

個人番号、カード番号、顧客住所、実注文ID、医療・給与・税務書類、取引先秘密情報、その他の機密情報は入力しないでください。

問い合わせ時は、購入時メールアドレスと決済日時を添えて arrelumen@gmail.com へ連絡してください。

## Seller information disclosure template

Subject: Receipt Sorter 販売者情報の開示

販売者情報開示請求を受け付けました。

以下、購入判断に先立って確認いただく販売者情報です。購入申込み前に十分な時間的余裕をもって提供してください。

実情報は公開リポジトリや公開HTMLに書かず、ローカルの `private/seller-info.md` にだけ保管してください。この `private/` ディレクトリは `.gitignore` 対象です。販売開始前と開示請求への返信前に `npm run check:seller-info` を実行し、空欄がないことを確認してください。

- 販売事業者:
- 運営責任者:
- 所在地:
- 電話番号:
- お問い合わせ: arrelumen@gmail.com

## Refund response template

Subject: Receipt Sorter 返金申請について

返金申請を受け付けました。

確認のため、以下を返信してください。

- 購入時メールアドレス:
- 決済日時:
- 状況:

公開している返金条件に該当する場合、Stripe経由で返金処理を行います。
