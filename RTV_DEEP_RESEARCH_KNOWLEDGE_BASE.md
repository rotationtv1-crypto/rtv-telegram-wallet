# RTV ECOSYSTEM — DEEP RESEARCH KNOWLEDGE BASE
# Date: 2026-07-07 — LAUNCH DAY
# Sources: Mira Deep Research Agent + Kimi + Claude + Venice
# Classification: Internal — Launch Operations

---

## EXECUTIVE SUMMARY

$RTV jetton is LIVE on TON Mainnet. STON.fi listing takes 5 minutes via StonksGemBot (seed LP ≥ 11 TON for visibility). DeDust pool adds multi-hop routing + better LP economics (0.25% vs 0.2%). Venice AI z-image-turbo at $0.01/image enables uncensored avatar generation at scale. Bigo Live creators retain 7-13% after platform+agency cuts; RotationTV delivers 85-95% on-chain — a **10x creator-economics advantage**.

---

## 1. STON.fi DEX LISTING — COMPLETE WALKTHROUGH

### Seed Liquidity (Recommended for Launch)
```
@StonksGemBot → /start → "Create Token"
→ Name: RotationTV
→ Symbol: RTV
→ Decimals: 9
→ Select: Seed Liquidity
→ LP amount: 15 TON (above 11 TON threshold = StonksGemBot visibility ✅)
→ Buy tax: 3%
→ Sell tax: 5%
→ Burn: 1% of tax
→ Holder rewards: 2% of tax
→ Creator wallet: 2% of tax
→ Anti-sniper: YES
→ Max buy (first 30 min): 2% of supply
→ Max wallet: 3% of supply
→ Cooldown: 60s between txns
→ Confirm → Pay 15 TON (LP) + 4 TON (fee) = 19 TON
```

### Virtual Liquidity (Fast Launch — 3.2 TON)
- Simulates 500 TON LP for 3.2 TON cost
- Trading instant, algorithmic pricing
- NO anti-sniper available
- Good for price discovery before real LP

### Fee Structure
| Fee | Amount | Destination |
|-----|--------|-------------|
| Swap fee | 0.3% | 0.2% LP / 0.1% STON.fi |
| Tax token fee | 5% of total tax | Launchpad |
| Network fee | ~0.05-0.15 TON | Validators |

### Dual-DEX Strategy
| | STON.fi | DeDust |
|---|---------|--------|
| Priority | 1st — Telegram visibility | 2nd — LP economics |
| LP share | 0.2% | 0.25% |
| Discovery | StonksGemBot | DappRadar, DeDust UI |
| Routing | Direct | Multi-hop |
| Anti-sniper | ✅ | ❌ |

---

## 2. ROTATIONPAY MINI APP — FULL ARCHITECTURE

### TON Connect 2.0 SDK
```bash
npm install @tonconnect/sdk @tonconnect/ui
```

```javascript
import { TonConnect } from '@tonconnect/sdk';

const connector = new TonConnect({
  manifestUrl: 'https://rotationpay.online/tonconnect-manifest.json'
});

// Connect wallet
const connectUrl = connector.connect({
  bridgeUrl: 'https://bridge.tonapi.io/bridge',
  universalLink: 'https://app.ton.space/ton-connect'
});

// In Telegram Mini App — open via deep link
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.openLink(connectUrl);
}

// Session persistence (call on startup)
await connector.restoreConnection();

// Disconnect listener
connector.onStatusChange((walletInfo) => {
  if (!walletInfo) showDisconnectedState();
  else updateWalletDisplay(walletInfo.wallet.address);
});

// Send $RTV jetton transfer
async function sendRTVTip(recipientAddress, amount) {
  const jettonTransferBody = beginCell()
    .storeUint(0xf8a7ea5, 32)        // op: jetton transfer
    .storeUint(0, 64)                // query_id
    .storeCoins(toNano(amount))       // jetton amount
    .storeAddress(Address.parse(recipientAddress))
    .storeAddress(Address.parse(connector.wallet.address))
    .storeUint(0, 64)                // custom payload
    .storeCoins(toNano('0.05'))      // forward_ton_amount
    .storeRef(beginCell()
      .storeUint(0, 32)
      .storeStringTail("RotationTV Tip")
      .endCell())
    .endCell();

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{
      address: "EQ...rtv_jetton_wallet",
      amount: toNano('0.1').toString(),
      payload: jettonTransferBody.toBoc().toString('base64')
    }]
  };

  return await connector.sendTransaction(transaction);
}
```

### Manifest (rotationpay.online/tonconnect-manifest.json)
```json
{
  "url": "https://rotationpay.online",
  "name": "RotationPay",
  "iconUrl": "https://rotationpay.online/icon-192.png",
  "termsOfUseUrl": "https://rotationpay.online/terms",
  "privacyPolicyUrl": "https://rotationpay.online/privacy"
}
```

