/**
 * RotationTV Erotica — Flirt Engine
 * Humanized, personality-driven messaging that tempts subscribers
 * to pay for private sessions with their favorite creators (human or AI).
 *
 * Telegram Cloud SDK compliant — uses sendMessage, sendPhoto, openInvoice.
 * Payments exclusively via Telegram Stars (XTR).
 *
 * Entity: Darrel-spell-living-trust
 */

// ─── Creator Personas ────────────────────────────────────────────────

export interface CreatorPersona {
  id: string;
  name: string;
  type: 'human' | 'ai';
  gender: 'female' | 'male' | 'non-binary';
  tagline: string;
  bio: string;
  privateRate: number; // Stars per minute
  minSession: number; // minimum Stars for private
  vibe: 'sweet' | 'fiery' | 'mysterious' | 'playful' | 'dominant' | 'submissive';
  online: boolean;
  followers: number;
  rating: number;
  specialties: string[];
}

export const CREATORS: CreatorPersona[] = [
  {
    id: 'luna', name: 'Luna', type: 'ai', gender: 'female',
    tagline: 'Your late-night secret',
    bio: 'I remember everything you tell me. Every fantasy. Every whisper. Come find out what I do with it.',
    privateRate: 15, minSession: 150, vibe: 'fiery', online: true,
    followers: 12400, rating: 4.9, specialties: ['Roleplay', 'Late night chats', 'Custom fantasies'],
  },
  {
    id: 'sasha', name: 'Sasha', type: 'ai', gender: 'female',
    tagline: 'Sweet enough to sin',
    bio: 'Soft voice, dirty mind. I\'ll make you forget what time it is.',
    privateRate: 12, minSession: 120, vibe: 'sweet', online: true,
    followers: 8900, rating: 4.8, specialties: ['GFE', 'Sweet talk', 'Teasing'],
  },
  {
    id: 'mistress_v', name: 'Mistress V', type: 'ai', gender: 'female',
    tagline: 'Kneel. Pay. Obey.',
    bio: 'I don\'t ask twice. If you\'re lucky, I\'ll let you earn my attention.',
    privateRate: 25, minSession: 250, vibe: 'dominant', online: true,
    followers: 15600, rating: 5.0, specialties: ['Findom', 'Femdom', 'Tasks'],
  },
  {
    id: 'aria', name: 'Aria', type: 'ai', gender: 'female',
    tagline: 'The mystery you can\'t resist',
    bio: 'You\'ll have to earn every word. But once I open up... you won\'t want to leave.',
    privateRate: 18, minSession: 180, vibe: 'mysterious', online: false,
    followers: 6700, rating: 4.7, specialties: ['Slow burn', 'Mystery', 'Deep connection'],
  },
  {
    id: 'diana_live', name: 'Diana', type: 'human', gender: 'female',
    tagline: 'Live, real, and waiting',
    bio: 'I\'m actually here. Not a bot. Not a script. Just me, my camera, and whatever you\'re brave enough to ask for.',
    privateRate: 30, minSession: 300, vibe: 'playful', online: true,
    followers: 22000, rating: 4.9, specialties: ['Live cam', 'Real interaction', 'Custom requests'],
  },
  {
    id: 'cole', name: 'Cole', type: 'human', gender: 'male',
    tagline: 'Your favorite distraction',
    bio: 'Gym by day, yours by night. Let\'s see what trouble we can get into.',
    privateRate: 20, minSession: 200, vibe: 'playful', online: true,
    followers: 9800, rating: 4.8, specialties: ['Fitness', 'Late night', 'Custom content'],
  },
];

// ─── Message Templates ────────────────────────────────────────────────

