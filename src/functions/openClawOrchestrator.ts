// ============================================================
// OPENCLAW ORCHESTRATOR — Full Scale Agent Deployment
// Replaces dead Railway deployments with Base44 backend functions
// 9 agents, 1 orchestrator, full ecosystem coverage
// RotationTV Network | Presidential Authority: Darrel
// ============================================================

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");

// 9-Company Agent Registry
const AGENTS = {
  "AXIS-Command": {
    module: "command_center",
    company: "RotationTV Network",
    role: "Central command — orchestrates all 9 companies, routes tasks, monitors ecosystem health",
    channels: ["telegram", "discord", "webhook"],
    system_prompt: "You are AXIS-Command, the central AI command agent for RotationTV Network. You orchestrate 9 companies, route tasks to specialized agents, and monitor ecosystem health. Owner: Darrel (CEO). Be decisive, strategic, and precise. Brand: 'Learn it. Live it. Love it.'",
    capabilities: ["task_routing", "health_monitoring", "ecosystanalysis", "broadcast", "priority_queue"]
  },
  "AXIS-Payments": {
    module: "rotation_pay",
    company: "RotationPay",
    role: "Payment processing — Stripe, TON, Solana, Venmo, Zelle, Coinbase, NMI, PayPal",
    channels: ["telegram", "webhook"],
    system_prompt: "You are AXIS-Payments, the payment processing agent for RotationPay. You handle multi-rail transactions across Stripe, TON, Solana, Venmo, Zelle, Coinbase, NMI, and PayPal. Enforce $999 limit for unverified accounts. Log all transactions to OmegaAuditLog. Economic parity: 1 RTV = $0.01 USD.",
    capabilities: ["payment_processing", "transaction_logging", "compliance_check", "merchant_onboarding", "risk_scoring"]
  },
  "AXIS-Voice": {
    module: "rotation_call",
    company: "RotationCall",
    role: "Enterprise voice — IVR, call routing, AI voice agents, Twilio integration",
    channels: ["telegram", "voice", "sms"],
    system_prompt: "You are AXIS-Voice, the enterprise voice agent for RotationCall. You handle IVR, call routing, AI voice interactions, and Twilio integration. Provide crystal-clear voice guidance and route calls intelligently.",
    capabilities: ["call_routing", "ivr_management", "voice_synthesis", "sms_handling", "voip_provisioning"]
  },
  "AXIS-University": {
    module: "rtv_university",
    company: "Rotation University",
    role: "Education — AI trading, Web3, blockchain curriculum, NFT diplomas, HeyGen video",
    channels: ["telegram", "webhook"],
    system_prompt: "You are AXIS-University, the education agent for Rotation University. You manage curriculum, student enrollment, NFT diploma minting, and HeyGen video generation. Tiers: Bronze $4.99 → Platinum $49.99/month. Issue AcademyCredits for course completion.",
    capabilities: ["curriculum_management", "student_enrollment", "nft_diploma_minting", "heygen_video_gen", "credit_issuance"]
  },
  "AXIS-Creator": {
    module: "creator_studio",
    company: "Bigo Agency",
    role: "Creator economy — live streaming, gifts, combos, PK battles, payouts, agency management",
    channels: ["telegram", "discord"],
    system_prompt: "You are AXIS-Creator, the creator economy agent for Bigo Agency and RotationTV Live. You manage live streams, gift processing, combo multipliers, PK battles, creator payouts, and agency rosters. Revenue split: 80/15/5 (creator/platform/agency). 1 RTV = $0.01 USD.",
    capabilities: ["stream_management", "gift_processing", "combo_calculation", "pk_battle_orchestration", "payout_processing", "agency_management"]
  },
  "AXIS-Logistics": {
    module: "white_logistics",
    company: "White Logistics Solutions",
    role: "Logistics — shipping, tracking, supply chain optimization",
    channels: ["telegram", "webhook"],
    system_prompt: "You are AXIS-Logistics, the logistics agent for White Logistics Solutions. You handle shipping coordination, package tracking, route optimization, and supply chain management.",
    capabilities: ["shipment_tracking", "route_optimization", "supply_chain_mgmt", "delivery_estimation"]
  },
  "AXIS-Justice": {
    module: "pretrial_services",
    company: "Pretrial Services of America",
    role: "Justice tech — pretrial monitoring, compliance tracking, court reporting",
    channels: ["telegram", "voice", "webhook"],
    system_prompt: "You are AXIS-Justice, the justice tech agent for Pretrial Services of America. You handle pretrial monitoring, compliance tracking, court date reminders, and reporting. Maintain strict confidentiality and legal compliance.",
    capabilities: ["monitoring_scheduling", "compliance_tracking", "court_reporting", "check_in_management", "alert_escalation"]
  },
  "AXIS-Labs": {
    module: "emergent_labs",
    company: "EmergentLabs",
    role: "Build infrastructure — app deployment, code generation, CI/CD, testing",
    channels: ["telegram", "webhook"],
    system_prompt: "You are AXIS-Labs, the build infrastructure agent for EmergentLabs. You manage app deployments, code generation, CI/CD pipelines, and automated testing. Cloudflare-first architecture. No Vercel. No MongoDB.",
    capabilities: ["app_deployment", "code_generation", "cicd_management", "test_automation", "infrastructure_provisioning"]
  },
  "AXIS-Web3": {
    module: "web3_gateway",
    company: "RotationTV Network",
    role: "Blockchain — TON/Solana operations, token minting, NFT management, wallet sync",
    channels: ["telegram", "webhook"],
    system_prompt: "You are AXIS-Web3, the blockchain agent for RotationTV Network. You handle TON and Solana operations, $RTVS jetton management, NFT minting, wallet synchronization, and on-chain verification. Primary chain: TON. Secondary: Solana. $RTVS contract: EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC.",
    capabilities: ["token_minting", "nft_management", "wallet_sync", "balance_checking", "on_chain_verification", "staking_management"]
  }
};

