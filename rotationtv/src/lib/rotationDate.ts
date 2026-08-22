/**
 * RotationTV — RotationDate System
 * Gender-segmented onboarding + Telegram Stars subscriptions + Tonviewer tracking.
 * Telegram Cloud SDK compliant. Dispatches via configurable bot token.
 *
 * Entity: Darrel-spell-living-trust
 */

// ─── Gender Onboarding State Machine ────────────────────────────────

export type Gender = 'male' | 'female' | 'non-binary';
export type OnboardingStep = 'init' | 'gender' | 'preferences' | 'complete';

export interface OnboardingState {
  telegramId: number;
  username?: string;
  firstName?: string;
  photoUrl?: string;
  gender?: Gender;
  interestedIn?: Gender[];
  step: OnboardingStep;
  createdAt: number;
  updatedAt: number;
}

// In-memory store (production: D1 or KV)
const onboardingStore = new Map<number, OnboardingState>();

/**
 * Initialize or resume onboarding for a Telegram user.
 */
export function initOnboarding(user: {
  id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
}): OnboardingState {
  const existing = onboardingStore.get(user.id);
  if (existing) return existing;

  const state: OnboardingState = {
    telegramId: user.id,
    username: user.username,
    firstName: user.first_name,
    photoUrl: user.photo_url,
    step: 'init',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  onboardingStore.set(user.id, state);
  return state;
}

/**
 * Advance the onboarding state machine.
 */
export function advanceOnboarding(
  telegramId: number,
  field: 'gender' | 'interestedIn',
  value: Gender | Gender[]
): OnboardingState | null {
  const state = onboardingStore.get(telegramId);
  if (!state) return null;

  if (field === 'gender') {
    state.gender = value as Gender;
    state.step = 'preferences';
  } else if (field === 'interestedIn') {
    state.interestedIn = value as Gender[];
    state.step = 'complete';
  }

  state.updatedAt = Date.now();
  onboardingStore.set(telegramId, state);
  return state;
}

export function getOnboardingState(telegramId: number): OnboardingState | null {
  return onboardingStore.get(telegramId) ?? null;
}

// ─── Gender-Segmented Content ───────────────────────────────────────

export interface DatingProfile {
  gender: Gender;
  tagline: string;
  welcomeMessage: string;
  ctaText: string;
  subscriptionTiers: {
    name: string;
    price: number; // Stars (XTR)
    description: string;
    features: string[];
  }[];
}

const PROFILES: Record<Gender, DatingProfile> = {
  male: {
    gender: 'male',
    tagline: 'Find your perfect match',
    welcomeMessage: "Welcome to RotationDate 🔥 Your matches are waiting. Tell us what you're looking for.",
    ctaText: 'Subscribe to unlock unlimited matches and private chats',
    subscriptionTiers: [
      { name: 'Basic', price: 100, description: '5 matches/day, text chat', features: ['5 daily matches', 'Text messaging', 'Profile views'] },
      { name: 'Premium', price: 500, description: 'Unlimited matches + video calls', features: ['Unlimited matches', 'Video calls', 'Priority matching', 'Read receipts'] },
      { name: 'VIP', price: 999, description: 'Everything + AI wingman', features: ['Everything in Premium', 'AI conversation coach', 'Verified badge', 'Advanced filters'] },
    ],
  },
  female: {
    gender: 'female',
    tagline: "You're in control",
    welcomeMessage: "Welcome to RotationDate 💕 Your profile is live. Choose who catches your eye.",
    ctaText: 'Subscribe to see who liked you and unlock private sessions',
    subscriptionTiers: [
      { name: 'Basic', price: 100, description: '10 matches/day, text chat', features: ['10 daily matches', 'Text messaging', 'Profile views'] },
      { name: 'Premium', price: 500, description: 'Unlimited + private sessions', features: ['Unlimited matches', 'Private sessions', 'Priority in discovery', 'Who liked you'] },
      { name: 'VIP', price: 999, description: 'Everything + verified badge', features: ['Everything in Premium', 'Verified badge', 'AI safety screening', 'Custom intro video'] },
    ],
  },
  'non-binary': {
    gender: 'non-binary',
    tagline: 'Be yourself, find your people',
    welcomeMessage: "Welcome to RotationDate ⚡ We see you. Your matches are ready.",
    ctaText: 'Subscribe to connect with matches who get you',
    subscriptionTiers: [
      { name: 'Basic', price: 100, description: '5 matches/day, text chat', features: ['5 daily matches', 'Text messaging', 'Profile views'] },
      { name: 'Premium', price: 500, description: 'Unlimited matches + video', features: ['Unlimited matches', 'Video calls', 'Priority matching', 'Read receipts'] },
      { name: 'VIP', price: 999, description: 'Everything + AI coach', features: ['Everything in Premium', 'AI conversation coach', 'Verified badge', 'Advanced filters'] },
    ],
  },
};

export function getGenderProfile(gender: Gender): DatingProfile {
  return PROFILES[gender] ?? PROFILES['non-binary'];
}

// ─── Tonviewer Link Generation ──────────────────────────────────────

export function generateTonviewerLink(
  baseUrl: string,
  chatId: number,
  paymentId: string,
  transactionType: 'subscription' | 'tip' | 'private_session' = 'subscription'
): string {
  const txId = `${transactionType}_${chatId}_${paymentId}_${Date.now()}`;
  return `${baseUrl}/tx/${txId}`;
}

// ─── Stars Invoice Generation ───────────────────────────────────────

export function createStarsInvoice(
  gender: Gender,
  tierName: string,
  botUsername: string
): { title: string; description: string; payload: string; prices: { amount: number; label: string }[] } | null {
  const profile = PROFILES[gender];
  if (!profile) return null;

  const tier = profile.subscriptionTiers.find(t => t.name === tierName);
  if (!tier) return null;

  return {
    title: `RotationDate ${tier.name} — ${gender}`,
    description: `${tier.description}. ${tier.features.join(', ')}. Powered by @${botUsername}`,
    payload: JSON.stringify({
      type: 'rotationdate_subscription',
      gender,
      tier: tierName,
      price: tier.price,
      entity: 'Darrel-spell-living-trust',
    }),
    prices: [{ amount: tier.price, label: `${tier.name} subscription (1 month)` }],
  };
}

// ─── Confirmation Message Builder ───────────────────────────────────

export function buildConfirmationMessage(
  gender: Gender,
  tierName: string,
  tonviewerLink: string,
  botUsername: string
): { text: string; keyboard: any } {
  const profile = PROFILES[gender];
  const tier = profile.subscriptionTiers.find(t => t.name === tierName);

  const text = [
    `🎉 Subscription Confirmed!`,
    '',
    `Welcome to RotationDate ${tierName}!`,
    `Plan: ${tier?.description ?? 'Premium dating access'}`,
    '',
    `Your benefits:`,
    ...(tier?.features.map(f => `✅ ${f}`) ?? []),
    '',
    `Track your transaction on-chain:`,
    tonviewerLink,
    '',
    `Entity: Darrel-spell-living-trust`,
  ].join('\n');

  const keyboard = {
    inline_keyboard: [
      [{ text: '🔍 View on Tonviewer', url: tonviewerLink }],
      [{ text: `🚀 Open @${botUsername}`, url: `https://t.me/${botUsername}` }],
      [{ text: '💕 Find Matches', callback_data: 'rotationdate:matches' }],
    ],
  };

  return { text, keyboard };
}

// ─── Bot Dispatch Helper ────────────────────────────────────────────

export async function dispatchViaBot(
  botToken: string,
  chatId: number,
  text: string,
  keyboard?: any
): Promise<boolean> {
  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (keyboard) body.reply_markup = keyboard;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}
