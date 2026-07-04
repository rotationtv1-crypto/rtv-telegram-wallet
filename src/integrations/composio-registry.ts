// ============================================================
// RotationTV — Composio Integration Registry
// All connected services + tool slugs + auth patterns
// Used by Mira/Claude/Kimi for cross-app automation
// ============================================================

export const RTV_INTEGRATIONS = {
  // ── Active Connections ──
  github: {
    accounts: [
      { id: 'github_adroit-shend', login: 'rotationtv1-crypto', alias: 'primary', status: 'ACTIVE' },
      { id: 'github_bahuma-tuke', login: 'rotationtv1-crypto', alias: 'secondary', status: 'ACTIVE' },
    ],
    repos: ['rtv-telegram-wallet'],
    toolSlugs: {
      createFile: 'GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS',
      getContents: 'GITHUB_GET_REPOSITORY_CONTENT',
      getTree: 'GITHUB_GET_A_TREE',
      searchCode: 'GITHUB_SEARCH_CODE',
      createIssue: 'GITHUB_CREATE_AN_ISSUE',
      listIssues: 'GITHUB_LIST_ISSUES',
      createPR: 'GITHUB_CREATE_A_PULL_REQUEST',
      getPR: 'GITHUB_GET_A_PULL_REQUEST',
      mergePR: 'GITHUB_MERGE_A_PULL_REQUEST',
    },
  },

  vercel: {
    accounts: [
      { id: 'vercel_epopt-probe', alias: 'production', status: 'ACTIVE' },
      { id: 'vercel_acoin-ninth', alias: 'staging', status: 'ACTIVE' },
      { id: 'vercel_dental-gools', alias: 'development', status: 'ACTIVE' },
    ],
    toolSlugs: {
      deploy: 'VERCEL_CREATE_DEPLOYMENT',
      listDeployments: 'VERCEL_LIST_DEPLOYMENTS',
      getDeployment: 'VERCEL_GET_DEPLOYMENT',
    },
  },

  supabase: {
    accounts: [{ id: 'default', alias: 'primary', status: 'ACTIVE' }],
    projects: {
      main: 'xynkgaxfwvpcixissxdz',  // RTV Ecosystem
      erotica: 'zzybjoowhkwuomnpixuy',  // Rotation Erotica
    },
    toolSlugs: {
      applyMigration: 'SUPABASE_APPLY_MIGRATION',
      getAdvisors: 'SUPABASE_GET_ADVISORS',
      executeSQL: 'SUPABASE_EXECUTE_SQL',
      listTables: 'SUPABASE_LIST_TABLES',
    },
  },

  elevenlabs: {
    accounts: [{ id: 'default', alias: 'primary', status: 'ACTIVE' }],
    toolSlugs: {
      textToSpeech: 'ELEVENLABS_TEXT_TO_SPEECH',
      getVoices: 'ELEVENLABS_GET_VOICES',
    },
  },

  heygen: {
    accounts: [{ id: 'default', alias: 'primary', status: 'ACTIVE' }],
    toolSlugs: {
      createVideo: 'HEYGEN_CREATE_VIDEO',
      getVideo: 'HEYGEN_GET_VIDEO_STATUS',
    },
  },

  // ── Expired — Need Reconnection ──
  expired: {
    googledocs: { status: 'EXPIRED', reconnect: true },
    brevo: { status: 'EXPIRED', reconnect: true },
    googledrive: { status: 'EXPIRED', reconnect: true },
    googlesheets: { status: 'EXPIRED', reconnect: true },
    googlecalendar: { status: 'EXPIRED', reconnect: true },
    canva: { status: 'EXPIRED', reconnect: true },
    gmail: { status: 'EXPIRED', reconnect: true },
  },

  // ── Available (not yet connected) ──
  available: [
    'slack', 'discord', 'notion', 'trello', 'asana', 'airtable',
    'jira', 'linear', 'figma', 'hubspot', 'zoom', 'twitter',
    'linkedin', 'youtube', 'instagram', 'tiktok', 'stripe',
    'shopify', 'twilio', 'sendgrid', 'mailchimp',
  ],
};

// ── Automation Workflows ──

export const RTV_WORKFLOWS = {
  // When a new stream goes live → notify Telegram channel
  streamLive: {
    trigger: 'CLOUDFLARE_STREAM_WEBHOOK',
    event: 'live_connected',
    actions: [
      { tool: 'GITHUB_CREATE_AN_ISSUE', repo: 'rtv-telegram-wallet', title: 'Stream live: {{stream_uid}}' },
    ],
  },

  // When a gift is sent → audit log + creator notification
  giftSent: {
    trigger: 'SUPABASE_INSERT',
    table: 'gift_transactions',
    actions: [
      { tool: 'SUPABASE_EXECUTE_SQL', query: 'SELECT * FROM OmegaAuditLog WHERE action_type = $1' },
    ],
  },

  // Daily token report → Telegram message
  dailyReport: {
    trigger: 'CRON',
    schedule: '0 9 * * 1',  // Monday 9am
    actions: [
      { tool: 'SUPABASE_EXECUTE_SQL', query: 'SELECT * FROM RtvUser WHERE role = $1' },
    ],
  },
};
