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

## Next Build Step

Add a guarded submit button once the Worker URL exists. Until then, JSON export is the safe first path.

