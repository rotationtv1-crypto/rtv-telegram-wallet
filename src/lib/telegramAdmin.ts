/**
 * TELEGRAM BOT ADMIN — menu buttons, webhooks, identity checks
 * Used to wire @ROTATIONEROTICA_BOT and the main RTV bot without ever
 * exposing the bot token — everything runs server-side in the Worker.
 */

async function tgCall(token: string, method: string, body?: object) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<any>;
}

export async function getMe(token: string) {
  return tgCall(token, "getMe");
}

export async function setMenuButtonWebApp(token: string, text: string, url: string) {
  return tgCall(token, "setChatMenuButton", {
    menu_button: { type: "web_app", text, web_app: { url } },
  });
}

export async function setWebhook(token: string, webhookUrl: string) {
  return tgCall(token, "setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query", "pre_checkout_query", "successful_payment"],
    drop_pending_updates: false,
  });
}

export async function getWebhookInfo(token: string) {
  return tgCall(token, "getWebhookInfo");
}

// ── Route handler for the wiring endpoint ─────────────────────────────────
export async function routeTelegramAdmin(
  request: Request,
  url: URL,
  env: any
): Promise<Response | null> {
  const p = url.pathname;
  if (!p.startsWith("/api/admin/telegram/")) return null;

  const key = request.headers.get("X-Admin-Key") ?? "";
  if (!env.TELEGRAM_ADMIN_KEY || key !== env.TELEGRAM_ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const json = (d: any) => new Response(JSON.stringify(d), { headers: { "Content-Type": "application/json" } });

  const BOT_CONFIG: Record<string, { tokenKey: string; text: string; webhookPath: string }> = {
    main:    { tokenKey: "TELEGRAM_BOT_TOKEN_MAIN",    text: "Open RTV Live", webhookPath: "/telegram/wallet/webhook" },
    erotica: { tokenKey: "TELEGRAM_BOT_TOKEN_EROTICA", text: "Open RTV 18+",  webhookPath: "/telegram/erotica/webhook" },
  };

  const WEBAPP_URL = "https://rtv-frontend.pages.dev";
  const WORKER_BASE = "https://rotationtv-live-ai-clones.rotationtimmy.workers.dev";

  if (p === "/api/admin/telegram/identify" && request.method === "GET") {
    const results: Record<string, any> = {};
    for (const [key, cfg] of Object.entries(BOT_CONFIG)) {
      const token = env[cfg.tokenKey];
      results[key] = token ? await getMe(token) : { error: "token not set" };
    }
    return json(results);
  }

  if (p === "/api/admin/telegram/wire" && request.method === "POST") {
    const body = await request.json().catch(() => ({})) as { bot?: string };
    const targets = body.bot ? [body.bot] : Object.keys(BOT_CONFIG);
    const results: Record<string, any> = {};

    for (const key of targets) {
      const cfg = BOT_CONFIG[key];
      if (!cfg) { results[key] = { error: "unknown bot" }; continue; }
      const token = env[cfg.tokenKey];
      if (!token) { results[key] = { error: `${cfg.tokenKey} not set` }; continue; }

      const identity = await getMe(token);
      const menu = await setMenuButtonWebApp(token, cfg.text, WEBAPP_URL);
      const webhook = await setWebhook(token, `${WORKER_BASE}${cfg.webhookPath}`);
      const webhookInfo = await getWebhookInfo(token);

      results[key] = {
        identity: identity.result ? `@${identity.result.username}` : identity,
        menu_button_set: menu.ok,
        webhook_set: webhook.ok,
        webhook_url: webhookInfo.result?.url,
        pending_updates: webhookInfo.result?.pending_update_count,
      };
    }

    return json(results);
  }

  return json({ error: "not found" });
}
