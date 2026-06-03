export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/requests") {
      const payload = await request.json();
      const id = crypto.randomUUID();
      const record = {
        id,
        status: "pending",
        createdAt: new Date().toISOString(),
        payload: sanitizePayload(payload)
      };
      await env.RECEIPT_SORTER_KV.put(`request:${id}`, JSON.stringify(record));
      return json({ ok: true, id });
    }

    if (request.method === "GET" && url.pathname === "/api/requests/pending") {
      if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
      const list = await env.RECEIPT_SORTER_KV.list({ prefix: "request:" });
      const records = [];
      for (const key of list.keys.slice(0, 20)) {
        const raw = await env.RECEIPT_SORTER_KV.get(key.name);
        if (!raw) continue;
        const record = JSON.parse(raw);
        if (record.status === "pending") records.push(record);
      }
      return json({ ok: true, records });
    }

    if (request.method === "POST" && url.pathname.startsWith("/api/requests/")) {
      if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
      const id = url.pathname.split("/").at(-1);
      const raw = await env.RECEIPT_SORTER_KV.get(`request:${id}`);
      if (!raw) return json({ ok: false, error: "not_found" }, 404);
      const record = JSON.parse(raw);
      const update = await request.json();
      record.status = update.status || record.status;
      record.result = update.result || null;
      record.updatedAt = new Date().toISOString();
      await env.RECEIPT_SORTER_KV.put(`request:${id}`, JSON.stringify(record));
      return json({ ok: true, id });
    }

    return json({ ok: false, error: "not_found" }, 404);
  }
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*"
    }
  });
}

function authorized(request, env) {
  const expected = env.OPENCLAW_QUEUE_TOKEN;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function sanitizePayload(payload) {
  return {
    app: "receipt-sorter",
    version: String(payload.version || "unknown").slice(0, 20),
    createdAt: String(payload.createdAt || new Date().toISOString()),
    period: payload.period || null,
    useCase: payload.useCase || null,
    reviewRequested: Boolean(payload.reviewRequested),
    totals: payload.totals || {},
    items: Array.isArray(payload.items) ? payload.items.slice(0, 200) : [],
    checklist: Array.isArray(payload.checklist) ? payload.checklist.slice(0, 50) : []
  };
}

