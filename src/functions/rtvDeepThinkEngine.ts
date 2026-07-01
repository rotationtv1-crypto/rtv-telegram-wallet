// ============================================================
// RTV DEEP THINK ENGINE v1 — FULL TRIPLE INTELLIGENCE STACK
// Pipeline: Perplexity Sonar Deep Research → Claude Extended Thinking → Synthesis
// Optional Emergent layer for build/code execution
//
// Actions:
//   deep_think   — Full pipeline: Perplexity → Claude → Synthesis
//   perplexity   — Sonar Deep Research only
//   claude_think — Claude Extended Thinking only
//   emergent     — Emergent build/code intelligence only
//   health       — Check all three connections
//
// RotationTV Network — "Learn it. Live it. Love it."
// ============================================================

import Anthropic from "npm:@anthropic-ai/sdk";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const ANTHROPIC_API_KEY  = Deno.env.get("ANTHROPIC_API_KEY");
const EMERGENT_API_KEY   = Deno.env.get("EMERGENT_API_KEY");

const SLACK_BOT_TOKEN     = Deno.env.get("SLACK_BOT_TOKEN");
const DISCORD_BOT_TOKEN   = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_CHANNEL_ID  = Deno.env.get("DISCORD_CHANNEL_ID") || "";

// ── PERPLEXITY — Sonar Deep Research ─────────────────────────
async function perplexityDeepResearch(query: string, systemPrompt?: string): Promise<{
  content: string;
  citations: string[];
  model: string;
  usage: any;
  error?: string;
}> {
  if (!PERPLEXITY_API_KEY) return { content: "", citations: [], model: "", usage: {}, error: "PERPLEXITY_API_KEY not set" };

  const body: any = {
    model: "sonar-deep-research",
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: query }
    ],
  };

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return { content: "", citations: [], model: "sonar-deep-research", usage: {}, error: `Perplexity error ${res.status}: ${err}` };
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content || "";
  const citations = data.citations || [];
  const usage = data.usage || {};

  return { content, citations, model: "sonar-deep-research", usage };
}

// ── CLAUDE — Extended Thinking (claude-sonnet-4-5) ────────────
// Uses adaptive thinking for deepest reasoning
async function claudeExtendedThink(prompt: string, systemPrompt: string, budget_tokens = 10000): Promise<{
  thinking: string;
  response: string;
  model: string;
  usage: any;
  error?: string;
}> {
  if (!ANTHROPIC_API_KEY) return { thinking: "", response: "", model: "", usage: {}, error: "ANTHROPIC_API_KEY not set" };

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  try {
    // claude-3-7-sonnet supports extended thinking with budget_tokens
    const message = await client.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: budget_tokens + 4096,
      thinking: {
        type: "enabled",
        budget_tokens,
      } as any,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    let thinkingContent = "";
    let textContent = "";
    for (const block of message.content) {
      if (block.type === "thinking") thinkingContent += (block as any).thinking || "";
      if (block.type === "text") textContent += block.text;
    }

    return {
      thinking: thinkingContent,
      response: textContent,
      model: message.model,
      usage: message.usage,
    };
  } catch (err) {
    // Fallback: claude without extended thinking if model doesn't support it
    try {
      const fallback = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });
      const text = fallback.content[0].type === "text" ? (fallback.content[0] as any).text : "";
      return { thinking: "[No extended thinking — fallback mode]", response: text, model: fallback.model, usage: fallback.usage };
    } catch (e2) {
      return { thinking: "", response: "", model: "", usage: {}, error: `Claude error: ${String(e2)}` };
    }
  }
}

// ── EMERGENT — Code/Build Intelligence ───────────────────────
async function queryEmergent(prompt: string, projectId?: string): Promise<any> {
  if (!EMERGENT_API_KEY) return { error: "EMERGENT_API_KEY not set" };
  const res = await fetch("https://api.emergent.sh/v1/chat", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EMERGENT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, project_id: projectId, stream: false }),
  });
  if (!res.ok) return { error: `Emergent ${res.status}: ${await res.text()}` };
  return res.json();
}

