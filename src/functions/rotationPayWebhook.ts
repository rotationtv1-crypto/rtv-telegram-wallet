// ============================================================
// ROTATIONPAY PUBLIC WEBHOOK ENDPOINT
// Accepts ecosystem updates from Manus, external systems
// Logs to ManusWebhook + ManusAITask entities
// Routes alerts to Darrel via Slack + Discord
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN");
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID") || "";

async function notify(message: string) {
  const calls = [];
  if (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID) {
    calls.push(fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.slice(0, 2000) }),
    }));
  }
  if (SLACK_BOT_TOKEN) {
    calls.push(fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "#rtv-ecosystem", text: message.slice(0, 3000) }),
    }));
  }
  await Promise.allSettled(calls);
}

Deno.serve(async (req) => {
  // CORS headers for browser/external access
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Source, X-RTV-Key",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET — health check / endpoint info
  if (req.method === "GET") {
    return Response.json({
      status: "online",
      endpoint: "RotationTV Network — Public Webhook",
      owner: "Darrel",
      accepts: ["manus", "base44", "emergent", "external"],
      payload_format: {
        source: "manus | base44 | emergent | manual",
        event_type: "update | alert | task | payment | deployment",
        title: "string",
        message: "string",
        data: "object (optional)",
        priority: "low | normal | high | critical",
      },
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const {
      source = "external",
      event_type = "update",
      title = "Incoming Update",
      message = "",
      data = {},
      priority = "normal",
      rtv_module = "general",
    } = body;

    const timestamp = new Date().toISOString();

    // ── Log to ManusAITask entity
    const taskRecord = await base44.asServiceRole.entities.ManusAITask.create({
      task_id: `webhook-${Date.now()}`,
      task_type: event_type,
      task_description: `[${source.toUpperCase()}] ${title}: ${message.slice(0, 500)}`,
      status: "completed",
      triggered_by: source,
      rtv_module,
      priority,
      output_summary: message.slice(0, 1000),
      completed_at: timestamp,
      created_at: timestamp,
    });

    // ── Log to ManusWebhook entity
    await base44.asServiceRole.entities.ManusWebhook.create({
      webhook_name: `${source}-${event_type}-${Date.now()}`,
      source,
      target: "base44-rtv",
      event_type,
      endpoint_url: "rotationPayWebhook",
      rtv_module,
      last_triggered: timestamp,
      last_status: "success",
      retry_count: 0,
      enabled: true,
      created_at: timestamp,
    });

    // ── Notify Darrel
    const priorityEmoji = priority === "critical" ? "🚨" : priority === "high" ? "🔴" : priority === "normal" ? "📩" : "💬";
    const notifyMsg =
`${priorityEmoji} INCOMING — ${source.toUpperCase()} → Base44
━━━━━━━━━━━━━━━━━━━━
📌 ${title}
📋 ${message.slice(0, 800)}
${Object.keys(data).length > 0 ? `\n📊 Data: ${JSON.stringify(data).slice(0, 300)}` : ""}
━━━━━━━━━━━━━━━━━━━━
🔖 Module: ${rtv_module} | Priority: ${priority}
📅 ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET`;

    await notify(notifyMsg);

    return Response.json({
      status: "received",
      task_id: taskRecord.id,
      source,
      event_type,
      priority,
      timestamp,
      routed_to: ["slack", "discord", "base44_entities"],
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({
      status: "error",
      error: (error as Error).message,
    }, { status: 500, headers: corsHeaders });
  }
});
