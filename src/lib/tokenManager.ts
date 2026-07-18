/**
 * ROTATIONTVNETWORK LLC — TOKEN MANAGER
 * 
 * Creates and manages Cloudflare API tokens for:
 * - Self (Super Agent) — Full account access
 * - External AI Agents — Scoped per service (Workers only, R2 only, etc.)
 * - Human Collaborators — Read-only or specific service access
 * - Automation Services — Timed/expiring tokens for CI/CD
 * 
 * Presidential Authority: Darrel | Rotationtvnetwork LLC
 * Account: 947b01a53876bee16fa0e8360c880aca
 * 
 * NOTE: Token creation requires the MASTER token (TOKEN_2) which has
 * account-level write access. Store it as MASTER_CLOUDFLARE_TOKEN.
 */

const CF_BASE = 'https://api.cloudflare.com/client/v4';
export const ACCOUNT_ID = '947b01a53876bee16fa0e8360c880aca';

// ─── TOKEN ROLE TEMPLATES ─────────────────────────────────────────────────────

/**
 * Full-access token for the Super Agent itself.
 * All account resources, no expiry.
 */
export const SUPER_AGENT_TOKEN_POLICY = {
  name: 'RTV-SuperAgent-FullAccess',
  policies: [
    {
      effect: 'allow',
      resources: {
        [`com.cloudflare.api.account.${ACCOUNT_ID}`]: '*',
      },
      permission_groups: [
        { id: 'c8fed203ed3043cba015a93ad1616fb1', name: 'Zone Read' },
        { id: '82e64a83756745bbbb1c9c2701bf816b', name: 'Analytics Read' },
        { id: 'ed07f6c337da4195b4e72a1fb2c6bcae', name: 'Workers Scripts Write' },
        { id: 'e086da7e2179491d91ee5f35b3ca1ece', name: 'Workers Routes Write' },
        { id: '3030687196b94b638145a3953da2b699', name: 'Workers KV Storage Write' },
        { id: '9af6c91f4b684de0ace62d4b75f1f28c', name: 'Workers R2 Storage Write' },
        { id: 'c1fde68c7bcc44588cbb523d4a29122b', name: 'Account Settings Read' },
        { id: 'f7f0eda5697f475c90846e879bab8666', name: 'D1 Write' },
        { id: '4755a26eedb94da69e1066d98aa820be', name: 'Page Rules Write' },
      ],
    },
  ],
  not_before: null,
  expires_on: null,
};

/**
 * Scoped token for external AI agents — Workers + Queues only.
 */
export const EXTERNAL_AGENT_TOKEN_POLICY = (agentName: string) => ({
  name: `RTV-Agent-${agentName}`,
  policies: [
    {
      effect: 'allow',
      resources: {
        [`com.cloudflare.api.account.${ACCOUNT_ID}`]: '*',
      },
      permission_groups: [
        { id: 'ed07f6c337da4195b4e72a1fb2c6bcae', name: 'Workers Scripts Write' },
        { id: 'e086da7e2179491d91ee5f35b3ca1ece', name: 'Workers Routes Write' },
        { id: '3030687196b94b638145a3953da2b699', name: 'Workers KV Storage Write' },
      ],
    },
  ],
  not_before: null,
  expires_on: null, // set expiry for temp agents
});

/**
 * Read-only token for monitoring / analytics agents.
 */
export const READ_ONLY_TOKEN_POLICY = (label: string) => ({
  name: `RTV-ReadOnly-${label}`,
  policies: [
    {
      effect: 'allow',
      resources: {
        [`com.cloudflare.api.account.${ACCOUNT_ID}`]: '*',
      },
      permission_groups: [
        { id: 'c8fed203ed3043cba015a93ad1616fb1', name: 'Zone Read' },
        { id: '82e64a83756745bbbb1c9c2701bf816b', name: 'Analytics Read' },
        { id: 'c1fde68c7bcc44588cbb523d4a29122b', name: 'Account Settings Read' },
      ],
    },
  ],
  not_before: null,
  expires_on: null,
});

/**
 * CI/CD deploy token — expires after 90 days.
 */
