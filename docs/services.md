# Services

Operational service inventory for Receipt Sorter.

## Cloudflare Pages

- Purpose: static hosting for the public landing page and browser app.
- Project: `receipt-sorter`
- Public URL: `https://receipt-sorter.pages.dev`
- Build/output directory: `public/`
- Current domain type: Cloudflare-provided `pages.dev` domain. No custom domain is configured yet.
- Deployment tool: Wrangler CLI.
- Notes:
  - If a custom domain is added later, keep `receipt-sorter.pages.dev` as the fallback/deployment reference.
  - After app changes, run the smallest meaningful checks, deploy Cloudflare Pages, and verify the public URL.

## Stripe

- Purpose: payment collection for beta access.
- Business display name used during setup: `Arrelumen Tools`.
- Integration type: Payment Links.
- Product type: one-time beta access.
- Price: JPY 1,980.
- Global sales handling: Stripe Managed Payments.
- Customer information:
  - Email address is expected through Stripe Checkout/Payment Links.
  - Name is useful for support and refund lookup.
  - Phone number and shipping address are not needed for this digital/browser tool.
- Notes:
  - Use a live Payment Link for production payments.
  - Do not commit Stripe secrets or webhook signing secrets.

## GitHub

- Purpose: source code hosting and version history.
- Repository: `https://github.com/trinitrotorol/receipt-sorter`
- Current owner: `trinitrotorol`
- Operating account for pushes: `arrelumen` / `arrelumen@gmail.com`.
- Current visibility: public.
- Notes:
  - Do not commit `.env`, `.env.*`, `.wrangler/`, generated queue JSON, generated result JSON, or local credentials.
  - Local commit author should stay `Arrelumen Tools <arrelumen@gmail.com>`.

## Not Used Yet

- Custom domain: not configured.
- Analytics: not configured.
- Backend purchase verification: not configured.
- Stripe webhooks: not configured.
- User accounts or login: not configured.
