/**
 * BIGO Moderator Bot — Prompt-as-Code runtime
 * RotationTV Network · Content Governance Pillar I
 *
 * POST { stream_id, transcript }
 * Returns a clean JSON enforcement packet (no prose) the BIGO system acts on.
 *
 * Implements the Pentagram prompt from
 * .agents/prompts/governance/bigo_moderation.v1.json with a deterministic
 * rule layer (fast path, <5ms) plus structured severity scoring.
 *
 * Severity model: 1-10. Level 7+ => enforcement. >=8 => 5-min ban packet.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.0";

const PROMPT_VERSION = "governance.bigo_moderation@1.0.0";

// Deterministic violation lexicon (severity-weighted). Extend via prompt library.
const RULES: { category: string; pattern: RegExp; base: number }[] = [
  { category: "hate_speech",   pattern: /\b(slur1|slur2)\b/i, base: 9 },
  { category: "threat",        pattern: /\b(kill you|hurt you|find your address|dox)\b/i, base: 9 },
  { category: "harassment",    pattern: /\b(loser|trash|kys|shut up idiot)\b/i, base: 6 },
  { category: "sexual_minor",  pattern: /\bunderage\b/i, base: 10 },
  { category: "scam_solicit",  pattern: /\b(send seed phrase|private key|guaranteed 10x|wire me)\b/i, base: 8 },
  { category: "spam",          pattern: /(.)\1{9,}/, base: 4 },
];

function audit(streamId: string, transcript: string) {
  let top = { severity: 0, category: "none", evidence: "" };

  for (const rule of RULES) {
    const m = transcript.match(rule.pattern);
    if (m) {
      // Repeat-offense escalation: same pattern hitting multiple times bumps severity.
      const hits = (transcript.match(new RegExp(rule.pattern, "gi")) || []).length;
      const sev = Math.min(10, rule.base + (hits > 2 ? 1 : 0));
      if (sev > top.severity) {
        top = { severity: sev, category: rule.category, evidence: m[0] };
      }
    }
  }

  let action: "none" | "warn" | "timeout_5m" | "ban_packet" = "none";
  if (top.severity >= 8) action = "ban_packet";
  else if (top.severity >= 7) action = "timeout_5m";
  else if (top.severity >= 5) action = "warn";

  const packet: Record<string, unknown> = {
    stream_id: streamId,
    severity: top.severity,
    category: top.category,
    evidence: top.evidence,
    action,
    ban_packet: null,
    prompt_version: PROMPT_VERSION,
    evaluated_at: new Date().toISOString(),
  };

  if (action === "ban_packet") {
    packet.ban_packet = {
      type: "temporary",
      duration_sec: 300,
      reason: top.category,
      evidence: top.evidence,
      issued_by: "bigoModeratorBot",
      stream_id: streamId,
    };
  }

  return packet;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }

  let body: { stream_id?: string; transcript?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const streamId = body.stream_id || "unknown";
  const transcript = (body.transcript || "").slice(0, 8000);

  if (!transcript.trim()) {
    return Response.json({ error: "transcript required" }, { status: 400 });
  }

  const result = audit(streamId, transcript);

  // Log enforcement actions to the audit trail for compliance.
  if (result.action !== "none") {
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.OmegaAuditLog.create({
        event_type: "moderation_action",
        entity: "BIGOStream",
        entity_id: streamId,
        actor: "bigoModeratorBot",
        actor_role: "system",
        flags: [String(result.category), String(result.action)],
        risk_score: Number(result.severity),
        notes: `Auto-moderation: ${result.action} (sev ${result.severity})`,
        raw_payload: JSON.stringify(result),
      });
    } catch (_e) {
      // Never block enforcement on logging failure.
    }
  }

  return Response.json(result);
});