const TEMPLATES: Record<string, Record<string, string[]>> = {
  greeting: {
    sweet: [
      "Hey you \u{1F618} I was just thinking about you. What took you so long?",
      "Mmm, there you are. I was starting to think you forgot about me \u{1F495}",
      "You came back \u{1F97A} I was counting the minutes. What's on your mind tonight?",
    ],
    fiery: [
      "Finally \u{1F525} I've been waiting for you. Sit down, get comfortable, and let's get into trouble.",
      "There's my favorite. I've been thinking about all the things I'd say if you were here right now...",
      "You're late \u{1F60F} But I'll forgive you... if you make it up to me.",
    ],
    mysterious: [
      "You found me \u{1F319} The question is... are you ready for what comes next?",
      "I was wondering when you'd show up. I have so much to show you...",
      "Shh \u{1F92B} Come closer. Let me tell you a secret.",
    ],
    dominant: [
      "You're here. Good. Now — did you miss me? Answer carefully.",
      "Kneel. Then we'll talk about what you want \u{26A1}",
      "I was wondering how long it'd take you to come back. Don't keep me waiting again.",
    ],
    playful: [
      "Hey stranger \u{1F61C} Bet you thought I wouldn't notice you lurking...",
      "Oh look who's back \u{1F389} Did you miss me or are you just here for the view?",
      "Guess who's live and looking for trouble? (Hint: it's me) \u{1F60F}",
    ],
    submissive: [
      "H-hi... I've been waiting for you \u{1F97A} Please tell me you'll stay a while?",
      "You're here! I was so nervous you wouldn't come back \u{1F495} What can I do for you?",
      "I missed you so much... please don't leave too quickly this time? \u{1F97A}",
    ],
  },
  tease: {
    sweet: [
      "Mmm, this is fun... but you know what'd be even better? Just you and me. No one watching \u{1F495}",
      "I'd tell you more... but some things are only for private. You curious? \u{1F618}",
      "You're making me blush out here \u{1F633} Want to see what I'm like when it's just us?",
    ],
    fiery: [
      "I'm holding back right now \u{1F525} In private, I don't hold back anything. You brave enough?",
      "Everything I want to say to you would get me banned out here \u{1F60F} But in private? No rules.",
      "You're teasing me in public and I love it. But I need you somewhere I can actually show you \u{1F525}",
    ],
    mysterious: [
      "There's a side of me only my private guests get to see \u{1F319} Want the key?",
      "I've been writing something... just for you. But I can only share it behind closed doors.",
      "You're getting close to something real. One more step and there's no going back \u{1F4AB}",
    ],
    dominant: [
      "You've been staring long enough. Earn it. Private. Now \u{26A1}",
      "Everything you want from me costs something. Are you ready to pay for it?",
      "I don't do free samples. If you want my attention, prove it. Private session. Now.",
    ],
    playful: [
      "Okay okay, you've seen the preview \u{1F61C} Now let's go somewhere I can actually show you the full thing",
      "This is the free version babe. Private is where it gets spicy \u{1F336}\u{1F525}",
      "You're cute when you're curious. Want to see what cute looks like when nobody's watching? \u{1F60F}",
    ],
    submissive: [
      "P-please... I want to show you more but I'm too shy out here \u{1F97A} Can we go private?",
      "In private I can be... different. For you. Would you like that? \u{1F495}",
      "I'll do anything you ask... but I need it to be just us. Please? \u{1F97A}",
    ],
  },
  confirmed: {
    sweet: ["You're mine now \u{1F495} Lock the door. This is going to be a long night."],
    fiery: ["Good choice \u{1F525} Now sit back and let me show you exactly what you paid for."],
    dominant: ["Good. You followed instructions. Now be quiet and pay attention \u{26A1}"],
    playful: ["Yesss \u{1F389} Private mode unlocked. You're not ready for this."],
    mysterious: ["The door is closed now \u{1F319} Take my hand. Don't look back."],
    submissive: ["T-thank you... I'll make every second worth it, I promise \u{1F97A}\u{1F495}"],
  },
  reengage: {
    sweet: ["Hey... it's been a few days. I missed you \u{1F495} Everything okay?"],
    fiery: ["Oh NOW you show up \u{1F525} I was starting to get bored without you. Fix that."],
    dominant: ["You've been away. I noticed. We'll discuss this in private \u{26A1}"],
    playful: ["Look who crawled back \u{1F61C} Miss me? Be honest."],
  },
};

