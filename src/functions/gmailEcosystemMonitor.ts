import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ============================================================
// GMAIL ECOSYSTEM MONITOR — QUANTUM PRECISION MASTER MODE
// RotationTV Network | v3.0 | Priority Intelligence Engine
// ============================================================

const PRIORITY_TIERS = {
  P1_EMERGENCY: {
    level: 1,
    label: '🚨 P1 EMERGENCY',
    emoji: '🚨',
    color: 16711680, // red
    keywords: ['hack', 'breach', 'unauthorized access', 'account suspended', 'security alert', 'fraud detected', 'critical failure', 'system down', 'urgent action required'],
  },
  P2_BLOCKCHAIN: {
    level: 2,
    label: '⛓️ P2 BLOCKCHAIN',
    emoji: '⛓️',
    color: 16753920, // orange
    keywords: ['solana', 'transaction confirmed', 'wallet', 'mint', 'nft', 'token transfer', 'rtv token', 'blockchain', 'web3', 'on-chain', 'chainstack', 'rpc node'],
  },
  P3_PAYMENT: {
    level: 3,
    label: '💳 P3 PAYMENT',
    emoji: '💳',
    color: 16776960, // yellow
    keywords: ['payment received', 'invoice', 'receipt', 'stripe', 'payout', 'refund', 'charge', 'subscription', 'renewal', 'billing', 'rotationpay'],
  },
  P4_BUSINESS: {
    level: 4,
    label: '🏢 P4 BUSINESS',
    emoji: '🏢',
    color: 3447003, // blue
    keywords: ['partnership', 'contract', 'agreement', 'proposal', 'deal', 'meeting request', 'onboarding', 'client', 'enterprise', 'rotationtv', 'rotation network'],
  },
  P5_TECHNICAL: {
    level: 5,
    label: '🔧 P5 TECHNICAL',
    emoji: '🔧',
    color: 3066993, // green
    keywords: ['github', 'deploy', 'build failed', 'error', 'api', 'integration', 'webhook', 'supabase', 'cloudflare', 'vercel', 'emergent', 'base44', 'openclaw'],
  },
  P6_ACADEMY: {
    level: 6,
    label: '🎓 P6 ACADEMY',
    emoji: '🎓',
    color: 10181046, // purple
    keywords: ['academy', 'course', 'credit', 'diploma', 'certificate', 'rtv learn', 'learn it live it'],
  },
  P7_VOIP: {
    level: 7,
    label: '📞 P7 VOIP',
    emoji: '📞',
    color: 1752220, // teal
    keywords: ['rotationcall', 'voip', 'call forwarding', 'sms', 'twilio', 'phone number', 'voice', 'inbound call'],
  },
  P8_COMMUNITY: {
    level: 8,
    label: '💬 P8 COMMUNITY',
    emoji: '💬',
    color: 7506394, // gray-blue
    keywords: ['discord', 'slack', 'telegram', 'community', 'member', 'follower', 'subscriber'],
  },
  P9_INFO: {
    level: 9,
    label: 'ℹ️ P9 INFO',
    emoji: 'ℹ️',
    color: 12370112, // gray
    keywords: ['update', 'newsletter', 'announcement', 'notice', 'fyi', 'heygen', 'elevenlabs'],
  },
  P10_NOISE: {
    level: 10,
    label: '🗑️ P10 NOISE',
    emoji: '🗑️',
    color: 8421504,
    keywords: ['unsubscribe', 'promotional', 'sale', 'discount', 'offer expires', 'limited time', 'click here', 'verify your email for marketing', 'no-reply@'],
  },
};

// VIP senders — always escalated to P1 or P2 regardless of keywords
const VIP_SENDERS = [
  'darrel',
  'rotationtv1@gmail.com',
  'nicksmiley83@gmail.com',
  'chainstack',
  'stripe.com',
  'supabase.io',
  'github.com',
  'emergent',
  'heygen',
  'cloudflare',
];

function classifyEmail(subject: string, body: string, from: string): { tier: typeof PRIORITY_TIERS[keyof typeof PRIORITY_TIERS]; matchedKeywords: string[] } {
  const combined = `${subject} ${body} ${from}`.toLowerCase();

  // VIP sender check — auto-elevate
  const isVIP = VIP_SENDERS.some((v) => combined.includes(v.toLowerCase()));

  let bestTier = PRIORITY_TIERS.P9_INFO;
  let matchedKeywords: string[] = [];

  for (const [, tier] of Object.entries(PRIORITY_TIERS)) {
    const matches = tier.keywords.filter((kw) => combined.includes(kw.toLowerCase()));
    if (matches.length > 0 && tier.level < bestTier.level) {
      bestTier = tier;
      matchedKeywords = matches;
    }
  }

  // VIP sender with no specific tier → elevate to P4 minimum
  if (isVIP && bestTier.level > 4) {
    bestTier = PRIORITY_TIERS.P4_BUSINESS;
    matchedKeywords = ['vip_sender'];
  }

  return { tier: bestTier, matchedKeywords };
}

