# Receipt Sorter

Browser-based monthly sales-note organizer for small Mercari and side-business sellers.

## What It Does

Receipt Sorter helps users turn messy sales, shipping, fee, packaging, and admin notes into a monthly review table before they move numbers into accounting software.

- Paste sales and expense notes.
- Review automatically grouped rows.
- Correct type, category, and amount where needed.
- Copy a monthly confirmation checklist.
- Export a JSON package for local recordkeeping.
- Save and restore a browser-local draft.

The app is browser-side and rule-based. It does not upload files, perform OCR, provide tax advice, or create tax filings.

## Public URLs

- Landing page: `https://receipt-sorter.pages.dev`
- App: `https://receipt-sorter.pages.dev/app.html`

## Local Run

Open `public/index.html` directly in a browser, or run a static server:

```bash
npm run serve
```

Then open:

```text
http://127.0.0.1:4173
```

## Local Sample Processing

Example:

```bash
npm run process:sample
```

This reads `examples/sample-request.json` and writes a structured result to `data/results/`.

Generated results are ignored by git except for `data/results/.gitkeep`.

## Development Notes

- Static files live in `public/`.
- The app entry point is `public/app.html`.
- The landing entry point is `public/index.html`.
- `public/landing.html` is kept as a compatibility copy of the landing page.
- Do not commit `.env`, `.env.*`, `.wrangler/`, generated queue JSON, generated result JSON, or local credentials.

## Scope

Receipt Sorter is not affiliated with Mercari. It is a note organization tool, not accounting, legal, or tax advice.