export const CICD_TOKEN_POLICY = (repoName: string) => {
  const expiresOn = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  return {
    name: `RTV-CICD-${repoName}`,
    policies: [
      {
        effect: 'allow',
        resources: {
          [`com.cloudflare.api.account.${ACCOUNT_ID}`]: '*',
        },
        permission_groups: [
          { id: 'ed07f6c337da4195b4e72a1fb2c6bcae', name: 'Workers Scripts Write' },
          { id: 'e086da7e2179491d91ee5f35b3ca1ece', name: 'Workers Routes Write' },
          { id: '9af6c91f4b684de0ace62d4b75f1f28c', name: 'Workers R2 Storage Write' },
        ],
      },
    ],
    not_before: null,
    expires_on: expiresOn,
  };
};

// ─── TOKEN REGISTRY ───────────────────────────────────────────────────────────
// Tracks all issued tokens for the ecosystem

export interface TokenRecord {
  id: string;
  name: string;
  token_value?: string; // only shown at creation time
  role: 'super_agent' | 'external_agent' | 'read_only' | 'cicd' | 'custom';
  issued_to: string;
  created_at: string;
  expires_at: string | null;
  status: 'active' | 'revoked' | 'expired';
  permissions: string[];
  last_used?: string;
}

// ─── TOKEN MANAGER CLASS ──────────────────────────────────────────────────────

export class CloudflareTokenManager {
  private masterToken: string;