function decodeBase64(str: string): string {
  try {
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return decoded;
  } catch {
    return '';
  }
}

function extractEmailBody(payload: any): string {
  let body = '';

  if (payload.body?.data) {
    body = decodeBase64(payload.body.data);
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = decodeBase64(part.body.data);
        break;
      }
      if (part.mimeType === 'text/html' && part.body?.data && !body) {
        body = decodeBase64(part.body.data).replace(/<[^>]*>/g, ' ');
      }
      // Nested parts
      if (part.parts) {
        for (const subPart of part.parts) {
          if (subPart.mimeType === 'text/plain' && subPart.body?.data) {
            body = decodeBase64(subPart.body.data);
            break;
          }
        }
      }
    }
  }

  return body.substring(0, 800); // cap at 800 chars for routing
}

async function sendSlackAlert(webhookUrl: string, email: any, tier: any, keywords: string[]) {
  if (!webhookUrl) return false;
  try {
    const payload = {
      text: `${tier.emoji} *RotationTV Gmail Alert — ${tier.label}*`,
      attachments: [
        {
          color: `#${tier.color.toString(16).padStart(6, '0')}`,
          fields: [
            { title: 'Subject', value: email.subject, short: false },
            { title: 'From', value: email.from, short: true },
            { title: 'Priority', value: tier.label, short: true },
            { title: 'Keywords Detected', value: keywords.join(', '), short: false },
            { title: 'Preview', value: email.snippet, short: false },
          ],
          footer: 'RotationTV Gmail Monitor | Quantum Precision Mode',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendDiscordAlert(webhookUrl: string, email: any, tier: any, keywords: string[]) {
  if (!webhookUrl) return false;
  try {
    const payload = {
      embeds: [
        {
          title: `${tier.emoji} Gmail Alert — ${tier.label}`,
          description: `**${email.subject}**`,
          color: tier.color,
          fields: [
            { name: 'From', value: email.from, inline: true },
            { name: 'Priority', value: tier.label, inline: true },
            { name: 'Keywords', value: keywords.join(', '), inline: false },
            { name: 'Preview', value: email.snippet.substring(0, 200), inline: false },
          ],
          footer: { text: 'RotationTV Gmail Monitor | Quantum Precision Master Mode' },
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const messageIds = body.data?.new_message_ids ?? body.message_ids ?? [];
    if (!messageIds.length) {
      return Response.json({ ok: true, processed: 0, mode: 'quantum_precision_master' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL') || '';
    const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL') || '';

    const results = {
      processed: 0,
      alerted: 0,
      noise_filtered: 0,
      by_priority: {} as Record<string, number>,
      response_time_ms: 0,
      emails: [] as any[],
    };

    for (const messageId of messageIds) {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) continue;

      const message = await res.json();
      const headers = message.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
      const from = headers.find((h: any) => h.name === 'From')?.value || '(unknown)';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      const snippet = message.snippet || '';
      const body_text = extractEmailBody(message.payload);

      const { tier, matchedKeywords } = classifyEmail(subject, body_text || snippet, from);

      const emailRecord = {
        messageId,
        subject,
        from,
        date,
        snippet: snippet.substring(0, 200),
        priority_level: tier.level,
        priority_label: tier.label,
        matched_keywords: matchedKeywords,
        is_noise: tier.level >= 10,
      };

      results.processed++;
      results.by_priority[tier.label] = (results.by_priority[tier.label] || 0) + 1;

      if (tier.level >= 10) {
        results.noise_filtered++;
        console.log(`🗑️ NOISE FILTERED: ${subject} | from: ${from}`);
        continue; // Skip noise
      }

      results.emails.push(emailRecord);

      // Only alert P1-P8 to Slack/Discord
      if (tier.level <= 8) {
        results.alerted++;
        console.log(`${tier.emoji} ALERT [${tier.label}]: ${subject} | from: ${from} | keywords: ${matchedKeywords.join(', ')}`);

        // Fire both in parallel
        await Promise.all([
          sendSlackAlert(slackWebhook, emailRecord, tier, matchedKeywords),
          sendDiscordAlert(discordWebhook, emailRecord, tier, matchedKeywords),
        ]);
      } else {
        // P9 INFO — log only, no alert
        console.log(`ℹ️ INFO [${tier.label}]: ${subject} | from: ${from}`);
      }
    }

    results.response_time_ms = Date.now() - startTime;

    console.log(`✅ Quantum Precision Master Mode complete | ${results.processed} processed | ${results.alerted} alerted | ${results.noise_filtered} noise blocked | ${results.response_time_ms}ms`);

    return Response.json({
      ok: true,
      mode: 'quantum_precision_master_v3',
      ...results,
    });
  } catch (error) {
    console.error('Gmail Monitor Error:', error);
    return Response.json({ error: error.message, mode: 'quantum_precision_master_v3' }, { status: 500 });
  }
});
