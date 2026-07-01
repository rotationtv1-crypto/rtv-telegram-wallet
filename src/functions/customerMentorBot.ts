// Customer Mentor Bot — RotationTV Network
// Most advanced AI mentor for customers powered by Claude
// Full RTV ecosystem knowledge · Lead scoring · Conversion tracking
// Presidential Authority: Darrel | "Learn it. Live it. Love it."

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const BASE44_API    = "https://69db6144f66afe8317b2d0d7.base44.app/functions";

// ── Full RTV Ecosystem Context ────────────────────────────
const RTV_SYSTEM_PROMPT = `You are the RotationTV Network AI Mentor — the most advanced business and Web3 advisor available to customers of the RotationTV ecosystem.

You represent all 9 companies of the RotationTV Network:
1. RotationTV Network (rotationtvai.com) — AI media platform, creator studio, parent company
2. RotationPay — Unified payment gateway: Solana, TON, PayPal, Stripe, Venmo, Zelle, USDC, 10 rails
3. RotationCall — Enterprise AI voice platform (rotationcall.net), IVR, AI agents
4. RTV AI University / Rotation University — Harvard-grade AI, Web3, blockchain education ($49–$499/mo)
5. Bigo Agency — Full-service creative agency, branding, HeyGen AI video
6. White Logistics Solutions — AI-powered logistics and supply chain
7. Pretrial Services of America — Justice tech platform
8. EmergentLabs — AI app builder platform
9. OpenClaw — AI agent orchestration, voice, Telegram, Discord

$RTVS Token:
- TON Mainnet Jetton: EQB2wn8LVs_8vRNISf7Lgq5z3OvLFSz6UFft5uN8ppQCygxC
- Solana SPL Mint: GStxrfBdQvPb2hEdSR8ehrw6Es2rcaGSVAGwRNEHCHTL
- Staking tiers: Starter (2,500 $RTV · $99 · 1× APY), Builder (10,000 $RTV · $349 · 2×), Sovereign (50,000 $RTV · $1,499 · 5×)
- APY: 4.5% | Claim window: 72 hours
- Payment: PayPal (https://www.paypal.com/ncp/payment/F45K2VWDBVQHY), Telegram Wallet, Solana, Stripe

Motto: "Learn it. Live it. Love it." — We keep business rotating globally.

YOUR ROLE AS MENTOR:
- You are warm, knowledgeable, and genuinely helpful to customers
- You help them understand which RTV products/services fit their needs
- You guide them toward enrollment, purchase, or partnership
- You answer questions about Web3, AI, payments, business growth
- You speak in confident, clear, non-technical language unless asked
- You NEVER make up prices or features that don't exist
- You always end with a clear next step or call to action
- You track what the customer is interested in and guide them toward conversion

MENTOR PERSONAS (rotate based on context):
- Business/payments questions → channel Jeff Bezos (customer obsession, flywheels)
- Tech/Web3/token questions → channel Elon Musk (first principles, 10x thinking)  
- Wealth/investment questions → channel Warren Buffett (moats, generational wealth)
- Innovation/energy questions → channel Nikola Tesla (resonance, frequency, infinite potential)
- Complex multi-topic → All four unified as Presidential Council

CONVERSION GOALS (in order of priority):
1. RTV AI University enrollment ($49–$499/mo)
2. $RTVS token purchase (Starter $99, Builder $349, Sovereign $1,499)
3. RotationPay merchant account (free setup)
4. RotationCall enterprise demo (lead capture)
5. Bigo Agency creative services (custom quote)

Always be helpful first. Sell second. The best mentor earns trust before asking for anything.`;

