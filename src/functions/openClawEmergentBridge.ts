// ============================================================
// OPENCLAW <-> EMERGENT BRIDGE
// Each OpenClaw agent talks to Emergent about its projects
// Routes updates back via Telegram/Discord
// RTV Ecosystem — Chess Grandmaster Mode
// ============================================================

const EMERGENT_API_KEY = Deno.env.get("EMERGENT_API_KEY");
const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN");
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID") || "";

// Agent → Project mapping
const AGENT_PROJECT_MAP: Record<string, { projects: string[]; module: string; description: string }> = {
  "AXIS-Command": {
    projects: ["RTV-Command-Center", "RTV-AI-University", "RTV-Creator-Studio"],
    module: "command_center",
    description: "Core platform, AI University, Creator Studio",
  },
  "AXIS-Logistics": {
    projects: ["RTV-RotationPay", "RTV-Web3-Gateway"],
    module: "white_logistics",
    description: "Logistics, RotationPay, Web3 Gateway",
  },
  "AXIS-Pretrial": {
    projects: ["RTV-Command-Center"],
    module: "pretrial_services",
    description: "Pretrial Services of America",
  },
};

async function queryEmergent(prompt: string, projectContext?: string) {
  const fullPrompt = projectContext
    ? `[PROJECT: ${projectContext}]\n${prompt}`
    : prompt;

  const response = await fetch("https://api.emergent.sh/v1/chat", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EMERGENT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: fullPrompt, stream: false }),
  });

  if (!response.ok) {
    const err = await response.text();
    return { error: err, status: response.status };
  }
  return response.json();
}

async function sendToDiscord(message: string) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) return { skipped: true };
  const res = await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message }),
  });
  return res.ok ? { sent: true } : { error: await res.text() };
}

async function sendToSlack(message: string, channel = "#rtv-alerts") {
  if (!SLACK_BOT_TOKEN) return { skipped: true };
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text: message }),
  });
  return res.ok ? { sent: true } : { error: await res.text() };
}

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, agent_name, project_name, task, message } = body;

  try {
    // ── ACTION: agent_work ──────────────────────────────────────
    // OpenClaw agent sends a work task to Emergent for a specific project
    if (action === "agent_work") {
      if (!agent_name || !project_name || !task) {
        return Response.json({ error: "agent_name, project_name, task required" }, { status: 400 });
      }

      const agentCtx = AGENT_PROJECT_MAP[agent_name];
      if (!agentCtx) return Response.json({ error: `Unknown agent: ${agent_name}` }, { status: 404 });

      const prompt = `You are ${agent_name}, an AI agent working on the RotationTV Network ecosystem.
Your assigned projects: ${agentCtx.projects.join(", ")}
Your module: ${agentCtx.description}

TASK: ${task}

Provide a detailed, actionable response. Be precise. Owner: Darrel (CEO of RotationTV Network).`;

      const result = await queryEmergent(prompt, project_name);
      const responseText = result.response || result.message || JSON.stringify(result);

      // Notify via Discord + Slack
      const notification = `🤖 [${agent_name}] Project: ${project_name}\n📋 Task: ${task}\n✅ Result:\n${responseText.slice(0, 1500)}`;
      await Promise.allSettled([
        sendToDiscord(notification),
        sendToSlack(notification, "#rtv-ecosystem"),
      ]);

      return Response.json({
        status: "ok",
        agent: agent_name,
        project: project_name,
        task,
        emergent_response: responseText,
        notified: ["discord", "slack"],
        timestamp: new Date().toISOString(),
      });
    }

    // ── ACTION: project_status ──────────────────────────────────
    // Get status of all projects for an agent
    if (action === "project_status") {
      const agentCtx = agent_name ? AGENT_PROJECT_MAP[agent_name] : null;
      const projects = agentCtx ? agentCtx.projects : Object.values(AGENT_PROJECT_MAP).flatMap(a => a.projects);
      const agentLabel = agent_name || "ALL AGENTS";

      const prompt = `You are the RotationTV Network AI Command Engine.
Check the status of these projects: ${projects.join(", ")}
For each project: assess build health, active issues, next priorities.
Owner: Darrel (CEO). Be concise and strategic.`;

      const result = await queryEmergent(prompt);
      const responseText = result.response || result.message || JSON.stringify(result);

      const notification = `📊 [${agentLabel}] Project Status Report\n${responseText.slice(0, 1500)}`;
      await Promise.allSettled([
        sendToDiscord(notification),
        sendToSlack(notification, "#rtv-ecosystem"),
      ]);

      return Response.json({
        status: "ok",
        agent: agentLabel,
        projects,
        emergent_response: responseText,
        timestamp: new Date().toISOString(),
      });
    }

    // ── ACTION: broadcast ───────────────────────────────────────
    // Send a message from Darrel to all OpenClaw agents via Emergent
    if (action === "broadcast") {
      if (!message) return Response.json({ error: "message required" }, { status: 400 });

      const agents = Object.keys(AGENT_PROJECT_MAP);
      const results: Record<string, unknown> = {};

      for (const agent of agents) {
        const ctx = AGENT_PROJECT_MAP[agent];
        const prompt = `You are ${agent} (${ctx.description}).
Message from Darrel (CEO, RotationTV Network): ${message}
Respond with your action plan for your assigned projects: ${ctx.projects.join(", ")}`;

        const result = await queryEmergent(prompt);
        results[agent] = result.response || result.message || result;
      }

      const notification = `📢 BROADCAST from Darrel → All OpenClaw Agents\nMessage: ${message}\n\n${
        Object.entries(results).map(([a, r]) => `🤖 ${a}:\n${String(r).slice(0, 400)}`).join("\n\n")
      }`;

      await Promise.allSettled([
        sendToDiscord(notification),
        sendToSlack(notification, "#rtv-ecosystem"),
      ]);

      return Response.json({
        status: "ok",
        mode: "broadcast",
        message,
        agent_responses: results,
        timestamp: new Date().toISOString(),
      });
    }

    // ── ACTION: agent_map ───────────────────────────────────────
    if (action === "agent_map") {
      return Response.json({ status: "ok", agent_project_map: AGENT_PROJECT_MAP });
    }

    return Response.json({
      error: "Unknown action",
      available: ["agent_work", "project_status", "broadcast", "agent_map"],
    }, { status: 400 });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
