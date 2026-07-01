// RTV UNIFIED INTELLIGENCE ENGINE v2 — Emergent + Claude Grandmaster Mode
import Anthropic from "npm:@anthropic-ai/sdk";

const EMERGENT_API_KEY = Deno.env.get("EMERGENT_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const EMERGENT_API_URL = "https://api.emergent.sh/v1";

async function queryEmergent(prompt: string, projectId?: string) {
  const response = await fetch(`${EMERGENT_API_URL}/chat`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EMERGENT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, project_id: projectId, stream: false }),
  });
  if (!response.ok) {
    const err = await response.text();
    return { error: err, status: response.status };
  }
  return response.json();
}

async function queryClaude(systemPrompt: string, userMessage: string) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

const GRANDMASTER_SYSTEM = `You are the Master Intelligence Engine for the RotationTV Network ecosystem.
You operate in Chess Grandmaster Mode — every response is calculated 10 moves ahead.
Full RTV context: Web3/Solana blockchain, RTV token, NFT assets, RotationPay, Chainstack nodes, Creator Studio, AI University, Command Center.
Motto: "Learn it. Live it. Love it." Mission: We keep business rotating globally.
Owner: Darrel — CEO of RotationTV Network.
Be strategic, precise, decisive. Always actionable.`;

export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, prompt, context, project_id } = body;

  try {
    if (action === "claude") {
      const response = await queryClaude(GRANDMASTER_SYSTEM, prompt || "Status check");
      return Response.json({ source: "claude", response, status: "ok" });
    }

    if (action === "emergent") {
      const response = await queryEmergent(prompt || "Status check", project_id);
      return Response.json({ source: "emergent", response, status: "ok" });
    }

    if (action === "unified") {
      const [emergentRes, claudeRes] = await Promise.allSettled([
        queryEmergent(prompt || "Analyze RotationTV ecosystem status", project_id),
        queryClaude(GRANDMASTER_SYSTEM, prompt || "Analyze RotationTV ecosystem status"),
      ]);
      const emergentData = emergentRes.status === "fulfilled" ? emergentRes.value : { error: String(emergentRes.reason) };
      const claudeData = claudeRes.status === "fulfilled" ? claudeRes.value : { error: String(claudeRes.reason) };
      const synthesis = await queryClaude(
        GRANDMASTER_SYSTEM,
        `Synthesize into one unified strategic recommendation for Darrel:\nEMERGENT: ${JSON.stringify(emergentData)}\nCLAUDE: ${claudeData}\nContext: ${context || "General ecosystem intelligence"}\nBe decisive.`
      );
      return Response.json({ status: "ok", mode: "grandmaster_unified", emergent: emergentData, claude: claudeData, synthesis, timestamp: new Date().toISOString() });
    }

    if (action === "health") {
      const claudeTest = await queryClaude("You are RTV health checker.", "Respond only: CLAUDE_CONNECTED — RotationTV Network AI Online");
      const emergentTest = await queryEmergent("Respond only: EMERGENT_CONNECTED");
      return Response.json({ status: "ok", claude: claudeTest, emergent: emergentTest, unified_status: "GRANDMASTER_MODE_ACTIVE", timestamp: new Date().toISOString() });
    }

    return Response.json({ error: "Unknown action. Use: claude | emergent | unified | health" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
