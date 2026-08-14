/**
 * RotationTV DB Layer — Telegram Native Payments Only
 * Rails: Telegram Stars (XTR) + USDT (TON Connect)
 * NO internal RTV token — purged
 */
import { createStarsInvoice, calculateRevenueSplit, STARS_CATALOG } from "./src/lib/telegramStars";

export interface PaymentTransaction {
  charge_id: string;
  user_id: number;
  amount: number; // in Stars (XTR)
  currency: "XTR" | "USDT";
  payment_rail: "telegram_stars" | "usdt_ton_connect";
  payload: any;
  timestamp: string;
  entity: string; // Darrel-spell-living-trust
}

/**
 * Record a Stars payment to Supabase
 */
export async function recordStarsPayment(
  supabaseUrl: string,
  supabaseKey: string,
  tx: PaymentTransaction
): Promise<{ ok: boolean; error?: string }> {
  try {
    const split = calculateRevenueSplit(tx.amount);
    
    await fetch(`${supabaseUrl}/rest/v1/stars_payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        ...tx,
        revenue_split: split,
        entity: "Darrel-spell-living-trust",
      }),
    });

    await fetch(`${supabaseUrl}/rest/v1/revenue_splits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        charge_id: tx.charge_id,
        creator_amount: split.creator,
        platform_amount: split.platform,
        agency_amount: split.agency,
        total: split.total,
        currency: tx.currency,
        entity: "Darrel-spell-living-trust",
      }),
    });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Create a Telegram Stars invoice (no RTV conversion)
 */
export async function createStarsPurchaseInvoice(
  botToken: string,
  params: { stars_amount: number; telegram_id: number; item_type: string; item_id: string; stream_id?: string }
): Promise<{ ok: boolean; invoice_url?: string; error?: string }> {
  const item = STARS_CATALOG.gifts.find(g => g.id === params.item_id) ||
                STARS_CATALOG.subscriptions.find(s => s.id === params.item_id) ||
                STARS_CATALOG.hosts.find(h => h.id === params.item_id);
  
  if (!item) {
    return { ok: false, error: "Item not found in Stars catalog" };
  }

  const result = await createStarsInvoice(botToken, {
    title: item.label,
    description: `RotationTV ${params.item_type}: ${item.label}`,
    payload: JSON.stringify({
      user_id: params.telegram_id,
      type: params.item_type,
      item_id: params.item_id,
      stream_id: params.stream_id,
      stars: item.stars,
      entity: "Darrel-spell-living-trust",
      ts: Date.now(),
    }),
    prices: [{ amount: item.stars, label: item.label }],
  });

  return result;
}

/**
 * Get Stars catalog
 */
export function getStarsCatalog() {
  return {
    currency: "XTR",
    catalog: STARS_CATALOG,
    note: "Telegram native payments only — no RTV token",
    entity: "Darrel-spell-living-trust",
  };
}
