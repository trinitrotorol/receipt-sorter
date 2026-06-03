# Receipt Sorter

Low-maintenance web app for side-job workers and sole proprietors who need to organize messy receipt, invoice, and sales notes before accounting or tax work.

## Positioning

This app does not sell "CSV conversion." It sells relief from a concrete admin chore:

- paste messy expense / income notes
- get a structured cleanup preview in the browser
- optionally submit a small review request
- OpenClaw processes queued requests behind the scenes

The first release avoids runtime AI API cost. Browser-side rules do the first pass. OpenClaw can act as the semi-manual backend for small-scale review.

## Release Target

Recommended release path:

- Frontend: Cloudflare Pages
- Backend: Cloudflare Worker
- Storage: Cloudflare KV or D1

This avoids Google Play and Apple App Store review. It also keeps the app separate from the main OpenClaw workspace.

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
- The Worker stores only submitted request data.
- OpenClaw pulls pending requests through a narrow API or local export.
- OpenClaw does not receive secrets, workspace memory, Discord access, Gmail access, or shell access through the app.
- No file uploads in the first version.
- Users are told not to submit personal numbers, card numbers, medical info, payroll data, or confidential client data.

## Pricing Hypothesis

- Free browser preview.
- JPY 980-1,980 per manual/OpenClaw-assisted cleanup review.
- Later: JPY 3,980/year for saved templates and repeated monthly cleanup.

