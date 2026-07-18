/**
 * Base44 URL-safe encoding for Telegram deep links
 * Replaces + → -, / → _, strips padding (=)
 */

export function encodeState(state: any): string {
  const json = JSON.stringify(state);
  const base64 = btoa(json);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeState(encoded: string | null): any {
  if (!encoded) return { context: 'No state passed.' };
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return { context: 'Invalid state.' };
  }
}