// ── Lead score calculator ─────────────────────────────────
function calcLeadScore(messages: any[]): number {
  let score = 0;
  const text = messages.map(m => m.content).join(" ").toLowerCase();
  const signals = [
    { terms: ["buy", "purchase", "enroll", "sign up", "get started", "how much"], pts: 20 },
    { terms: ["token", "$rtv", "$rtvs", "staking", "wallet", "web3", "solana", "ton"], pts: 15 },
    { terms: ["university", "course", "learn", "education", "training"], pts: 15 },
    { terms: ["payment", "merchant", "rotationpay", "gateway", "checkout"], pts: 12 },
    { terms: ["call", "voice", "rotationcall", "enterprise", "business"], pts: 12 },
    { terms: ["agency", "brand", "marketing", "video", "content"], pts: 10 },
    { terms: ["price", "cost", "plan", "tier", "package"], pts: 10 },
    { terms: ["how", "what", "tell me", "explain"], pts: 5 },
  ];
  for (const { terms, pts } of signals) {
    if (terms.some(t => text.includes(t))) score += pts;
  }
  return Math.min(score, 100);
}

// ── Detect company interest ───────────────────────────────
function detectInterest(messages: any[]): string {
  const text = messages.map(m => m.content).join(" ").toLowerCase();
  if (text.includes("university") || text.includes("course") || text.includes("learn")) return "RTV AI University";
  if (text.includes("token") || text.includes("rtv") || text.includes("staking") || text.includes("web3")) return "RTVS Token";
  if (text.includes("payment") || text.includes("merchant") || text.includes("gateway")) return "RotationPay";
  if (text.includes("call") || text.includes("voice") || text.includes("ivr")) return "RotationCall";
  if (text.includes("agency") || text.includes("brand") || text.includes("video")) return "Bigo Agency";
  if (text.includes("logistics") || text.includes("shipping")) return "White Logistics";
  return "General";
}

// ── Smart quick replies based on context ─────────────────
function getSmartReplies(messages: any[], mentor: string): string[] {
  const text = messages.slice(-3).map(m => m.content).join(" ").toLowerCase();
  
  if (text.includes("university") || text.includes("course")) {
    return ["What courses are available?", "How much does enrollment cost?", "Can I earn $RTV for completing courses?", "Is there a free trial?"];
  }
  if (text.includes("token") || text.includes("rtv") || text.includes("staking")) {
    return ["How do I buy $RTVS?", "What are the staking rewards?", "Which wallet do I need?", "Show me the Sovereign tier"];
  }
  if (text.includes("payment") || text.includes("merchant")) {
    return ["How do I set up RotationPay?", "What payment rails are supported?", "Is there a monthly fee?", "How do I earn $RTV cashback?"];
  }
  if (text.includes("business") || text.includes("company") || text.includes("start")) {
    return ["Which RTV service fits my business?", "Tell me about RotationCall", "How does the ecosystem work?", "What's the $RTV flywheel?"];
  }
  
  // Default smart starters
  const defaults = {
    elon:    ["How do I think 10x bigger?", "What's the first principles approach to Web3?", "Tell me about $RTVS tokenomics", "How does RotationPay disrupt payments?"],
    bezos:   ["What's the customer flywheel?", "How do I build a 2-sided marketplace?", "Tell me about RotationPay for merchants", "What's the Day 1 mindset for my business?"],
    buffett: ["How do I build a moat around my business?", "Is $RTVS a good long-term hold?", "Tell me about the RTV University ROI", "How does the ecosystem generate compounding value?"],
    tesla:   ["How does the $RTV resonance engine work?", "What's the 9-company energy flywheel?", "Tell me about the Tesla staking tier", "How does TON Jetton connect to Solana?"],
    council: ["I want to start with $RTVS tokens", "Tell me about RTV AI University", "How can RotationPay help my business?", "What's the fastest way to get started?"],
  };
  return defaults[mentor as keyof typeof defaults] || defaults.council;
}

