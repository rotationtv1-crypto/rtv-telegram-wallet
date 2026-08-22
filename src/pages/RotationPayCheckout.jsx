/**
 * QUARANTINED — Multi-rail checkout UI DISABLED
 * =================================================
 * Stripe / PayPal / Solana / RTV-token / Venmo / Zelle checkout removed.
 * User-facing payments = Telegram Stars (XTR) only via Mini App.
 */

export default function RotationPayCheckout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Checkout retired
        </h1>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          Stripe, PayPal, Solana, and RTV-token payment portals are quarantined.
          All in-app purchases use <strong style={{ color: '#fff' }}>Telegram Stars</strong> only.
        </p>
        <p style={{ color: '#555', fontSize: 12 }}>
          Open the Mini App inside Telegram to tip, subscribe, or unlock content.
        </p>
      </div>
    </div>
  );
}
