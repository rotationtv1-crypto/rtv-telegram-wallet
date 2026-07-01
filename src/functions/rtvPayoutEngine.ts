/**
 * RotationTV Network — Creator Payout Engine v2
 * HTTP-wrapped for Base44 backend function
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const RTV_TO_USD = 0.01;

const COMBO_TIERS = [
  { min: 100, multiplier: 10.0, bonus_creator: 400, name: "Universe Breaker", color: "#CCFF00" },
  { min: 50, multiplier: 5.0, bonus_creator: 150, name: "Galaxy Rush", color: "#9D00FF" },
  { min: 20, multiplier: 3.0, bonus_creator: 60, name: "Diamond Explosion", color: "#B9F2FF" },
  { min: 10, multiplier: 2.0, bonus_creator: 25, name: "Lightning Storm", color: "#00BFFF" },
  { min: 5, multiplier: 1.5, bonus_creator: 10, name: "Fire Burst", color: "#FF6B00" },
  { min: 1, multiplier: 1.0, bonus_creator: 0, name: "Normal", color: "#FFFFFF" },
];

function getComboTier(combo: number) {
  return COMBO_TIERS.find(t => combo >= t.min) || COMBO_TIERS[COMBO_TIERS.length - 1];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  if (req.method === "GET") {
    return Response.json({ status: "OPERATIONAL", actions: ["process_tip", "process_pk_win", "check_milestones", "split_preview", "request_withdrawal", "subscribe"], parity: "1 RTV = $0.01 USD" });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ── Process Tip ──────────────────────────────
    if (action === "process_tip") {
      const { gift_id, gift_name, amount_rtv, combo_count, sender_id, receiver_id, stream_id, message, is_anonymous } = body;
      const combo = getComboTier(combo_count || 1);
      const comboBonusRtv = combo.bonus_creator;
      const creatorShare = Math.floor(amount_rtv * 0.80);
      const platformFee = Math.floor(amount_rtv * 0.15);
      const agencyFee = Math.floor(amount_rtv * 0.05);
      const creatorEarnRtv = creatorShare + comboBonusRtv;

      // Log tip to StreamTip entity
      try {
        await base44.entities.StreamTip.create({
          stream_id: stream_id || "none",
          sender_id: String(sender_id || "unknown"),
          receiver_id: String(receiver_id || "unknown"),
          gift_id: gift_id || "",
          gift_name: gift_name || "",
          gift_emoji: body.gift_emoji || "🎁",
          amount_rtv: amount_rtv,
          amount_usd: +(amount_rtv * RTV_TO_USD).toFixed(2),
          creator_earn_rtv: creatorEarnRtv,
          creator_earn_usd: +(creatorEarnRtv * RTV_TO_USD).toFixed(2),
          platform_fee_rtv: platformFee,
          agency_fee_rtv: agencyFee,
          combo_count: combo_count || 1,
          combo_bonus_rtv: comboBonusRtv,
          message: message || "",
          is_anonymous: is_anonymous || false,
          is_pinned: false,
          status: "completed",
        });
      } catch (e) { /* entity write may fail if user not authed */ }

      return Response.json({
        success: true,
        tip: {
          gift_name, amount_rtv, combo_count: combo_count || 1,
          combo_tier: combo.name, combo_multiplier: combo.multiplier,
          creator_earn_rtv: creatorEarnRtv,
          creator_earn_usd: +(creatorEarnRtv * RTV_TO_USD).toFixed(2),
          platform_fee_rtv: platformFee,
          combo_bonus_rtv: comboBonusRtv,
        },
        effect: { name: combo.name, color: combo.color, multiplier: combo.multiplier },
      });
    }

    // ── Process PK Win ───────────────────────────
    if (action === "process_pk_win") {
      const { battle_id, winner_id, total_pool_rtv } = body;
      const creatorShare = Math.floor(total_pool_rtv * 0.80);
      const winnerBonus = Math.floor(creatorShare * 0.10);
      const winnerTotal = creatorShare + winnerBonus;
      return Response.json({
        success: true,
        pk_result: { battle_id, winner_id, total_pool_rtv, winner_payout_rtv: winnerTotal, pk_winner_bonus_rtv: winnerBonus, platform_fee_rtv: Math.floor(total_pool_rtv * 0.15) },
      });
    }

    // ── Check Milestones ─────────────────────────
    if (action === "check_milestones") {
      const { followers, total_earnings_rtv, stream_hours, pk_wins, is_verified } = body;
      const milestones = [];
      if (followers >= 10000) milestones.push({ type: "followers_10k", name: "10K Followers", reward: 1000, badge: "💎" });
      else if (followers >= 1000) milestones.push({ type: "followers_1k", name: "1K Followers", reward: 500, badge: "👑" });
      else if (followers >= 100) milestones.push({ type: "followers_100", name: "100 Followers", reward: 100, badge: "🌟" });
      if (total_earnings_rtv >= 10000) milestones.push({ type: "first_10k_rtv", name: "10K RTV Earned", reward: 500, badge: "💰" });
      else if (total_earnings_rtv >= 1000) milestones.push({ type: "first_1k_rtv", name: "1K RTV Earned", reward: 200, badge: "💸" });
      if (pk_wins >= 10) milestones.push({ type: "pk_10_wins", name: "10 PK Wins", reward: 300, badge: "⚔️" });
      else if (pk_wins >= 1) milestones.push({ type: "pk_first_win", name: "First PK Win", reward: 100, badge: "🗡️" });
      if (stream_hours >= 500) milestones.push({ type: "hours_500", name: "500 Stream Hours", reward: 1000, badge: "🔥" });
      else if (stream_hours >= 100) milestones.push({ type: "hours_100", name: "100 Stream Hours", reward: 300, badge: "⚡" });
      return Response.json({ success: true, milestones, total_rewards: milestones.reduce((s, m) => s + m.reward, 0) });
    }

    // ── Split Preview ────────────────────────────
    if (action === "split_preview") {
      const { amount_rtv, split_type } = body;
      const splits = {
        standard: { creator: 80, platform: 15, agency: 5 },
        vip: { creator: 85, platform: 10, agency: 5 },
        agency: { creator: 70, platform: 10, agency: 20 },
      };
      const s = splits[split_type] || splits.standard;
      return Response.json({
        success: true,
        split: {
          type: split_type || "standard",
          creator_rtv: Math.floor(amount_rtv * (s.creator / 100)),
          creator_usd: +(amount_rtv * (s.creator / 100) * RTV_TO_USD).toFixed(2),
          platform_rtv: Math.floor(amount_rtv * (s.platform / 100)),
          agency_rtv: Math.floor(amount_rtv * (s.agency / 100)),
        },
      });
    }

    // ── Request Withdrawal ───────────────────────
    if (action === "request_withdrawal") {
      const { creator_id, amount_rtv, destination_address } = body;
      const fee = Math.max(10, Math.floor(amount_rtv * 0.01));
      const net = amount_rtv - fee;
      try {
        await base44.entities.CreatorWithdrawal.create({
          creator_id: String(creator_id || "unknown"),
          amount_rtv: amount_rtv,
          amount_usd: +(amount_rtv * RTV_TO_USD).toFixed(2),
          method: "ton",
          destination_address: destination_address || "",
          fee_rtv: fee,
          fee_usd: +(fee * RTV_TO_USD).toFixed(2),
          net_rtv: net,
          net_usd: +(net * RTV_TO_USD).toFixed(2),
          status: "pending",
          requested_at: new Date().toISOString(),
        });
      } catch (e) { /* entity write may fail */ }
      return Response.json({ success: true, withdrawal: { amount_rtv, fee_rtv: fee, net_rtv: net, status: "pending" } });
    }

    // ── Subscribe ────────────────────────────────
    if (action === "subscribe") {
      const { tier, price_usd, price_rtv, subscriber_id, creator_id } = body;
      try {
        await base44.entities.CreatorSubscription.create({
          creator_id: String(creator_id || "platform"),
          subscriber_id: String(subscriber_id || "unknown"),
          tier: tier || "bronze",
          price_usd: price_usd || 4.99,
          price_rtv: price_rtv || 499,
          creator_share_rtv: Math.floor((price_rtv || 499) * 0.80),
          status: "active",
          billing_cycle: "monthly",
          started_at: new Date().toISOString(),
          auto_renew: true,
        });
      } catch (e) { /* entity write may fail */ }
      return Response.json({ success: true, subscription: { tier, price_usd, price_rtv, status: "active" } });
    }

    return Response.json({ error: "Unknown action. Use: process_tip, process_pk_win, check_milestones, split_preview, request_withdrawal, subscribe" });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});