# Security Checks

Receipt Sorter is currently a static browser-side app hosted on Cloudflare Pages.

## Current Scope

- No user login.
- No administrator screen.
- No file upload.
- No server-side user data storage.
- No Stripe webhook.
- No active external checkout link until the Stripe Payment Link is set and sales checks pass.

## Regular Vulnerability Review

Run these checks before sales enablement and after each app change:

```bash
npm run security:check
npm run check:public
npm run check:public:remote
```

Run `npm run check:sales-ready` before enabling a Stripe purchase link. It must fail while `salesEnabled` is false or the Stripe Payment Link is missing.

## Initial Review

Initial vulnerability review was performed on 2026-06-05 for the static public surface:

- Checked no file upload input is present.
- Checked no server-submit form action is present.
- Checked no `fetch`, `XMLHttpRequest`, or `sendBeacon` external send path is present in public HTML/JS.
- Checked no active external Stripe checkout URL is exposed while sales are disabled.
- Checked no analytics tag or remote script is present.
- Checked local-only files such as `.env.local` and `.wrangler/` are not under `public/`.

Repeat at least monthly while the product is publicly available, and immediately after adding login, upload, admin screens, webhooks, server-side storage, or purchase automation.
