# Release Notes

## Recommended First Release

Use Cloudflare because requirements are lighter than Google Play or Apple App Store.

1. Create a Cloudflare Pages project for `public/`.
2. Keep the public demo browser-only at first.
3. Create a Cloudflare Worker and KV queue only after an owner-approved paid review model exists.
4. If the queue is enabled later, bind KV as `RECEIPT_SORTER_KV`, set `OPENCLAW_QUEUE_TOKEN`, and add the Worker API URL to the frontend.

## Current MVP Scope

- Landing-first entry screen at `public/index.html`.
- Browser-side cleanup preview at `public/app.html`.
- Editable review cards for type, category, and amount correction.
- Copyable monthly confirmation checklist.
- Compatibility copy of the landing page at `public/landing.html` for owner review.
- JSON export.
- Worker queue source remains available for future OpenClaw review, but is not part of the first public offer.
- No file uploads.
- No runtime AI API cost.

## First Offer Positioning

Do not sell this as generic receipt OCR, full accounting software, or CSV conversion.

Sell the first version as a browser-only monthly check tool for Mercari side sellers with roughly 10-50 sales notes per month:

- Paste sales notes, shipping notes, fee notes, packaging notes, and admin memos.
- Split them into sales, shipping, supplies, printing, travel, software, meeting, and needs-review.
- Produce a monthly summary and confirmation checklist before accounting software or tax-accountant work.
- Keep data local unless the user explicitly saves or submits a package.

Initial pricing hypothesis:

- JPY 1,980 one-time beta/lifetime purchase.
- Revisit JPY 3,980/year only after repeated monthly use is visible.

## Next Build Step

Prepare a local demo pass with the narrowed landing-page offer:

- Open `public/index.html` and confirm every demo link reaches `public/app.html`.
- Keep JPY 1,980 beta/lifetime purchase as the only visible pricing hypothesis.
- Keep BOOTH out of the first landing page; validate it later with a separate creator-sales page if needed.
- Keep the demo local and synthetic.
- Do not add payment, form submission, analytics, or external posting before owner approval.

Backend submission should wait until there is an approved route and a clear paid-review model.
