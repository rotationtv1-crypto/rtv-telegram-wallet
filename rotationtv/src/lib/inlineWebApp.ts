/**
 * Telegram Inline WebApp Integration
 * Enables inline mode with WebApp buttons for both bots.
 * Users can type @botname in any chat and get interactive WebApp results.
 *
 * Entity: Darrel-spell-living-trust
 */

export interface InlineWebAppResult {
  type: string;
  id: string;
  title: string;
  description: string;
  web_app?: { url: string; title: string };
  reply_markup?: any;
  thumb_url?: string;
}

/**
 * Generate inline results for RotationTV main bot.
 * Results open Mini App / Web App directly from inline query.
 */
export function getMainBotInlineResults(
  botUsername: string,
  webAppUrl: string,
  query: string
): InlineWebAppResult[] {
  const base = webAppUrl.replace(/\/$/, '');
  const q = query.toLowerCase().trim();

  const results: InlineWebAppResult[] = [
    {
      type: 'article',
      id: 'open-rotationtv',
      title: '🔴 Open RotationTV',
      description: 'Launch the full Mini App — streams, AI hosts, gifts',
      web_app: { url: base, title: 'Open RotationTV' },
      thumb_url: 'https://media.base44.com/images/public/69f330e280d516038e46c473/d4e7c3275_generated_image.png',
    },
    {
      type: 'article',
      id: 'go-live',
      title: '📹 Go Live',
      description: 'Start broadcasting — camera + mic + AI co-host',
      web_app: { url: `${base}?action=go-live`, title: 'Go Live' },
    },
    {
      type: 'article',
      id: 'send-gift',
      title: '🎁 Send a Gift',
      description: 'Send Stars gifts to your favorite creators',
      web_app: { url: `${base}?action=gifts`, title: 'Send a Gift' },
      reply_markup: {
        inline_keyboard: [[
          { text: '🎁 Open Gift Shop', web_app: { url: `${base}?action=gifts` } },
        ]],
      },
    },
    {
      type: 'article',
      id: 'rotationdate',
      title: '💕 RotationDate',
      description: 'Gender-segmented dating — find your match',
      web_app: { url: `${base}?action=rotationdate`, title: 'RotationDate' },
      reply_markup: {
        inline_keyboard: [[
          { text: '💕 Start Dating', web_app: { url: `${base}?action=rotationdate` } },
        ]],
      },
    },
    {
      type: 'article',
      id: 'ai-hosts',
      title: '🤖 AI Hosts',
      description: 'Chat with LEO, MAYA, DR. REED, ZARA, OMAR, LINA',
      web_app: { url: `${base}?action=hosts`, title: 'AI Hosts' },
    },
    {
      type: 'article',
      id: 'wallet',
      title: '💳 Wallet & Stars',
      description: 'Check your balance, buy Stars, manage subscriptions',
      web_app: { url: `${base}?action=wallet`, title: 'Wallet' },
    },
  ];

  // Filter by query
  if (q) {
    return results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }
  return results;
}

/**
 * Generate inline results for RotationTV Erotica bot.
 */
export function getEroticaBotInlineResults(
  botUsername: string,
  webAppUrl: string,
  query: string
): InlineWebAppResult[] {
  const base = webAppUrl.replace(/\/$/, '');
  const q = query.toLowerCase().trim();

  const results: InlineWebAppResult[] = [
    {
      type: 'article',
      id: 'open-erotica',
      title: '🔴 RotationTV Erotica',
      description: 'Adult content — 18+ only. AI hosts, private sessions',
      web_app: { url: base, title: 'Open Erotica' },
    },
    {
      type: 'article',
      id: 'private-session',
      title: '🔒 Private Session',
      description: '1-on-1 with your favorite AI host — Stars required',
      web_app: { url: `${base}?action=private`, title: 'Private Session' },
      reply_markup: {
        inline_keyboard: [[
          { text: '🔒 Book Session', web_app: { url: `${base}?action=private` } },
        ]],
      },
    },
    {
      type: 'article',
      id: 'premium-content',
      title: '🔥 Premium Content',
      description: 'Unlock exclusive galleries and videos',
      web_app: { url: `${base}?action=premium`, title: 'Premium Content' },
    },
    {
      type: 'article',
      id: 'subscribe',
      title: '💎 Subscribe',
      description: 'Monthly access — unlock everything',
      web_app: { url: `${base}?action=subscribe`, title: 'Subscribe' },
      reply_markup: {
        inline_keyboard: [[
          { text: '💎 Subscribe with Stars', web_app: { url: `${base}?action=subscribe` } },
        ]],
      },
    },
  ];

  if (q) {
    return results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }
  return results;
}

/**
 * Answer an inline query with WebApp results.
 */
export async function answerInlineQuery(
  botToken: string,
  inlineQueryId: string,
  results: InlineWebAppResult[]
): Promise<boolean> {
  try {
    // Telegram requires results to have specific format for WebApp buttons
    const formattedResults = results.map((r, i) => ({
      type: r.type,
      id: r.id || `result-${i}`,
      title: r.title,
      description: r.description,
      thumb_url: r.thumb_url,
      reply_markup: r.reply_markup,
      web_app: r.web_app ? { url: r.web_app.url, title: r.web_app.title } : undefined,
    }));

    const res = await fetch(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inline_query_id: inlineQueryId,
        results: formattedResults,
        cache_time: 30,
        is_personal: true,
      }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}