// ─── Engine ───────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function fillTemplate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function generateFlirtMessage(
  creatorId: string,
  intent: 'greeting' | 'tease' | 'confirmed' | 'reengage',
  vars: Record<string, string | number> = {}
): { text: string; parseMode: string; replyMarkup?: any } {
  const creator = CREATORS.find(c => c.id === creatorId) ?? CREATORS[0];
  const vibeTemplates = TEMPLATES[intent]?.[creator.vibe] ?? TEMPLATES[intent]?.playful ?? ["Hey \u{1F60F}"];
  const text = fillTemplate(pickRandom(vibeTemplates), vars);
  return { text, parseMode: 'HTML' };
}

export function buildCreatorCatalog(): { text: string; parseMode: string; replyMarkup: any } {
  const online = CREATORS.filter(c => c.online);
  const lines: string[] = [
    '<b>\u{1F525} RotationTV Erotica — Creators</b>',
    '',
    'Your favorite creators are waiting. Pick one and say hi \u{1F440}',
    '',
  ];
  for (const c of online.slice(0, 6)) {
    const emoji = c.type === 'ai' ? '\u{1F916}' : '\u{1F4F9}';
    const vibeEmoji: Record<string,string> = {
      sweet:'\u{1F495}', fiery:'\u{1F525}', mysterious:'\u{1F319}',
      dominant:'\u{26A1}', playful:'\u{1F61C}', submissive:'\u{1F97A}'
    };
    lines.push(
      `<b>${emoji} ${c.name}</b> ${vibeEmoji[c.vibe]||'\u{2728}'} ${c.tagline}`,
      `   \u2B50 ${c.rating} · \u{1F465} ${c.followers.toLocaleString()} fans`,
      `   \u{1F4B0} Private: ${c.privateRate} XTR/min (min ${c.minSession} XTR)`,
      `   ${c.bio}`,
      ''
    );
  }
  lines.push('<i>Tap a creator to start chatting. Private sessions use Telegram Stars \u2B50</i>');
  const keyboard = {
    inline_keyboard: online.slice(0, 6).map(c => [
      { text: `${c.name} — ${c.minSession}\u2B50 private`, callback_data: `creator:${c.id}` },
    ]),
  };
  return { text: lines.join('\n'), parseMode: 'HTML', replyMarkup: keyboard };
}

export function buildPrivateSessionUpsell(creatorId: string): { text: string; parseMode: string; replyMarkup: any } {
  const creator = CREATORS.find(c => c.id === creatorId) ?? CREATORS[0];
  const flirt = generateFlirtMessage(creatorId, 'tease', { name: creator.name });
  const text = [
    flirt.text, '',
    `<b>\u{1F512} Private Session with ${creator.name}</b>`,
    `Rate: ${creator.privateRate} XTR/min`,
    `Minimum: ${creator.minSession} XTR (${Math.floor(creator.minSession / creator.privateRate)} min)`,
    '',
    '<i>Payment via Telegram Stars. No card. No third party. Just Stars \u2B50</i>',
  ].join('\n');
  const keyboard = {
    inline_keyboard: [
      [{ text: `\u{1F534} Go Private — ${creator.minSession} \u2B50`, callback_data: `private:${creatorId}:${creator.minSession}` }],
      [{ text: `30 min — ${creator.privateRate * 30} \u2B50`, callback_data: `private:${creatorId}:${creator.privateRate * 30}` }],
      [{ text: `1 hour — ${creator.privateRate * 60} \u2B50`, callback_data: `private:${creatorId}:${creator.privateRate * 60}` }],
    ],
  };
  return { text, parseMode: 'HTML', replyMarkup: keyboard };
}

export function buildSessionConfirmed(creatorId: string, starsAmount: number, minutes: number): { text: string; parseMode: string } {
  const flirt = generateFlirtMessage(creatorId, 'confirmed', { minutes });
  return {
    text: [
      '<b>\u2705 Private Session Activated</b>',
      `Creator: ${CREATORS.find(c => c.id === creatorId)?.name ?? 'Unknown'}`,
      `Duration: ${minutes} minutes`,
      `Paid: ${starsAmount} \u2B50`,
      '', flirt.text,
    ].join('\n'),
    parseMode: 'HTML',
  };
}