### WebApp SDK Patterns
```javascript
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();

// Theme
const theme = tg.themeParams;
// bg_color, text_color, button_color, secondary_bg_color

// Main Button
tg.MainButton.setText('SEND TIP');
tg.MainButton.onClick(() => handleTipSend());
tg.MainButton.show();

// Haptic Feedback
tg.HapticFeedback.notificationOccurred('success'); // or 'error', 'warning'
tg.HapticFeedback.impactOccurred('light');          // or 'medium', 'heavy', 'rigid', 'soft'
tg.HapticFeedback.selectionChanged();

// Back Button
tg.BackButton.show();
tg.BackButton.onClick(() => navigateBack());

// Telegram Stars Payments
async function purchaseWithStars(amount) {
  const invoiceLink = await fetch('/api/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ amount, currency: 'XTR' })
  }).then(r => r.json());
  tg.openInvoice(invoiceLink.url);
}
// Note: Telegram takes 30% of Stars revenue
```

### CSP Headers
```
Content-Security-Policy:
  default-src 'self';
  connect-src https://bridge.tonapi.io https://api.ton.space tonconnect:// https://rotationpay.online;
  frame-src https://app.ton.space;
  img-src https: data:;
  script-src 'self' 'unsafe-inline';
```

---

## 3. BOTFATHER SETUP — 4 BOTS

### @Rotationtv_Bot (Main Ecosystem)
```
/setdescription → "RotationTV Network — Stream, Tip, Earn on TON"
/setabouttext → "Your gateway to the RotationTV ecosystem. Stream live, send gifts, earn $RTV."
/setcommands →
  start - Launch RotationTV
  wallet - Connect TON wallet
  balance - Check $RTV balance
  stream - Go live
  gift - Send a gift
  help - Support & FAQ
/setmenubutton → "Open RotationPay" → https://rotationpay.online
/setinline → Enable
```

### @Rotationwindows_bot (Windows 7 Simulator)
```
/setdescription → "RotationTV Windows 7 — Retro desktop simulator in Telegram"
/setabouttext → "Experience a fully interactive Windows 7 desktop right in Telegram."
/setcommands →
  start - Launch Windows 7
  apps - Open applications
  help - Controls & FAQ
```

### @Rotationtvnetwork_bot (Admin DevSecOps)
```
/setdescription → "RotationTV Network Admin — DevSecOps dashboard & ecosystem control"
/setabouttext → "Manage your RotationTV ecosystem infrastructure from Telegram."
/setcommands →
  start - Admin dashboard
  health - System health check
  deploy - Deploy workers
  secrets - Manage secrets
  logs - View recent logs
```

### @RotationtvErotica_Bot (AI Avatar Designer)
```
/setdescription → "AI Avatar Designer — Create cinematic AI portraits"
/setabouttext → "Design your AI avatar with cinematic styles. HBO-quality portraits."
/setcommands →
  start - Welcome
  avatar create - Design your AI avatar
  avatar generate - Quick generate
  feed - Browse avatar feed
  profile - Your collection
  wallet - $RTV balance
  subscribe - Premium tiers
  help - Show commands
/setmenubutton → "Open Avatar Studio" → https://rotationpay.online/avatar
/setinline → Enable
```

### Webhook Configuration
```bash
# For each bot — set webhook to Cloudflare Worker
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<WORKER>.<ACCOUNT>.workers.dev/webhook/<BOT>",
    "allowed_updates": ["message","callback_query","inline_query"],
    "secret_token": "<HMAC_SECRET>"
  }'

# Verify webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Worker Webhook Verification
```javascript
export default {
  async fetch(request, env) {
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secret !== env.WEBHOOK_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }
    const body = await request.json();
    // Route by path: /webhook/main, /webhook/pay, etc.
    return handleUpdate(body, env);
  }
};
```

---

## 4. VENICE AI — PRODUCTION INTEGRATION

### API Endpoints
```bash
# Image generation (z-image-turbo — $0.01/image, uncensored)
curl -X POST https://api.venice.ai/api/inference/image \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "z-image-turbo",
    "prompt": "Cinematic cyberpunk avatar for RotationTV streamer, dramatic lighting",
    "width": 512,
    "height": 512,
    "negative_prompt": "blurry, low quality, watermark"
  }'

# Text generation (uncensored)
curl -X POST https://api.venice.ai/api/inference/chat \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-70b",
    "messages": [{"role": "user", "content": "Moderate this chat message"}],
    "temperature": 0.7
  }'