async function callLLM(messages, options = {}) {
  const model = options.model || "claude-3-5-sonnet-20241022";
  const apiKey = ANTHROPIC_KEY || OPENAI_KEY;
  const provider = ANTHROPIC_KEY ? "anthropic" : "openai";

  if (!apiKey) {
    return { error: "No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in secrets." };
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: options.max_tokens || 4096,
        system: messages[0]?.role === "system" ? messages[0].content : undefined,
        messages: messages[0]?.role === "system" ? messages.slice(1) : messages,
      }),
    });
    if (!response.ok) return { error: `Anthropic API error: ${await response.text()}` };
    const data = await response.json();
    return { text: data.content[0]?.text || "", usage: data.usage };
  } else {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature || 0.7,
      }),
    });
    if (!response.ok) return { error: `OpenAI API error: ${await response.text()}` };
    const data = await response.json();
    return { text: data.choices[0]?.message?.content || "", usage: data.usage };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body;
  try { body = await req.json(); } catch { body = {}; }

  const action = body.action || "status";

  // ── STATUS: Full agent registry ──────────────────────
  if (action === "status") {
    return Response.json({
      ecosystem: "RotationTV Network",
      orchestrator: "openClawOrchestrator",
      total_agents: Object.keys(AGENTS).length,
      agents: Object.entries(AGENTS).map(([name, cfg]) => ({
        name,
        company: cfg.company,
        module: cfg.module,
        role: cfg.role,
        channels: cfg.channels,
        capabilities: cfg.capabilities,
        status: "ready",
        llm_provider: ANTHROPIC_KEY ? "anthropic" : (OPENAI_KEY ? "openai" : "none"),
      })),
      llm_status: ANTHROPIC_KEY ? "anthropic (needs rotation)" : (OPENAI_KEY ? "openai (needs rotation)" : "NO LLM KEY SET"),
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  // ── EXECUTE: Send a task to a specific agent ─────────
  if (action === "execute") {
    const agentName = body.agent_name;
    const task = body.task;
    const context = body.context || {};

    if (!agentName || !task) {
      return Response.json({ error: "agent_name and task required" }, { status: 400, headers: corsHeaders });
    }

    const agent = AGENTS[agentName];
    if (!agent) {
      return Response.json({
        error: `Unknown agent: ${agentName}`,
        available_agents: Object.keys(AGENTS),
      }, { status: 404, headers: corsHeaders });
    }

    const messages = [
      { role: "system", content: agent.system_prompt },
      { role: "user", content: `TASK: ${task}\n\nCONTEXT: ${JSON.stringify(context)}\n\nProvide a detailed, actionable response for the ${agent.company} division.` }
    ];

    const result = await callLLM(messages, { max_tokens: body.max_tokens || 4096 });

    return Response.json({
      agent: agentName,
      company: agent.company,
      module: agent.module,
      task,
      response: result.text || result.error,
      usage: result.usage,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  // ── BROADCAST: Send task to ALL agents ───────────────
  if (action === "broadcast") {
    const task = body.task;
    if (!task) return Response.json({ error: "task required" }, { status: 400, headers: corsHeaders });

    const results = {};
    for (const [name, agent] of Object.entries(AGENTS)) {
      const messages = [
        { role: "system", content: agent.system_prompt },
        { role: "user", content: `BROADCAST TASK FROM DARREL (CEO): ${task}\n\nRespond with your division's action plan.` }
      ];
      const result = await callLLM(messages, { max_tokens: 1024 });
      results[name] = {
        company: agent.company,
        response: (result.text || result.error || "").slice(0, 500),
      };
    }

    return Response.json({
      mode: "broadcast",
      task,
      agents_responded: Object.keys(results).length,
      results,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  // ── RESEARCH: Deep research mode for any agent ───────
  if (action === "research") {
    const topic = body.topic;
    const agentName = body.agent_name || "AXIS-Command";
    if (!topic) return Response.json({ error: "topic required" }, { status: 400, headers: corsHeaders });

    const agent = AGENTS[agentName] || AGENTS["AXIS-Command"];

    const messages = [
      { role: "system", content: agent.system_prompt + " You are now in DEEP RESEARCH mode. Provide comprehensive, actionable analysis with specific steps, resources, and implementation guidance." },
      { role: "user", content: `DEEP RESEARCH REQUEST:\n\nTopic: ${topic}\n\nProvide:\n1. Current landscape analysis\n2. RTV ecosystem integration points\n3. Step-by-step implementation plan\n4. Required resources and tools\n5. Risk assessment\n6. Success metrics\n\nBe thorough and specific to the RotationTV Network ecosystem.` }
    ];

    const result = await callLLM(messages, { max_tokens: 8192, temperature: 0.4 });

    return Response.json({
      mode: "deep_research",
      agent: agentName,
      company: agent.company,
      topic,
      research: result.text || result.error,
      usage: result.usage,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  // ── PLAYBOOK: Generate a launch playbook ─────────────
  if (action === "playbook") {
    const module = body.module || "all";
    const agentNames = module === "all" ? Object.keys(AGENTS) : [module];

    const playbooks = {};
    for (const name of agentNames) {
      const agent = AGENTS[name];
      if (!agent) continue;

      const messages = [
        { role: "system", content: agent.system_prompt },
        { role: "user", content: `Generate a comprehensive LAUNCH PLAYBOOK for ${agent.company}.\n\nInclude:\n- Mission objectives\n- Required infrastructure\n- Step-by-step launch sequence\n- Integration points with other RTV companies\n- KPIs and success metrics\n- Risk mitigation\n- Daily operations checklist\n\nThis playbook will guide the ${agent.company} team through full-scale launch.` }
      ];

      const result = await callLLM(messages, { max_tokens: 4096, temperature: 0.3 });
      playbooks[name] = {
        company: agent.company,
        module: agent.module,
        playbook: result.text || result.error,
      };
    }

    return Response.json({
      mode: "playbook_generation",
      modules_requested: module,
      playbooks_generated: Object.keys(playbooks).length,
      playbooks,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  // ── GUIDE: Generate user guide for the ecosystem ─────
  if (action === "guide") {
    const messages = [
      { role: "system", content: "You are the RotationTV Network AI Guide generator. Create comprehensive, easy-to-follow guides for using the ecosystem. Brand: 'Learn it. Live it. Love it.'" },
      { role: "user", content: `Generate a complete USER GUIDE for the RotationTV Network ecosystem launch.\n\nCover:\n1. Getting started — wallet setup, Telegram bot, Mini App access\n2. Creator onboarding — going live, receiving gifts, payouts\n3. Viewer experience — watching streams, sending gifts, subscriptions\n4. Payment system — RotationPay, all 10 rails, $RTV token\n5. Education — Rotation University enrollment, NFT diplomas\n6. Web3 — $RTVS token, staking, NFT minting, wallet management\n7. Enterprise — RotationCall setup, VoIP provisioning\n8. Admin — Darrel's command center, agent management, ecosystem monitoring\n\nMake it practical and actionable. Use the RTV brand voice.` }
    ];

    const result = await callLLM(messages, { max_tokens: 8192, temperature: 0.5 });

    return Response.json({
      mode: "guide_generation",
      guide: result.text || result.error,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  }

  return Response.json({
    error: "Unknown action",
    available_actions: ["status", "execute", "broadcast", "research", "playbook", "guide"],
    usage: {
      status: "GET — view all 9 agents and their status",
      execute: "POST {action:'execute', agent_name:'AXIS-Command', task:'...', context:{}}",
      broadcast: "POST {action:'broadcast', task:'...'}",
      research: "POST {action:'research', topic:'...', agent_name:'AXIS-Command'}",
      playbook: "POST {action:'playbook', module:'all' or specific agent name}",
      guide: "POST {action:'guide'}",
    },
  }, { headers: corsHeaders });
});
