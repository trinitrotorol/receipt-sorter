# Receipt Sorter

Low-maintenance web app for side-job workers and sole proprietors who need to organize messy receipt, invoice, and sales notes before accounting or tax work.

## Positioning

This app does not sell "CSV conversion." It sells relief from a concrete admin chore:

- paste messy Mercari sales, shipping, fee, and packaging notes
- get a structured cleanup preview in the browser
- correct only the rows that need review
- copy a monthly confirmation checklist and save an export for later accounting work

The first release avoids runtime AI API cost. Browser-side rules do the first pass. Manual/OpenClaw-assisted review is not part of the first public offer.

## Release Target

Recommended release path:

- Frontend: Cloudflare Pages
- Backend: defer until an approved paid review model exists
- Storage: defer until an approved paid review model exists

This avoids Google Play and Apple App Store review. It also keeps the app separate from the main OpenClaw workspace. Worker/KV queue support can wait until there is a clear paid review model.

## Local Run

Open `public/index.html` directly in a browser, or run a static server:

```bash
npm run serve
```

Then open:

```text
http://127.0.0.1:4173
```

## Local Queue Processing

Example:

```bash
npm run process:sample
```

This reads `examples/sample-request.json` and writes a structured result to `data/results/`.

## Safety Model

- Public users never access OpenClaw directly.
- No OpenClaw review queue is connected in the first public offer.
- If a review queue is added later, OpenClaw pulls pending requests through a narrow API or local export.
- OpenClaw does not receive secrets, workspace memory, Discord access, Gmail access, or shell access through the app.
- No file uploads in the first version.
- Users are told not to submit personal numbers, card numbers, medical info, payroll data, or confidential client data.

## Pricing Hypothesis

- Free browser preview.
- JPY 1,980 one-time beta/lifetime purchase for the first public offer.
- Later: JPY 3,980/year only after repeated monthly cleanup is visible.
- JPY 980/month or manual review pricing should stay out of the first release until usage and support burden are proven.
