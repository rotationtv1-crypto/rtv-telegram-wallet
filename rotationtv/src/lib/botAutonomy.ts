/**
 * RotationTV — Autonomous Bot Lifecycle Manager
 * 
 * ELIMINATES all manual BotFather interaction after initial token creation.
 * One API call provisions a bot: webhook, menu button, commands, description,
 * health monitoring, auto-recovery, and multi-country routing.
 *
 * Bot API 10.2 methods used:
 * - setWebhook (with secret_token for security)
 * - setChatMenuButton (web_app type)
 * - setMyCommands
 * - setMyName
 * - setMyDescription
 * - setMyShortDescription
 * - getMe (health probe)
 * - getWebhookInfo (monitoring)
 * - deleteWebhook (cleanup)
 * - answerPreCheckoutQuery (Stars payments)
 * - sendMessage (notifications)
 *
 * Entity: Darrel-spell-living-trust
 */

// ─── Types ─────────────────────────────────────────────────────────────

export interface BotConfig {
  token: string;
  name: string;
  username: string;
  category: 'main' | 'erotica' | 'regional' | 'niche' | 'partner';
  miniAppUrl: string;
  webhookPath: string;
  webhookSecret: string;
  commands: BotCommand[];
  menuButton: { text: string; url: string };
  description: string;
  shortDescription: string;
  countries?: string[];
  nsfw?: boolean;
  language?: string;
}

export interface BotCommand {
  command: string;
  description: string;
  is_ephemeral?: boolean;
}

export interface BotHealth {
  token: string;
  username: string;
  alive: boolean;
  webhook_url: string;
  webhook_pending: number;
  webhook_last_error: string | null;
  menu_button: string;
  commands_set: boolean;
  countries: string[];
  category: string;
  last_checked: string;
}

export interface ProvisionResult {
  ok: boolean;
  bot: { id: number; username: string; first_name: string };
  steps: {
    webhook: boolean;
    menu_button: boolean;
    commands: boolean;
    name: boolean;
    description: boolean;
    short_description: boolean;
  };
  errors: string[];
}

// ─── Bot API Base ──────────────────────────────────────────────────────

const API = 'https://api.telegram.org/bot';