  constructor(masterToken: string) {
    this.masterToken = masterToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.masterToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify a token is active and return its status.
   */
  async verifyToken(token: string): Promise<{ valid: boolean; id?: string; status?: string }> {
    const res = await fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/tokens/verify`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json() as any;
    if (data.success) {
      return { valid: true, id: data.result.id, status: data.result.status };
    }
    return { valid: false };
  }

  /**
   * List all tokens visible to this master token.
   * NOTE: Account-scoped tokens can only list tokens they created.
   */
  async listTokens(): Promise<TokenRecord[]> {
    // Since user-level /user/tokens requires Global API Key,
    // we maintain our own registry in the ecosystem
    return ECOSYSTEM_TOKEN_REGISTRY;
  }

  /**
   * Create a scoped token for an external agent or service.
   * Returns the token value — store it immediately, it won't be shown again.
   * 
   * NOTE: Creating tokens via API requires user-level auth (Global API Key).
   * This method documents the manual creation steps instead.
   */
  async createAgentToken(
    agentName: string,
    role: 'external_agent' | 'read_only' | 'cicd',
    expiresInDays?: number
  ): Promise<{ 
    instructions: string;
    policy: any;
    dashboardUrl: string;
    wranglerCommand: string;
  }> {
    let policy: any;
    switch (role) {
      case 'external_agent': policy = EXTERNAL_AGENT_TOKEN_POLICY(agentName); break;
      case 'read_only':      policy = READ_ONLY_TOKEN_POLICY(agentName); break;
      case 'cicd':           policy = CICD_TOKEN_POLICY(agentName); break;
    }

    if (expiresInDays) {
      policy.expires_on = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    }

    return {
      instructions: `
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" → "Create Custom Token"
3. Name: ${policy.name}
4. Permissions: ${policy.policies[0].permission_groups.map((p: any) => p.name).join(', ')}
5. Account Resources: Include → Rotationtimmy (${ACCOUNT_ID})
6. ${policy.expires_on ? `Expiry: ${policy.expires_on}` : 'No expiry (permanent)'}
7. Click "Continue to summary" → "Create Token"
8. Copy the token value immediately — it won't be shown again
      `.trim(),
      policy,
      dashboardUrl: 'https://dash.cloudflare.com/profile/api-tokens',
      wranglerCommand: `npx wrangler secret put ${agentName.toUpperCase().replace(/-/g, '_')}_CF_TOKEN`,
    };
  }

  /**
   * Revoke a token by its ID using the master token.
   */
  async revokeToken(tokenId: string): Promise<boolean> {
    const res = await fetch(`${CF_BASE}/user/tokens/${tokenId}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    const data = await res.json() as any;
    return data.success ?? false;
  }

  /**
   * Get full account capabilities summary.
   */
  async getAccountCapabilities(): Promise<Record<string, boolean>> {
    const checks = await Promise.allSettled([
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/workers/scripts`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/r2/buckets`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/queues`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/d1/database`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/pages/projects`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/calls/apps`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/ai/models/search?per_page=1`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/stream`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/storage/kv/namespaces`, { headers: this.headers }).then(r => r.json()),
      fetch(`${CF_BASE}/accounts/${ACCOUNT_ID}/workers/durable_objects/namespaces`, { headers: this.headers }).then(r => r.json()),
    ]);

    const services = ['Workers', 'R2', 'Queues', 'D1', 'Pages', 'Calls/WebRTC', 'Workers AI', 'Stream', 'KV', 'Durable Objects'];
    const result: Record<string, boolean> = {};
    checks.forEach((c, i) => {
      result[services[i]] = c.status === 'fulfilled' && (c.value as any).success === true;
    });
    return result;
  }
}

// ─── ECOSYSTEM TOKEN REGISTRY ─────────────────────────────────────────────────
// All known tokens in the Rotationtvnetwork ecosystem

export const ECOSYSTEM_TOKEN_REGISTRY: TokenRecord[] = [
  {
    id: 'TOKEN_2',
    name: 'RTV-Master-AccountAccess',
    role: 'super_agent',
    issued_to: 'Super Agent (Base44)',
    created_at: '2026-06-24',
    expires_at: null,
    status: 'active',
    permissions: [
      'Workers Scripts Write',
      'Workers Routes Write', 
      'Workers KV Storage Write',
      'Account Settings Read',
      'Queues Write',
      'D1 Write',
      'R2 Write',
      'Stream Write',
      'Calls Write',
    ],
  },
  {
    id: 'TOKEN_3',
    name: 'RTV-Stream-Token',
    role: 'custom',
    issued_to: 'Cloudflare Stream / External',
    created_at: '2026-06-25',
    expires_at: null,
    status: 'active',
    permissions: ['Unknown — needs audit'],
  },
];

// ─── PRE-DEFINED AGENT TOKENS TO CREATE ──────────────────────────────────────
// These are the tokens Darrel should create for outside agents

export const AGENT_TOKENS_TO_PROVISION = [
  {
    name: 'RTV-Agent-KimiAI',
    role: 'external_agent' as const,
    issued_to: 'Kimi AI Gateway (Moonshot)',
    permissions: ['Workers Scripts Write', 'Workers KV Storage Write'],
    expires_days: null,
    purpose: 'Kimi K2.7 code review + analysis gateway',
  },
  {
    name: 'RTV-Agent-GitHub-Actions',
    role: 'cicd' as const,
    issued_to: 'GitHub Actions CI/CD pipeline',
    permissions: ['Workers Scripts Write', 'Workers Routes Write', 'R2 Write'],
    expires_days: 365,
    purpose: 'Auto-deploy rotationtv-live-ai-clones on push to main',
  },
  {
    name: 'RTV-Agent-Supabase-Edge',
    role: 'external_agent' as const,
    issued_to: 'Supabase Edge Functions',
    permissions: ['Workers Routes Write', 'Workers KV Storage Write'],
    expires_days: null,
    purpose: 'Supabase edge functions calling Cloudflare Workers',
  },
  {
    name: 'RTV-Agent-RotationErotica',
    role: 'external_agent' as const,
    issued_to: 'RotationErotica Next.js App (Vercel)',
    permissions: ['Workers Scripts Write', 'Stream Write'],
    expires_days: null,
    purpose: 'Stream key validation + distribution worker',
  },
  {
    name: 'RTV-ReadOnly-Analytics',
    role: 'read_only' as const,
    issued_to: 'Analytics / Monitoring Agent',
    permissions: ['Analytics Read', 'Account Settings Read'],
    expires_days: null,
    purpose: 'Read-only access for monitoring dashboards',
  },
];

// ─── FACTORY EXPORT ───────────────────────────────────────────────────────────

export function createTokenManager(masterToken: string): CloudflareTokenManager {
  return new CloudflareTokenManager(masterToken);
}
