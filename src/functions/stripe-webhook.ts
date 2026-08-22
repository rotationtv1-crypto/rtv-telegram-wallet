/**
 * QUARANTINED — Stripe webhook DISABLED (HTTP 410)
 * User-facing payments: Telegram Stars (XTR) only.
 * See src/lib/telegramStars.ts
 */

export default {
  async fetch(): Promise<Response> {
    return new Response(
      JSON.stringify({
        error: 'GONE',
        message: 'Stripe webhooks retired. Telegram Stars (XTR) is the only payment surface.',
        policy: 'TELEGRAM_STARS_ONLY',
      }),
      {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