async function botCall(token: string, method: string, body: any): Promise<any> {
  const res = await fetch(`${API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || `Bot API ${method} failed`);
  return data.result;
}

// ─── Core: Full Bot Provisioning (one call) ─────────────────────────────

export async function provisionBot(config: BotConfig): Promise<ProvisionResult> {
  const errors: string[] = [];
  const steps = { webhook: false, menu_button: false, commands: false, name: false, description: false, short_description: false };

  // 1. Verify bot exists
  let botInfo: any;
  try {
    botInfo = await botCall(config.token, 'getMe');
  } catch (e: any) {
    return { ok: false, bot: { id: 0, username: config.username, first_name: '' }, steps, errors: [`getMe failed: ${e.message}`] };
  }

  // 2. Set webhook with secret_token
  try {
    const webhookUrl = config.miniAppUrl.replace(/\/$/, '') + config.webhookPath;
    await botCall(config.token, 'setWebhook', {
      url: webhookUrl, secret_token: config.webhookSecret, drop_pending_updates: true,
      allowed_updates: ['message','edited_message','callback_query','pre_checkout_query','shipping_query','successful_payment','chat_member','chat_join_request','my_chat_member'],
      max_connections: 40,
    });
    steps.webhook = true;
  } catch (e: any) { errors.push(`setWebhook: ${e.message}`); }

  // 3. Set menu button
  try {
    await botCall(config.token, 'setChatMenuButton', {
      menu_button: { type: 'web_app', text: config.menuButton.text, web_app: { url: config.menuButton.url } },
    });
    steps.menu_button = true;
  } catch (e: any) { errors.push(`setChatMenuButton: ${e.message}`); }

  // 4. Set commands
  try {
    await botCall(config.token, 'setMyCommands', { commands: config.commands });
    steps.commands = true;
  } catch (e: any) { errors.push(`setMyCommands: ${e.message}`); }

  // 5. Set name
  try { await botCall(config.token, 'setMyName', { name: config.name }); steps.name = true; }
  catch (e: any) { errors.push(`setMyName: ${e.message}`); }

  // 6. Set description
  try { await botCall(config.token, 'setMyDescription', { description: config.description }); steps.description = true; }
  catch (e: any) { errors.push(`setMyDescription: ${e.message}`); }

  // 7. Set short description
  try { await botCall(config.token, 'setMyShortDescription', { short_description: config.shortDescription }); steps.short_description = true; }
  catch (e: any) { errors.push(`setMyShortDescription: ${e.message}`); }

  return { ok: errors.length === 0, bot: { id: botInfo.id, username: botInfo.username, first_name: botInfo.first_name }, steps, errors };
}

// ─── Health Probe ──────────────────────────────────────────────────────

export async function probeBot(token: string, meta?: Partial<BotConfig>): Promise<BotHealth> {
  let alive = false; let username = meta?.username || 'unknown';
  let webhookUrl = 'none'; let webhookPending = 0; let webhookLastError: string | null = null;
  let menuButton = 'unknown'; let commandsSet = false;

  try { const me = await botCall(token, 'getMe'); alive = true; username = me.username; }
  catch { return { token: '[REDACTED]', username, alive: false, webhook_url: 'none', webhook_pending: 0, webhook_last_error: 'Bot token invalid or revoked', menu_button: 'unknown', commands_set: false, countries: meta?.countries || [], category: meta?.category || 'unknown', last_checked: new Date().toISOString() }; }

  try { const wh = await botCall(token, 'getWebhookInfo'); webhookUrl = wh.url || 'none'; webhookPending = wh.pending_update_count || 0; webhookLastError = wh.last_error_message || null; }
  catch (e: any) { webhookLastError = e.message; }

  try { const mb = await botCall(token, 'getChatMenuButton'); menuButton = mb?.type || 'default'; } catch { menuButton = 'error'; }
  try { const cmds = await botCall(token, 'getMyCommands'); commandsSet = Array.isArray(cmds) && cmds.length > 0; } catch { commandsSet = false; }

  return { token: '[REDACTED]', username, alive, webhook_url: webhookUrl, webhook_pending: webhookPending, webhook_last_error: webhookLastError, menu_button: menuButton, commands_set: commandsSet, countries: meta?.countries || [], category: meta?.category || 'unknown', last_checked: new Date().toISOString() };
}

// ─── Auto-Recovery ─────────────────────────────────────────────────────

export async function autoRecoverBot(config: BotConfig): Promise<{ recovered: boolean; actions: string[] }> {
  const actions: string[] = [];
  const health = await probeBot(config.token, config);
  if (!health.alive) return { recovered: false, actions: ['Bot token is dead — cannot recover'] };

  if (health.webhook_url === 'none' || health.webhook_last_error) {
    try {
      const webhookUrl = config.miniAppUrl.replace(/\/$/, '') + config.webhookPath;
      await botCall(config.token, 'setWebhook', { url: webhookUrl, secret_token: config.webhookSecret, drop_pending_updates: true });
      actions.push(`webhook repaired → ${webhookUrl}`);
    } catch (e: any) { actions.push(`webhook repair failed: ${e.message}`); }
  }

  if (health.menu_button !== 'web_app') {
    try { await botCall(config.token, 'setChatMenuButton', { menu_button: { type: 'web_app', text: config.menuButton.text, web_app: { url: config.menuButton.url } } }); actions.push(`menu button restored → ${config.menuButton.text}`); }
    catch (e: any) { actions.push(`menu button repair failed: ${e.message}`); }
  }

  if (!health.commands_set) {
    try { await botCall(config.token, 'setMyCommands', { commands: config.commands }); actions.push(`commands restored (${config.commands.length} commands)`); }
    catch (e: any) { actions.push(`commands repair failed: ${e.message}`); }
  }

  if (health.webhook_pending > 10) {
    try { await botCall(config.token, 'deleteWebhook', { drop_pending_updates: true }); const webhookUrl = config.miniAppUrl.replace(/\/$/, '') + config.webhookPath; await botCall(config.token, 'setWebhook', { url: webhookUrl, secret_token: config.webhookSecret }); actions.push(`cleared ${health.webhook_pending} pending updates`); }
    catch (e: any) { actions.push(`pending cleanup failed: ${e.message}`); }
  }

  return { recovered: actions.length > 0, actions: actions.length > 0 ? actions : ['No issues found — bot is healthy'] };
}

// ─── Multi-Country Bot Templates ──────────────────────────────────────

export const REGIONAL_BOT_TEMPLATES: Record<string, Omit<BotConfig, 'token' | 'username' | 'miniAppUrl' | 'webhookSecret'>> = {
  main: {
    name: 'RotationTV Network', category: 'main', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Open RotationTV Mini App'},{command:'live',description:'Go live — start streaming'},{command:'discover',description:'Browse live streams'},{command:'wallet',description:'View your Stars balance'},{command:'stars',description:'Buy Telegram Stars'},{command:'help',description:'Get help'}],
    menuButton: { text: '🔴 RotationTV Live', url: '' },
    description: 'RotationTV Network — Live streaming with AI hosts, Stars payments, and WebRTC broadcasting.',
    shortDescription: 'Live streaming • AI hosts • Stars payments',
    countries: ['US','GB','CA','AU','DE','FR','BR','IN','JP','NG'],
  },
  erotica: {
    name: 'RotationTV Erotica', category: 'erotica', webhookPath: '/telegram/erotica/webhook',
    commands: [{command:'start',description:'Open Rotation Erotica Mini App'},{command:'live',description:'Go live — start streaming'},{command:'discover',description:'Browse live streams'},{command:'wallet',description:'View your Stars balance'},{command:'help',description:'Get help'}],
    menuButton: { text: '🔴 Rotation Erotica', url: '' },
    description: 'RotationTV Erotica — 18+ live streaming with AI hosts and Stars payments.',
    shortDescription: '18+ Live streaming • AI hosts • Stars',
    countries: ['US','GB','CA','AU','DE','FR','BR','NL','ES','IT'], nsfw: true,
  },
  regional_us: {
    name: 'RotationTV US', category: 'regional', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Open RotationTV US'},{command:'live',description:'Go live'},{command:'discover',description:'Browse streams'},{command:'wallet',description:'Stars balance'},{command:'help',description:'Help'}],
    menuButton: { text: '🔴 RotationTV US', url: '' },
    description: 'RotationTV US — American live streaming with AI hosts.',
    shortDescription: 'US Live streaming • AI hosts', countries: ['US'], language: 'en',
  },
  regional_eu: {
    name: 'RotationTV Europe', category: 'regional', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Open RotationTV Europe'},{command:'live',description:'Go live'},{command:'discover',description:'Browse streams'},{command:'wallet',description:'Stars balance'},{command:'help',description:'Help'}],
    menuButton: { text: '🔴 RotationTV EU', url: '' },
    description: 'RotationTV Europe — European live streaming with AI hosts.',
    shortDescription: 'EU Live streaming • AI hosts', countries: ['GB','DE','FR','ES','IT','NL','SE','NO','DK','FI'], language: 'en',
  },
  regional_latam: {
    name: 'RotationTV Latino', category: 'regional', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Abrir RotationTV Latino'},{command:'live',description:'Transmitir en vivo'},{command:'discover',description:'Explorar transmisiones'},{command:'wallet',description:'Saldo de Stars'},{command:'help',description:'Ayuda'}],
    menuButton: { text: '🔴 RotationTV Latino', url: '' },
    description: 'RotationTV Latino — Transmisiones en vivo con presentadores de IA.',
    shortDescription: 'Latino Live streaming • IA hosts', countries: ['BR','MX','AR','CO','CL','PE','VE','EC','UY','PY'], language: 'es',
  },
  regional_africa: {
    name: 'RotationTV Africa', category: 'regional', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Open RotationTV Africa'},{command:'live',description:'Go live'},{command:'discover',description:'Browse streams'},{command:'wallet',description:'Stars balance'},{command:'help',description:'Help'}],
    menuButton: { text: '🔴 RotationTV Africa', url: '' },
    description: 'RotationTV Africa — African live streaming with AI hosts.',
    shortDescription: 'Africa Live streaming • AI hosts', countries: ['NG','ZA','KE','GH','EG','MA','ET','TZ','UG','CM'], language: 'en',
  },
  regional_asia: {
    name: 'RotationTV Asia', category: 'regional', webhookPath: '/telegram/webhook',
    commands: [{command:'start',description:'Open RotationTV Asia'},{command:'live',description:'Go live'},{command:'discover',description:'Browse streams'},{command:'wallet',description:'Stars balance'},{command:'help',description:'Help'}],
    menuButton: { text: '🔴 RotationTV Asia', url: '' },
    description: 'RotationTV Asia — Asian live streaming with AI hosts.',
    shortDescription: 'Asia Live streaming • AI hosts', countries: ['JP','KR','IN','ID','TH','VN','PH','MY','SG','HK'], language: 'en',
  },
};

// ─── Provision from Template ───────────────────────────────────────────

export async function provisionFromTemplate(
  template: string, token: string, miniAppUrl: string, webhookSecret: string, username: string
): Promise<ProvisionResult> {
  const tmpl = REGIONAL_BOT_TEMPLATES[template];
  if (!tmpl) return { ok: false, bot: {id:0,username,first_name:''}, steps: {webhook:false,menu_button:false,commands:false,name:false,description:false,short_description:false}, errors: [`Template "${template}" not found`] };
  const config: BotConfig = { ...tmpl, token, username, miniAppUrl, webhookSecret, menuButton: { text: tmpl.menuButton.text, url: miniAppUrl + (tmpl.nsfw ? '?bot=erotica' : '') } };
  return provisionBot(config);
}

// ─── Fleet Operations ──────────────────────────────────────────────────

export async function probeFleet(bots: Array<{ token: string; meta?: Partial<BotConfig> }>): Promise<BotHealth[]> {
  return Promise.all(bots.map((b) => probeBot(b.token, b.meta)));
}

export async function recoverFleet(bots: BotConfig[]): Promise<Array<{ username: string; recovered: boolean; actions: string[] }>> {
  return Promise.all(bots.map(async (b) => { const r = await autoRecoverBot(b); return { username: b.username, ...r }; }));
}

export async function autoApproveStarsPayment(token: string, preCheckoutQueryId: string, ok: boolean = true, errorMessage?: string): Promise<boolean> {
  try { await botCall(token, 'answerPreCheckoutQuery', { pre_checkout_query_id: preCheckoutQueryId, ok, error_message: errorMessage }); return true; } catch { return false; }
}

export async function broadcastToBots(tokens: string[], chatId: string, message: string): Promise<Array<{ token: string; sent: boolean; error?: string }>> {
  return Promise.all(tokens.map(async (token) => { try { await botCall(token, 'sendMessage', { chat_id: chatId, text: message, parse_mode: 'HTML' }); return { token: '[REDACTED]', sent: true }; } catch (e: any) { return { token: '[REDACTED]', sent: false, error: e.message }; } }));
}
