/**
 * Quarantined Stripe RTV top-up route.
 * User-facing payments = Telegram Stars (XTR) only.
 */
export function paymentCreateGone(): Response {
  return new Response(
    JSON.stringify({
      error: "GONE",
      message: "Stripe/RTV top-up removed. Use Telegram Stars via POST /api/stars/invoice.",
      policy: "TELEGRAM_STARS_ONLY",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
