/**
 * Native fetch handlers for WebApp menu setup (no Hono dependency).
 * Mirrors workers-src/routes/setupMenu.ts for the raw workers/src entry.
 *
 * POST /api/bots/setup-menu-all
 * POST /api/bots/:botId/setup-menu
 *
 * Auth: Authorization: Bearer <ADMIN_SECRET>
 */

export interface SetupMenuEnv {
  ADMIN_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_BOT_TOKEN_MAIN?: string;
  TELEGRAM_BOT_TOKEN_EROTICA?: string;
  TELEGRAM_BOT_TOKEN_6?: string;
  TELEGRAM_BOT_TOKEN_7?: string;
  MINI_APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  EROTICA_APP_URL?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return json({ error: 'Unauthorized' }, 401);
}

function requireAdmin(request: Request, env: SetupMenuEnv): boolean {
  const secret = env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${secret}`;
}

async function setChatMenuButton(
  token: string,
  text: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setChatMenuButton`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text,
          web_app: { url },
        },
      }),
    }
  );
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.description || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function handleSetupMenuRoutes(
  request: Request,
  env: SetupMenuEnv,
  pathname: string
): Promise<Response | null> {
  if (!pathname.startsWith('/api/bots/')) return null;
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  if (!requireAdmin(request, env)) return unauthorized();

  const base =
    env.MINI_APP_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    'https://rotationtv-mini-app.pages.dev';
  const eroticaUrl =
    env.EROTICA_APP_URL || `${base.split('?')[0]}?bot=erotica`;

  if (pathname === '/api/bots/setup-menu-all') {
    const mainToken =
      env.TELEGRAM_BOT_TOKEN_MAIN ||
      env.TELEGRAM_BOT_TOKEN_6 ||
      env.TELEGRAM_BOT_TOKEN;
    const eroticaToken =
      env.TELEGRAM_BOT_TOKEN_EROTICA || env.TELEGRAM_BOT_TOKEN_7;

    const results: Array<{
      bot: string;
      success: boolean;
      error?: string;
    }> = [];

    if (mainToken) {
      const r = await setChatMenuButton(mainToken, 'Open RotationTV', base);
      results.push({ bot: 'main', success: r.ok, error: r.error });
    }
    if (eroticaToken) {
      const r = await setChatMenuButton(
        eroticaToken,
        'Open Erotica',
        eroticaUrl
      );
      results.push({ bot: 'erotica', success: r.ok, error: r.error });
    }

    if (results.length === 0) {
      return json({ error: 'No bot tokens in worker bindings' }, 400);
    }
    const failed = results.filter((x) => !x.success);
    if (failed.length) {
      return json({ success: false, results }, 502);
    }
    return json({ success: true, results });
  }

  const single = pathname.match(/^\/api\/bots\/([^/]+)\/setup-menu$/);
  if (single) {
    const botId = single[1];
    let token: string | undefined;
    let text = 'Open RotationTV';
    let url = base;

    if (botId === 'main') {
      token =
        env.TELEGRAM_BOT_TOKEN_MAIN ||
        env.TELEGRAM_BOT_TOKEN_6 ||
        env.TELEGRAM_BOT_TOKEN;
    } else if (botId === 'erotica') {
      token = env.TELEGRAM_BOT_TOKEN_EROTICA || env.TELEGRAM_BOT_TOKEN_7;
      text = 'Open Erotica';
      url = eroticaUrl;
    } else {
      return json({ error: 'BOT_NOT_REGISTERED' }, 404);
    }

    if (!token) return json({ error: 'BOT_TOKEN_MISSING' }, 400);
    const r = await setChatMenuButton(token, text, url);
    if (!r.ok) return json({ ok: false, error: r.error }, 502);
    return json({ ok: true, botId, menu: { text, url } });
  }

  return null;
}