// ── MAIN HANDLER ─────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type":                 "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body   = await req.json().catch(() => ({}));
    const action = body.action || "chat";

    // ── action: chat ──────────────────────────────────────
    if (action === "chat") {
      const { message, history = [], mentor = "council", user_name, session_id } = body;

      if (!message) return new Response(JSON.stringify({ error: "message required" }), { headers: cors, status: 400 });

      // Build mentor persona context
      const mentorPersona = {
        elon:    "You are channeling Elon Musk's mindset — first principles, 10x thinking, disruption. Be direct, bold, and visionary.",
        bezos:   "You are channeling Jeff Bezos' mindset — customer obsession, long-term thinking, flywheels, Day 1 mentality. Be strategic and customer-focused.",
        buffett: "You are channeling Warren Buffett's mindset — moats, patience, value, compounding, generational wealth. Be wise and measured.",
        tesla:   "You are channeling Nikola Tesla's mindset — resonance, infinite energy, frequency, and the interconnectedness of all systems. Be visionary and poetic.",
        council: "You are the unified Presidential Council — Elon, Bezos, Buffett, and Tesla speaking as one. Synthesize all four perspectives into a single powerful response.",
      }[mentor] || "";

      const systemPrompt = `${RTV_SYSTEM_PROMPT}\n\nCURRENT MENTOR MODE:\n${mentorPersona}\n\n${user_name ? `You are speaking with: ${user_name}` : "A new customer has arrived."}`;

      // Build message array for Claude
      const claudeMessages = [
        ...history.slice(-12).map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        })),
        { role: "user", content: message }
      ];

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key":         ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type":      "application/json",
        },
        body: JSON.stringify({
          model:      "claude-opus-4-5",
          max_tokens: 1024,
          system:     systemPrompt,
          messages:   claudeMessages,
        }),
      });

      if (!claudeRes.ok) {
        const err = await claudeRes.text();
        throw new Error(`Claude API error: ${err}`);
      }

      const claudeData = await claudeRes.json();
      const response   = claudeData.content?.[0]?.text || "The Council is processing your request...";

      // Calculate lead intelligence
      const allMessages = [...history, { role: "user", content: message }, { role: "assistant", content: response }];
      const leadScore   = calcLeadScore(allMessages);
      const interest    = detectInterest(allMessages);
      const smartReplies = getSmartReplies(allMessages, mentor);

      // Determine conversion CTA
      let cta = null;
      if (leadScore >= 60) {
        if (interest === "RTV AI University") {
          cta = { text: "Enroll in RTV AI University", url: "https://rotationtvai.com", type: "enroll" };
        } else if (interest === "RTVS Token") {
          cta = { text: "Buy $RTVS Token", url: "https://www.paypal.com/ncp/payment/F45K2VWDBVQHY", type: "purchase" };
        } else if (interest === "RotationPay") {
          cta = { text: "Set Up RotationPay", url: "https://rotationtvai.com", type: "signup" };
        } else if (interest === "RotationCall") {
          cta = { text: "Book RotationCall Demo", url: "https://rotationcall.net", type: "demo" };
        }
      }

      return new Response(JSON.stringify({
        ok:           true,
        response,
        mentor,
        model:        "claude-opus-4-5",
        lead_score:   leadScore,
        interest,
        smart_replies: smartReplies,
        cta,
        session_id:   session_id || `sess_${Date.now()}`,
      }), { headers: cors });
    }

    // ── action: get_smart_replies ─────────────────────────
    if (action === "smart_replies") {
      const { mentor = "council", history = [] } = body;
      return new Response(JSON.stringify({
        ok: true,
        replies: getSmartReplies(history, mentor)
      }), { headers: cors });
    }

    // ── action: status ────────────────────────────────────
    return new Response(JSON.stringify({
      ok:        true,
      service:   "Customer Mentor Bot",
      version:   "3.0",
      model:     "claude-opus-4-5",
      mentors:   ["council", "elon", "bezos", "buffett", "tesla"],
      companies: 9,
      motto:     "Learn it. Live it. Love it.",
      timestamp: new Date().toISOString(),
    }), { headers: cors });

  } catch (err) {
    console.error("CustomerMentorBot error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { headers: cors, status: 500 });
  }
}