```

### Pricing
| Model | Type | Price |
|-------|------|-------|
| z-image-turbo | Image (uncensored) | $0.01/image |
| z-image | Image (standard) | $0.02/image |
| llama-3.1-70b | Text (uncensored) | $0.02/1K tokens |
| mistral-large | Text | $0.06/1K tokens |
| Private models | Any | Premium tier |

### Gateway Routing (RTV Use Cases)
| Use Case | Model | Cost |
|----------|-------|------|
| Avatar generation | z-image-turbo | $0.01 |
| Chat moderation | llama-3.1-70b | $0.02/1K |
| Creator coaching | mistral-large | $0.06/1K |
| Content review | gemini-1.5-flash | $0.01/1K |
| Health check | N/A | Free |

### BLOCKER: Credits at $0
**Fix:** Go to [venice.ai/settings/api](https://venice.ai/settings/api) → Add balance
**Recommended:** $10 minimum (1,000 avatar generations or ~500K text tokens)

---

## 5. CLOUDFLARE WORKERS + SUPABASE ARCHITECTURE

### Multi-Bot Router
```javascript
// Single worker handles all 4 bots
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // Webhook routes
    if (pathname === '/webhook/main')    return handleMainBot(request, env);
    if (pathname === '/webhook/pay')     return handlePayBot(request, env);
    if (pathname === '/webhook/stream')  return handleStreamBot(request, env);
    if (pathname === '/webhook/ai')      return handleAIBot(request, env);

    // Mini App
    if (pathname === '/miniapp')         return serveMiniApp(request, env);

    // Streaming
    if (pathname === '/whip')            return handleWHIP(request, env);
    if (pathname === '/whep')            return handleWHEP(request, env);

    // Health
    if (pathname === '/health')          return json({ status: 'ok', version: '1.0.0' });

    return new Response('Not Found', { status: 404 });
  }
};
```

### Supabase Auth Bridge
```javascript
// telegram-auth-bridge Edge Function
// 1. Verify Telegram WebApp initData (HMAC-SHA256)
// 2. Map telegram_user_id → auth_user_id
// 3. Mint Supabase session (access/refresh token)
// 4. Return session to Mini App client

// Worker verification:
async function requireSupabaseUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) return null;
  const user = await res.json();
  return user.id; // auth_user_id
}
```

### KV Rate Limiting (Gift Sends)
```javascript
async function checkRateLimit(userId, env) {
  const key = `rate:gift:${userId}`;
  const count = parseInt(await env.RTV_KV.get(key) || '0');

  if (count >= 10) {
    return { allowed: false, retryAfter: 60 };
  }

  await env.RTV_KV.put(key, String(count + 1), { expirationTtl: 60 });
  return { allowed: true };
}
```

---

## 6. SECURITY HARDENING — VERIFICATION QUERIES

### SQL: Check Function ACLs
```sql
SELECT proname, proacl::text
FROM pg_proc
WHERE proname IN (
  'transfer_rtv',
  'handle_new_user',
  'prune_stale_stream_viewers',
  'protect_live_rooms_stream_columns',
  'like_avatar'
)
ORDER BY proname;
```
**Expected:** Only `postgres` and `service_role` in ACL. No `=X/authenticated` or `=X/anon`.

### SQL: Check RLS Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Expected:** `rowsecurity = true` for ALL tables.

### SQL: Policy Inventory
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
**Expected:** `gift_transactions` has NO INSERT policy. `live_rooms` has row-ownership + column trigger.

### HTTP: transfer_rtv Blocked
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$SUPABASE_URL/rest/v1/rpc/transfer_rtv" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_sender_id":"00000000-0000-0000-0000-000000000000","p_receiver_id":"11111111-1111-1111-1111-111111111111","p_amount_rtv":1000,"p_type":"gift"}'
# Expected: 401 or 403
```

