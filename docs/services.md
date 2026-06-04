# External Services

This file records third-party services used by Receipt Sorter so setup decisions are not lost.

## Cloudflare Pages

- Purpose: static hosting for the public landing page and browser app.
- Project: `receipt-sorter`
- Public URL: `https://receipt-sorter.pages.dev`
- Build/output directory: `public/`
- Current domain type: Cloudflare-provided `pages.dev` domain. No custom domain is configured yet.
- Deployment tool: Wrangler CLI.
- Notes:
  - `pages.dev` is a real public URL, not a local development-only URL.
  - If a custom domain is added later, keep `receipt-sorter.pages.dev` as the fallback/deployment reference.
  - After app changes, run the smallest meaningful checks, deploy Cloudflare Pages, and verify the public URL.

## Stripe

- Purpose: payment collection for beta access.
- Business display name used during setup: `Arrelumen Tools`.
- Current payment product: one-time beta access.
- Pricing hypothesis: JPY 1,980 one-time purchase.
- Integration type: Payment Links.
- Current payment mode: sandbox/test.
- Current sandbox Payment Link: `https://buy.stripe.com/test_8x24gB68pc824I158af3a00`
- Global sales handling: Stripe Managed Payments was selected/recommended for the initial test.
- Customer information:
  - Email address is expected through Stripe Checkout/Payment Links.
  - Name is useful for support and refund lookup.
  - Phone number and shipping address are not needed for this digital/browser tool.
- Notes:
  - The current `test_...` Payment Link does not move real money.
  - Replace the sandbox Payment Link with a live Payment Link before accepting real payments.
  - Managed Payments adds an extra fee but reduces early tax/VAT, fraud, dispute, and support burden.

## GitHub

- Purpose: source code hosting and version history.
- Repository: `https://github.com/trinitrotorol/receipt-sorter`
- Current owner: `trinitrotorol`
- Intended operating account: `arrelumen` / `arrelumen@gmail.com` for business-facing pushes.
- Current visibility: public.
- Notes:
  - Do not commit `.env`, `.env.*`, `.wrangler/`, generated queue JSON, generated result JSON, or local credentials.
  - Local commit author should stay service-specific, for example `Arrelumen Tools <arrelumen@gmail.com>`.
  - If the project reaches stable revenue, consider moving ownership to an Arrelumen-owned account or organization.

## Not Used Yet

- Custom domain: not configured.
- Analytics: not configured.
- Backend purchase verification: not configured.
- Stripe webhooks: not configured.
- User accounts or login: not configured.
- Cloudflare Worker/KV queue: source exists for future work, but is not part of the current public offer.
