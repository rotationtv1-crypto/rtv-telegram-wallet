# RTV ECOSYSTEM — COMPLETE LAUNCH PLAYBOOK v6
# Date: 2026-07-07 — LAUNCH DAY
# Consolidated: Mira + Kimi + Claude + Deep Research
# Status: $RTV Jetton DEPLOYED on TON Mainnet

---

## 🚀 LAUNCH STATUS

| Component | Status | Action |
|-----------|--------|--------|
| $RTV Jetton (TON Mainnet) | ✅ COMPLETE | — |
| STON.fi Listing | 🟡 IN PROGRESS | Add LP via Stonks Bot |
| DeDust Listing | 🟡 IN PROGRESS | Add LP at app.dedust.io |
| RotationPay Mini App | 🟡 IN PROGRESS | Domain live at rotationpay.online |
| BotFather Setup | 🟡 IN PROGRESS | Configure 4 bots |
| TON Connect 2.0 | 🟡 IN PROGRESS | SDK integration |
| Venice AI Gateway | ✅ Deployed (200) | BLOCKER: Credits $0 |
| Security Hardening | ✅ LIVE | 3 critical bugs fixed |
| CI/CD Pipeline | ✅ Pushed | Wire GitHub Actions secrets |

---

## 1. STON.fi DEX Listing (5 minutes)