### HTTP: gift_transactions INSERT Blocked
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$SUPABASE_URL/rest/v1/gift_transactions" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sender_id":"00000000-0000-0000-0000-000000000000","receiver_id":"11111111-1111-1111-1111-111111111111","rtv_amount":9999}'
# Expected: 401, 403, or 404
```

---

## 7. COMPETITIVE MOAT — 10X CREATOR ECONOMICS

| Metric | Bigo Live | Tango | LiveMe | **RotationTV** |
|--------|-----------|-------|--------|----------------|
| Platform cut | 30-50% | 30-40% | 30-50% | **0.3% DEX fee** |
| Agency cut | 20-30% | 10-20% | 20-30% | **0% (no agency)** |
| Creator keeps | 7-13% | 30-50% | 7-25% | **85-95%** |
| Wallet | Platform-controlled | Platform | Platform | **Self-custody TON** |
| Gift economy | Closed | Closed | Closed | **Open DEX-tradable** |
| Token ownership | None | None | None | **$RTV on-chain** |
| Transparency | Opaque | Opaque | Opaque | **On-chain ledger** |
| AI integration | Basic filters | None | None | **Venice AI $0.01/img** |
| Withdrawal | 30-60 days | 7-14 days | 30+ days | **Instant (TON)** |

**The pitch:** "Bigo Live creators keep 7 cents of every dollar. RotationTV creators keep 90 cents. Your gifts, your tokens, your wallet. On-chain. Instant withdrawal. Zero platform lock-in."

---

## 8. POST-LAUNCH MONITORING

### Automated (CI/CD)
- Secret scan on every push → blocks deploy if credentials found
- Security test suite (15 tests) → blocks deploy if RLS/ACL broken
- Worker health check after every deploy
- Type check + lint on every push

### Manual (First 24h)
- [ ] Monitor STON.fi trading volume (StonksGemBot)
- [ ] Monitor DeDust pool liquidity
- [ ] Watch Supabase logs for RLS violation attempts
- [ ] Track Venice AI credit consumption rate
- [ ] Monitor Cloudflare Worker error rates (dashboard)
- [ ] Track $RTV transfers on [TON Explorer](https://tonviewer.com)
- [ ] Check GitHub Actions pipeline status
- [ ] Verify all 4 bot webhooks receiving updates

### Key URLs
| Service | URL |
|---------|-----|
| RotationPay | https://rotationpay.online |
| STON.fi | https://app.ston.fi |
| DeDust | https://app.dedust.io |
| TON Explorer | https://tonviewer.com |
| Venice AI | https://venice.ai/settings/api |
| Supabase Main | https://supabase.com/dashboard/project/xynkgaxfwvpcixissxdz |
| Supabase Erotica | https://supabase.com/dashboard/project/zzybjoowhkwuomnpixuy |
| GitHub Actions | https://github.com/rotationtv1-crypto/rtv-telegram-wallet/actions |
| Cloudflare | https://dash.cloudflare.com |

---

## 9. LAUNCH SEQUENCE — EXECUTE IN ORDER

### Phase 1: DEX Listing (10 min)
1. Open @StonksGemBot → Create $RTV pool (seed LP ≥ 11 TON)
2. Go to app.dedust.io → Create $RTV/TON pool

### Phase 2: Venice AI (2 min)
1. Go to venice.ai/settings/api → Add $10+ credits
2. Verify: `curl -H "Authorization: Bearer $KEY" https://api.venice.ai/api/inference/status`

### Phase 3: BotFather (15 min)
1. /revoke ALL exposed tokens
2. /token → get new tokens for all 4 bots
3. Configure descriptions, commands, menu buttons
4. Set webhooks for all 4 bots

### Phase 4: Deploy Workers (10 min)
```bash
npx wrangler secret put VENICE_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put WEBHOOK_SECRET

cd workers && npm install && npx wrangler deploy
cd ../rtv-edge-gateway && npm install && npx wrangler deploy
cd ../erotica-bot && npm install && npx wrangler deploy
cd ../ai-gateway && npm install && npx wrangler deploy
```

### Phase 5: Verify (5 min)
```bash
chmod +x scripts/verify-rotation-erotica.sh
SUPABASE_ANON_KEY_EROTICA=<key> SUPABASE_SERVICE_KEY_EROTICA=<key> ./scripts/verify-rotation-erotica.sh

chmod +x scripts/verify-deploy.sh
./scripts/verify-deploy.sh
```

### Phase 6: GitHub Actions (5 min)
1. Set 5 repository secrets
2. Enable branch protection on main
3. Push test commit → verify pipeline

### Phase 7: Go Live
1. Announce $RTV on STON.fi
2. Open RotationPay Mini App
3. Enable avatar creation
4. Start streaming
5. Monitor everything

---

## 10. FILE INVENTORY

| File | Purpose | Status |
|------|---------|--------|
| RTV_LAUNCH_PLAYBOOK_v6_20260707.md | Launch playbook | ✅ Pushed |
| RTV_ECOSYSTEM_ARCHITECTURE_v3.md | Architecture | ✅ Pushed |
| RTV_DEEP_RESEARCH_KNOWLEDGE_BASE.md | This file | ✅ Pushing |
| TASK_ASSIGNMENTS.md | Agent task split | ✅ Pushed |
| SECRETS_REGISTRY.md | Secret template | ✅ Pushed |
| CLAUDE_FETCH_COMMANDS.md | Claude verification | ✅ Pushed |
| .github/workflows/security-gated-deploy.yml | CI/CD pipeline | ✅ Pushed |
| scripts/verify-deploy.sh | Post-deploy verify | ✅ Pushed |
| scripts/verify-rotation-erotica.sh | Erotica go/no-go | ✅ Pushed |
| tests/security/rotation-erotica.test.ts | Security tests | ✅ Pushed |
| vitest.config.ts | Test runner | ✅ Pushed |
| docs/GITHUB_ACTIONS_SECRETS_SETUP.md | Secrets guide | ✅ Pushed |
