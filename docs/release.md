# Release Notes

## Recommended First Release

Use Cloudflare because requirements are lighter than Google Play or Apple App Store.

1. Create a Cloudflare Pages project for `public/`.
2. Create a Cloudflare Worker from `worker/worker.js`.
3. Create a KV namespace and bind it as `RECEIPT_SORTER_KV`.
4. Set `OPENCLAW_QUEUE_TOKEN` as a Worker secret.
5. Add the Worker API URL to the frontend when request submission is enabled.

## Current MVP Scope

- Browser-side cleanup preview.
- JSON export.
- Worker queue source for future OpenClaw review.
- No file uploads.
- No runtime AI API cost.

## First Offer Positioning

Do not sell this as generic receipt OCR, full accounting software, or CSV conversion.

Sell the first version as a browser-only monthly check tool for Mercari, BOOTH, BASE, minne, and small side-job sellers:

- Paste sales notes, shipping notes, receipt notes, and admin memos.
- Split them into sales, shipping, supplies, printing, travel, software, meeting, and needs-review.
- Produce a monthly summary and confirmation checklist before accounting software or tax-accountant work.
- Keep data local unless the user explicitly saves or submits a package.

Initial pricing hypothesis:

- JPY 1,980 one-time beta/lifetime purchase.
- Revisit JPY 3,980/year only after repeated monthly use is visible.

## Next Build Step

Add editable review cards before backend submission:

- Type/category correction.
- Amount correction.
- Copyable monthly confirmation checklist.

Backend submission should wait until there is an approved route and a clear paid-review model.
