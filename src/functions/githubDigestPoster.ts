import { createClientFromRequest } from 'npm:@base44/sdk@0.8.0';

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { text, slackBlocks } = body;

  const results: Record<string, unknown> = {};

  // Discord
  const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL') || '';
  if (discordWebhook && text) {
    try {
      // Discord max 2000 chars
      const content = text.length > 1900 ? text.slice(0, 1900) + '\n…(truncated)' : text;
      const r = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, username: 'RTV Dev Digest', allowed_mentions: { parse: [] } }),
      });
      results.discord = { ok: r.ok, status: r.status };
    } catch (e) {
      results.discord = { ok: false, error: String(e) };
    }
  } else {
    results.discord = { skipped: !discordWebhook ? 'no DISCORD_WEBHOOK_URL' : 'no text' };
  }

  // Slack — try bot token first, then incoming webhook
  const slackToken = Deno.env.get('SLACK_BOT_TOKEN') || '';
  const slackChannel = Deno.env.get('SLACK_DIGEST_CHANNEL') || Deno.env.get('SLACK_CHANNEL') || '';
  const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL') || '';
  if (slackToken && slackChannel && text) {
    try {
      const r = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${slackToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: slackChannel, text, username: 'RTV Dev Digest', icon_emoji: ':robot_face:' }),
      });
      const j = await r.json();
      results.slack = { ok: j.ok, error: j.error };
    } catch (e) {
      results.slack = { ok: false, error: String(e) };
    }
  } else if (slackWebhook && text) {
    try {
      const r = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      results.slack = { ok: r.ok, status: r.status };
    } catch (e) {
      results.slack = { ok: false, error: String(e) };
    }
  } else {
    results.slack = { skipped: 'no SLACK_BOT_TOKEN+channel or SLACK_WEBHOOK_URL' };
  }

  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
});