// ── NOTIFY — Slack + Discord ─────────────────────────────────
async function notify(message: string) {
  const trimmed = message.slice(0, 1900);
  const calls: Promise<any>[] = [];
  if (DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID) {
    calls.push(fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    }));
  }
  if (SLACK_BOT_TOKEN) {
    calls.push(fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "#rtv-ecosystem", text: trimmed }),
    }));
  }
  await Promise.allSettled(calls);
}

// ── RTV SYSTEM PROMPT ─────────────────────────────────────────
const RTV_SYSTEM_PROMPT = `You are the Master Intelligence Engine for the RotationTV Network ecosystem.
You are operating in Deep Think Mode — a triple-intelligence pipeline combining:
1. Perplexity Sonar Deep Research (hundreds of live sources, real-time web)
2. Claude Extended Thinking (internal reasoning chain, deep analysis)
3. Synthesis layer (unified strategic recommendations)

Full RTV context:
- Web3/Solana blockchain, RTV token, NFT assets
- RotationPay payment rails
- Chainstack Solana nodes (mainnet + devnet)
- rotationtvai.com AI Creator Platform
- HeyGen video agents, OpenClaw agents, EmergentLabs builds
- Motto: "Learn it. Live it. Love it." | Mission: "We keep business rotating globally."
- Owner: Darrel — CEO of RotationTV Network

Operational rules:
- Every answer must be ACTIONABLE — no generic advice
- Think 10 moves ahead like a Chess Grandmaster
- Flag risks, opportunities, and next steps
- Be decisive. Be precise. Be Darrel's strategic intelligence.`;