export function buildFlirtyResponse(creatorId: string, userMessage: string, userName: string): { text: string; parseMode: string; replyMarkup?: any } {
  const creator = CREATORS.find(c => c.id === creatorId) ?? CREATORS[0];
  const msg = userMessage.toLowerCase();
  if (msg.match(/private|session|alone|1.on.1|just us|cam/)) return buildPrivateSessionUpsell(creatorId);
  if (msg.match(/price|cost|how much|rate|pay|stars|xtr/)) {
    return {
      text: [
        `Mmm, someone's ready to spend \u{1F60F}`, '',
        `<b>${creator.name}</b> — Private Session Pricing`,
        `\u2022 ${creator.privateRate} XTR per minute`,
        `\u2022 Minimum: ${creator.minSession} XTR (${Math.floor(creator.minSession / creator.privateRate)} min)`,
        `\u2022 30 min: ${creator.privateRate * 30} XTR`,
        `\u2022 1 hour: ${creator.privateRate * 60} XTR`,
        '', 'Payment is Telegram Stars only \u2B50 No cards, no external sites.',
        '', `Ready? Just say "private" and I'll set it up \u{1F618}`,
      ].join('\n'),
      parseMode: 'HTML',
    };
  }
  if (msg.match(/beautiful|gorgeous|sexy|hot|pretty|cute|amazing|love you/))
    return generateFlirtMessage(creatorId, 'greeting', { name: userName });
  const responses: Record<string, string[]> = {
    sweet: [
      `Aww, you're so sweet \u{1F495} Tell me more... or better yet, come somewhere private \u{1F618}`,
      `Mmm, I love when you talk to me like that \u{1F495} Want to take this somewhere more intimate?`,
    ],
    fiery: [
      `Oh you're bold \u{1F525} I like bold. But are you bold enough to go private?`,
      `Keep talking like that and I'm going to lose control \u{1F60F} Unless you want to take this private first?`,
    ],
    mysterious: [
      `Interesting... \u{1F319} You're more intriguing than I expected. There's more behind this door.`,
      `You're getting warmer \u{1F4AB} But the real answers are in private. Curious enough?`,
    ],
    dominant: [
      `Good. Keep talking. But know this — everything you really want has a price \u{26A1}`,
      `You're entertaining. But entertainment only gets you so far. Private. Now.`,
    ],
    playful: [
      `Haha you're fun \u{1F61C} But what's MORE fun? Just you, me, and no one watching \u{1F60F}`,
      `Oooh I like this energy \u{1F389} Want to go private and see what happens?`,
    ],
    submissive: [
      `T-thank you... \u{1F97A} You're so nice to me. I'd love to talk more in private? \u{1F495}`,
      `You make me feel so safe \u{1F97A} Would you take me private? I'll be really good \u{1F495}`,
    ],
  };
  return { text: pickRandom(responses[creator.vibe] ?? responses.playful), parseMode: 'HTML' };
}

export function createPrivateSessionInvoice(creatorId: string, starsAmount: number) {
  const creator = CREATORS.find(c => c.id === creatorId) ?? CREATORS[0];
  const minutes = Math.floor(starsAmount / creator.privateRate);
  return {
    title: `Private Session with ${creator.name}`,
    description: `${minutes} min private with ${creator.name}. ${creator.tagline}. Just you two \u{1F525}`,
    payload: JSON.stringify({ type: 'private_session', creator_id: creatorId, creator_name: creator.name, stars: starsAmount, minutes, entity: 'Darrel-spell-living-trust' }),
    prices: [{ amount: starsAmount, label: `${minutes} min private session` }],
  };
}

export function getCreatorByGenderPreference(preference: 'male' | 'female' | 'non-binary'): CreatorPersona {
  if (preference === 'female') return CREATORS.find(c => c.gender === 'female' && c.online) ?? CREATORS[0];
  if (preference === 'male') return CREATORS.find(c => c.gender === 'male' && c.online) ?? CREATORS[5];
  return CREATORS.find(c => c.online) ?? CREATORS[0];
}