### Seed Liquidity Path
1. Open [Stonks Bot](https://t.me/stonks_bot) on Telegram
2. Select your $RTV jetton address
3. Provide LP from wallet + **4 TON** deployment fee
4. If initial LP ≥ 11 TON → token appears in **StonksGemBot** for visibility
5. Set taxes (max 30%), holder/creator reward splits, burn %
6. Enable anti-sniper measures (first 30 min)

### Virtual Liquidity Path (cheaper)
- Simulates 500 TON LP for only **3.2 TON** cost
- Trading is instant; contract mirrors pricing as if 500 TON LP
- Good for initial price discovery before adding real LP

### Fee Structure
- 0.3% swap fee — 0.2% to LP providers, 0.1% to STON.fi
- Launchpad tokens: 5% of total tax goes to launchpad

**→ DO THIS NOW: Open Stonks Bot, add LP for $RTV**

---

## 2. DeDust DEX Listing (5 minutes)

1. Go to [app.dedust.io](https://app.dedust.io)
2. Connect TON wallet
3. Create pool: $RTV/TON pair
4. Deposit both sides (jetton + TON), set ratio
5. Pool activates immediately

### Fee Structure
- 0.3% swap fee — **0.25% to LP providers** (better than STON.fi)
- 0.05% to protocol
- ~0.01–0.05 TON network fees per swap

**→ DO THIS AFTER STON.fi: Add DeDust pool for LP-provider-friendly economics**

---

## 3. RotationPay Telegram Mini App

### Architecture
```
rotationpay.online (domain LIVE)
    │
    ├── TON Connect 2.0 SDK
    │   ├── @tonconnect/sdk (npm)
    │   ├── Bridge: https://bridge.tonapi.io/bridge
    │   └── Manifest: /tonconnect-manifest.json
    │
    ├── Telegram WebApp SDK
    │   ├── Telegram.WebApp.ready()
    │   ├── MainButton for CTAs
    │   ├── HapticFeedback for interactions
    │   └── themeParams for dynamic theming
    │
    ├── Payment Rails
    │   ├── TON Connect → on-chain $RTV transfers
    │   ├── Telegram Stars → fiat purchases (30% platform cut)
    │   └── RotationPay internal ledger (Supabase)
    │
    └── Supabase Backend
        ├── Auth: telegram-auth-bridge Edge Function
        ├── RLS: Per-user data access
        └── Functions: transfer_rtv (service role only)
```

### TON Connect 2.0 Integration
```javascript
import { TonConnect } from '@tonconnect/sdk';

const connector = new TonConnect({
  manifestUrl: 'https://rotationpay.online/tonconnect-manifest.json'
});

// Connect wallet
const url = connector.connect({
  bridgeUrl: 'https://bridge.tonapi.io/bridge',
  universalLink: 'https://app.ton.space/ton-connect'
});

// Send $RTV transfer
const transaction = {
  validUntil: Math.floor(Date.now() / 1000) + 600,
  messages: [{
    address: "UQ...recipient",
    amount: "100000000",  // 0.1 TON for gas
    payload: {
      token: "jetton:EQ...$RTV_address",
      amount: "500000000"  // 0.5 $RTV
    }
  }]
};

await connector.sendTransaction(transaction);
```

### Manifest (host at rotationpay.online/tonconnect-manifest.json)
```json
{
  "url": "https://rotationpay.online",
  "name": "RotationPay",
  "iconUrl": "https://rotationpay.online/icon.png"
}
```

### WebApp SDK Checklist
- ✅ `viewport` meta: `width=device-width`
- ✅ CSP headers: allow `tonconnect://` and `https://app.ton.space`
- ✅ `Telegram.WebApp.ready()` after DOM load
- ✅ `Telegram.WebApp.MainButton` for primary CTA
- ✅ `Telegram.WebApp.HapticFeedback` for interactions
- ✅ `Telegram.WebApp.BackButton` for navigation
- ✅ `Telegram.WebApp.enableClosingConfirmation()`
- ✅ `Telegram.WebApp.expand()` on first interaction

---

## 4. BotFather Setup (4 Bots)

### Bot 1: @Rotationtv_Bot (Main)
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
```

### Bot 2: @Rotationwindows_bot (Windows 7 Simulator)
```
/setdescription → "RotationTV Windows 7 — Retro desktop simulator in Telegram"
/setabouttext → "Experience a fully interactive Windows 7 desktop right in Telegram."
/setcommands →
  start - Launch Windows 7
  apps - Open applications
  help - Controls & FAQ
```

### Bot 3: @Rotationtvnetwork_bot (Admin/DevSecOps)
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

### Bot 4: @RotationtvErotica_Bot (Avatar Designer)
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
```

### Webhook Configuration (Cloudflare Workers)
```bash
# For each bot:
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<WORKER>.<ACCOUNT>.workers.dev/webhook/<BOT>",
    "allowed_updates": ["message","callback_query","inline_query"],
    "secret_token": "<HMAC_SECRET>"
  }'
```

---

## 5. Venice AI — Activate the AI Brain

### Current Status
- Gateway: ✅ Deployed, returns 200
- API Keys: 3 saved (fallback rotation)
- Ecosystem JSON: 9,831 chars, 22 sections synced
- Model catalog: 90 models mapped, 9 curated for RTV

### BLOCKER: Credits at $0
**Fix:** Go to [venice.ai/settings/api](https://venice.ai/settings/api) → Add balance

### Pricing
| Model | Type | Price |
|-------|------|-------|
| z-image-turbo | Image (uncensored) | **$0.01/image** |
| z-image | Image (standard) | $0.02/image |
| Text models | LLM (uncensored) | $0.01–$0.06/1K tokens |

### What Happens When You Pay
1. Venice credits hit → API returns 200
2. Sync script auto-fires
3. Full ecosystem data sent to Venice memory
4. All 6 gateway actions go live: chat, moderate, coach, review, health, models
5. Avatar generation ($0.01/image) = ACTIVE

---

## 6. Security — Go/No-Go Checklist

### Pre-Deploy (BLOCKERS)
- [ ] All 14+ exposed tokens revoked via @BotFather
- [ ] New tokens set via `npx wrangler secret put <KEY>`
- [ ] `scripts/verify-rotation-erotica.sh` passes all 6 tests
- [ ] `scripts/verify-deploy.sh` passes all 5 phases
- [ ] GitHub Actions secrets configured (5 secrets)
- [ ] Branch protection enabled on `main`

### Verified Fixes (Claude — LIVE)
| Bug | Fix | Verified |
|-----|-----|----------|
| transfer_rtv fund drain | REVOKE + identity guard | ✅ pg_proc confirmed |
| gift_transactions fabrication | DROP INSERT policy | ✅ pg_proc confirmed |
| live_rooms stream_key overwrite | BEFORE UPDATE trigger | ✅ pg_proc confirmed |
| handle_new_user callable by anon | REVOKE FROM PUBLIC | ✅ pg_proc confirmed |
| prune_stale_stream_viewers | REVOKE FROM PUBLIC | ✅ pg_proc confirmed |

---

## 7. Launch Sequence (Execute in Order)

### Phase 1: DEX Listing (10 min)
```bash
# 1. STON.fi — Open Stonks Bot, add LP for $RTV
# 2. DeDust — Go to app.dedust.io, create $RTV/TON pool
```

### Phase 2: Venice AI (2 min)
```bash
# 1. Go to venice.ai/settings/api
# 2. Add credits ($10 minimum recommended)
# 3. Verify: curl -H "Authorization: Bearer $KEY" https://api.venice.ai/api/inference/status
```

### Phase 3: BotFather (15 min)
```bash
# 1. /revoke ALL exposed tokens
# 2. /token → get new tokens
# 3. Configure all 4 bots (descriptions, commands, menu buttons)
# 4. Set webhooks for all 4 bots
```

### Phase 4: Deploy Workers (10 min)
```bash
# 1. Set secrets via CLI
npx wrangler secret put VENICE_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put SUPABASE_ANON_KEY

# 2. Deploy each worker
cd workers && npm install && npx wrangler deploy
cd ../rtv-edge-gateway && npm install && npx wrangler deploy
cd ../erotica-bot && npm install && npx wrangler deploy
cd ../ai-gateway && npm install && npx wrangler deploy
```

### Phase 5: Verify (5 min)
```bash
# 1. Run verification scripts
chmod +x scripts/verify-rotation-erotica.sh
SUPABASE_ANON_KEY_EROTICA=<key> SUPABASE_SERVICE_KEY_EROTICA=<key> ./scripts/verify-rotation-erotica.sh

chmod +x scripts/verify-deploy.sh
./scripts/verify-deploy.sh

# 2. Test avatar creation
# 3. Test gift send flow
# 4. Test stream create/end
```

### Phase 6: GitHub Actions (5 min)
```bash
# 1. Set 5 repository secrets at:
#    https://github.com/rotationtv1-crypto/rtv-telegram-wallet/settings/secrets/actions
# 2. Enable branch protection on main
# 3. Push test commit → verify pipeline runs
```

---

## 8. Competitive Moat

| Feature | Bigo Live | Tango | LiveMe | **RotationTV** |
|---------|-----------|-------|--------|----------------|
| Payments | Centralized (30-50% cut) | Centralized | Centralized | **On-chain TON (0.3% fee)** |
| Creator Ownership | Platform controls | Platform controls | Platform controls | **$RTV token = creator ownership** |
| Gift Economy | Closed | Closed | Closed | **Open (DEX-tradable $RTV)** |
| AI Integration | Basic filters | None | None | **Venice AI avatars ($0.01)** |
| Wallet | Platform wallet | Platform wallet | Platform wallet | **TON Connect 2.0 (self-custody)** |
| Transparency | Opaque | Opaque | Opaque | **On-chain ledger** |

**The play:** Every other platform takes 30-50% and locks creators in. RotationTV gives creators on-chain $RTV tokens they actually own, trade on DEX, and self-custody via TON Connect. That's the moat.

---

## 9. Post-Launch Monitoring

### Health Checks (automated via CI/CD)
- Secret scan on every push
- Security test suite on every push
- Worker health after every deploy
- RLS enforcement verification

### Manual Checks (first 24h)
- [ ] Monitor STON.fi/DeDust trading volume
- [ ] Watch Supabase logs for RLS violations
- [ ] Check Venice AI credit consumption
- [ ] Monitor Cloudflare Worker error rates
- [ ] Track $RTV token transfers on TON Explorer

---

## 10. File Inventory

| File | Purpose | Status |
|------|---------|--------|
| `RTV_ECOSYSTEM_ARCHITECTURE_v3.md` | Full architecture | ✅ Pushed |
| `TASK_ASSIGNMENTS.md` | Kimi/Claude split | ✅ Pushed |
| `SECRETS_REGISTRY.md` | Secret template | ✅ Pushed |
| `CLAUDE_FETCH_COMMANDS.md` | Claude verification steps | ✅ Pushed |
| `.github/workflows/security-gated-deploy.yml` | CI/CD pipeline | ✅ Pushed |
| `scripts/verify-deploy.sh` | Post-deploy verification | ✅ Pushed |
| `scripts/verify-rotation-erotica.sh` | Erotica go/no-go | ✅ Pushed |
| `tests/security/rotation-erotica.test.ts` | Security test suite | ✅ Pushed |
| `vitest.config.ts` | Test runner config | ✅ Pushed |
| `docs/GITHUB_ACTIONS_SECRETS_SETUP.md` | Secrets setup guide | ✅ Pushed |
| `supabase/migrations-rotation-erotica/20260706_avatar_designer_schema.sql` | Avatar schema | ✅ Pushed |
| `supabase/migrations-rotation-erotica/20260704_security_hardening.sql` | Security fixes | ✅ Pushed |
| `erotica-bot/` | Avatar designer bot | ✅ Pushed |
