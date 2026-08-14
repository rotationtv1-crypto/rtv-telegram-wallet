import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

interface Env {
  CREATOR_PAYOUT_WORKFLOW: Workflow;
  PAYOUT_ENGINE_URL: string;
}

type PayoutParams = {
  creator_id: string;
  period: "weekly" | "biweekly" | "monthly";
  stream_ids: string[];
};

type CreatorStats = {
  total_tips_rtv: number;
  total_tips_usd: number;
  tip_count: number;
  unique_tippers: number;
  pk_winnings_rtv: number;
  subscription_revenue_rtv: number;
  followers: number;
  stream_hours: number;
  pk_wins: number;
  is_verified: boolean;
};

export class CreatorPayoutWorkflow extends WorkflowEntrypoint<Env, PayoutParams> {
  async run(event: WorkflowEvent<PayoutParams>, step: WorkflowStep) {
    const { creator_id, period, stream_ids } = event.payload;

    // Step 1: Aggregate creator stats from all streams
    const stats = await step.do("fetch-creator-stats", async () => {
      // In production, aggregate from Base44 StreamTip entities
      return {
        total_tips_rtv: 5000,
        total_tips_usd: 50,
        tip_count: 234,
        unique_tippers: 87,
        pk_winnings_rtv: 1200,
        subscription_revenue_rtv: 800,
        followers: 1200,
        stream_hours: 45,
        pk_wins: 3,
        is_verified: true,
      } as CreatorStats;
    });

    // Step 2: Calculate 80/15/5 revenue split
    const split = await step.do("calculate-split", async () => {
      const grossRtv = stats.total_tips_rtv + stats.pk_winnings_rtv + stats.subscription_revenue_rtv;
      return {
        gross_rtv: grossRtv,
        creator_rtv: Math.floor(grossRtv * 0.80),
        platform_rtv: Math.floor(grossRtv * 0.15),
        agency_rtv: Math.floor(grossRtv * 0.05),
        creator_usd: +(Math.floor(grossRtv * 0.80) * 0.01).toFixed(2),
        platform_usd: +(Math.floor(grossRtv * 0.15) * 0.01).toFixed(2),
      };
    });

    // Step 3: Check and unlock milestones
    const milestones = await step.do("check-milestones", async () => {
      const resp = await fetch(`${this.env.PAYOUT_ENGINE_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_milestones",
          payload: {
            creator_id,
            stats: {
              followers: stats.followers,
              total_earnings_rtv: split.creator_rtv,
              pk_wins: stats.pk_wins,
              stream_hours: stats.stream_hours,
              is_verified: stats.is_verified,
            },
          },
        }),
      });
      return await resp.json();
    });

    // Step 4: Sleep until payout window
    await step.sleep("wait-for-payout-window", "1 minute");

    // Step 5: Finalize payout with exponential backoff retry
    await step.do(
      "finalize-earnings",
      {
        retries: { limit: 5, delay: "5 second", backoff: "exponential" },
        timeout: "15 minutes",
      },
      async () => {
        const resp = await fetch(`${this.env.PAYOUT_ENGINE_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request_withdrawal",
            payload: {
              creator_id,
              amount_rtv: split.creator_rtv,
              method: "ton_wallet",
              destination_address: "creator_ton_wallet",
            },
          }),
        });
        if (!resp.ok) throw new Error(`Payout failed: ${resp.status}`);
        return await resp.json();
      }
    );

    // Step 6: Record final result
    const result = await step.do("record-payout", async () => {
      return {
        success: true,
        creator_id,
        period,
        gross_rtv: split.gross_rtv,
        creator_payout_rtv: split.creator_rtv,
        platform_revenue_rtv: split.platform_rtv,
        milestones_unlocked: milestones.milestones?.length || 0,
        finalized_at: new Date().toISOString(),
      };
    });

    return result;
  }
}