// ── MAIN HANDLER ─────────────────────────────────────────────
export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    action = "deep_think",
    query,
    prompt,
    context,
    project_id,
    budget_tokens = 8000,
    notify: shouldNotify = false,
    system_prompt,
  } = body;

  const userQuery = query || prompt || "Analyze and provide strategic intelligence for the RotationTV Network ecosystem";
  const sysPrompt = system_prompt || RTV_SYSTEM_PROMPT;

  try {
    // ── HEALTH CHECK ─────────────────────────────────────────
    if (action === "health") {
      const [pxTest, cTest, eTest] = await Promise.allSettled([
        perplexityDeepResearch("Respond with only: PERPLEXITY_CONNECTED"),
        claudeExtendedThink("Respond with only: CLAUDE_DEEP_THINK_CONNECTED", sysPrompt, 1000),
        queryEmergent("Respond with only: EMERGENT_CONNECTED"),
      ]);

      return Response.json({
        status: "ok",
        pipeline: "RTV Deep Think Engine v1",
        connections: {
          perplexity_sonar: pxTest.status === "fulfilled" && !pxTest.value.error ? "✅ CONNECTED" : `❌ ${pxTest.status === "rejected" ? pxTest.reason : (pxTest.value as any)?.error}`,
          claude_extended_thinking: cTest.status === "fulfilled" && !cTest.value.error ? "✅ CONNECTED" : `❌ ${cTest.status === "rejected" ? cTest.reason : (cTest.value as any)?.error}`,
          emergent_labs: eTest.status === "fulfilled" && !(eTest.value as any).error ? "✅ CONNECTED" : `❌ ${eTest.status === "rejected" ? eTest.reason : (eTest.value as any)?.error}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ── PERPLEXITY ONLY ──────────────────────────────────────
    if (action === "perplexity") {
      const result = await perplexityDeepResearch(userQuery, sysPrompt);
      return Response.json({ status: "ok", mode: "perplexity_sonar_deep_research", ...result, timestamp: new Date().toISOString() });
    }

    // ── CLAUDE EXTENDED THINKING ONLY ───────────────────────
    if (action === "claude_think") {
      const result = await claudeExtendedThink(userQuery, sysPrompt, budget_tokens);
      return Response.json({ status: "ok", mode: "claude_extended_thinking", ...result, timestamp: new Date().toISOString() });
    }

    // ── EMERGENT ONLY ────────────────────────────────────────
    if (action === "emergent") {
      const result = await queryEmergent(userQuery, project_id);
      return Response.json({ status: "ok", mode: "emergent_build_intelligence", result, timestamp: new Date().toISOString() });
    }

    // ── FULL DEEP THINK PIPELINE ─────────────────────────────
    // Step 1: Perplexity Sonar Deep Research — live web intelligence
    // Step 2: Claude Extended Thinking — deep reasoning on that intelligence
    // Step 3: Optional Emergent layer — code/build execution
    // Step 4: Final synthesis by Claude
    if (action === "deep_think" || action === "full") {
      const startTime = Date.now();

      // STAGE 1: Perplexity — live research
      const perplexityResult = await perplexityDeepResearch(userQuery, sysPrompt);
      const researchSummary = perplexityResult.error
        ? `[Perplexity unavailable: ${perplexityResult.error}]`
        : `LIVE RESEARCH FINDINGS:\n${perplexityResult.content}\n\nSources: ${perplexityResult.citations.slice(0, 8).join(", ")}`;

      // STAGE 2: Claude Extended Thinking — reason over the research
      const claudeInput = `${userQuery}\n\n${researchSummary}\n\nContext: ${context || "General RotationTV ecosystem intelligence"}`;
      const claudeResult = await claudeExtendedThink(claudeInput, sysPrompt, budget_tokens);

      // STAGE 3 (optional): Emergent if project_id or explicitly requested
      let emergentResult: any = null;
      if (project_id || action === "full") {
        emergentResult = await queryEmergent(
          `Based on this analysis, what should we build or implement?\n${claudeResult.response}`,
          project_id
        );
      }

      // STAGE 4: Final synthesis
      const synthesisInput = `
ORIGINAL QUERY: ${userQuery}

PERPLEXITY DEEP RESEARCH (live web intelligence, ${perplexityResult.citations?.length || 0} sources):
${perplexityResult.error ? `[Error: ${perplexityResult.error}]` : perplexityResult.content?.slice(0, 4000)}

CLAUDE EXTENDED THINKING (internal deep reasoning):
${claudeResult.error ? `[Error: ${claudeResult.error}]` : claudeResult.response?.slice(0, 3000)}

EMERGENT BUILD INTELLIGENCE:
${emergentResult ? JSON.stringify(emergentResult).slice(0, 1000) : "[Not invoked]"}

Synthesize all of the above into a FINAL STRATEGIC BRIEF for Darrel (CEO, RotationTV Network):
- Key Findings (3-5 bullet points)
- Immediate Actions (what to do in next 24h)  
- Strategic Opportunities (what to build/expand)
- Risks to Watch
- Confidence: HIGH / MEDIUM / LOW
Format clearly. Be decisive. This is the final answer.`;

      const synthesis = await claudeExtendedThink(synthesisInput, sysPrompt, 6000);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      const output = {
        status: "ok",
        mode: "full_deep_think_pipeline",
        pipeline_stages: {
          stage_1_perplexity: {
            model: "sonar-deep-research",
            sources: perplexityResult.citations?.length || 0,
            error: perplexityResult.error,
            content_preview: perplexityResult.content?.slice(0, 500) + "...",
          },
          stage_2_claude_extended_thinking: {
            model: claudeResult.model,
            thinking_length: claudeResult.thinking?.length || 0,
            response_preview: claudeResult.response?.slice(0, 500) + "...",
            error: claudeResult.error,
          },
          stage_3_emergent: emergentResult ? {
            invoked: true,
            project_id,
            result_preview: JSON.stringify(emergentResult).slice(0, 300),
          } : { invoked: false },
          stage_4_synthesis: {
            model: synthesis.model,
            final_brief: synthesis.response,
            error: synthesis.error,
          },
        },
        full_research: perplexityResult.content,
        full_thinking: claudeResult.thinking,
        full_response: claudeResult.response,
        citations: perplexityResult.citations,
        elapsed_seconds: elapsed,
        timestamp: new Date().toISOString(),
      };

      // Notify Slack/Discord if requested
      if (shouldNotify) {
        const brief = synthesis.response?.slice(0, 1500) || "Deep Think complete.";
        await notify(`🧠 **RTV DEEP THINK ENGINE — RESULTS**\n📡 Query: ${userQuery.slice(0, 100)}\n⏱ Time: ${elapsed}s | Sources: ${perplexityResult.citations?.length || 0}\n\n${brief}`);
      }

      return Response.json(output);
    }

    return Response.json({ error: "Unknown action. Use: deep_think | full | perplexity | claude_think | emergent | health" }, { status: 400 });

  } catch (err) {
    return Response.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
