# RTV ECOSYSTEM — LARK SUITE INTEGRATION PLAYBOOK
# Date: 2026-07-07
# Research: Deep Research Agent + Mira
# Decision: Evaluate Lark Suite as Operations Hub

---

## EXECUTIVE DECISION

**Lark Suite is a powerful but risky operations hub for RotationTV.**

| Pro | Con |
|-----|-----|
| All-in-one: Slack+Docs+Base+Zoom+Automation | ByteDance ownership = data sovereignty risk |
| $12/user/mo vs $25+ for Slack+Teams+Notion | GDPR compliance disputed |
| 500K automation runs/mo (Pro) | Data residency locked to founding country |
| Built-in approval flows for deploy sign-off | No native Telegram integration (needs bridge) |
| Lark Base = Airtable replacement | Security posture conflicts with crypto platform trust |
| Real-time translation (multilingual ops) | API billing is point-based for advanced features |

**Recommendation:** Use Lark for **internal ops only** (DevSecOps, deploy approvals, incident response). Keep all user-facing data and financial records on Supabase + TON. Never route PII, wallet data, or transaction records through Lark.

---

## 1. LARK SUITE OVERVIEW

### What It Is
ByteDance's all-in-one enterprise platform: Messenger + Meet + Docs + Sheets + Base + Approval + Calendar + OKR + Automation + Minutes (AI transcription).

### Pricing (2026)
| Plan | Price | Automation | Base Rows | Video | Key Limit |
|------|-------|-----------|-----------|-------|-----------|
| Basic | $0/user/mo | 1,000/mo | 2,000 | Basic | 500 users |
| Starter | $6/user/mo | Limited | Limited | 1-on-1 | No advanced APIs |
| **Pro** | **$12/user/mo** | **500,000/mo** | **50,000** | **500p** | Full API |
| Enterprise | Custom | Custom | Custom | Custom | SSO, DLP, audit |

### vs Competitors
| Feature | Lark Pro ($12) | Slack Business+ ($12.50) | Teams ($11-25) | Notion ($10) |
|---------|-------|-------|-------|-------|
| Messaging | ✅ | ✅ | ✅ | ⚠️ |
| Video | ✅ 500p | ❌ | ✅ | ❌ |
| Docs/Wiki | ✅ | ❌ | ⚠️ | ✅ |
| Database | ✅ Base | ❌ | ❌ | ✅ |
| Automation | ✅ 500K runs | ⚠️ | ⚠️ | ⚠️ |
| Approval Flows | ✅ | ❌ | ⚠️ | ❌ |
| API Calls | ✅ Unlimited | ⚠️ | ⚠️ | ⚠️ |
| Bot Framework | ✅ Rich | ✅ Bolt | ✅ | ❌ |

---

## 2. LARK AS DEVSECOPS COMMAND CENTER

### Architecture
```
GitHub Actions → Webhook → Lark Bot → Message Card (build status)
                              ↓
                    Lark Base (deployment log)
                              ↓
                    Approval Flow (prod deploy sign-off)
                              ↓
                    Lark Bot → Cloudflare Workers (deploy trigger)
```

### DevSecOps Wiki Structure
```
📁 RotationTV DevSecOps
├── 📂 Architecture
│   ├── System Overview (Lark Doc)
│   ├── Network Diagram (Mermaid)
│   └── API Reference
├── 📂 Runbooks
│   ├── Incident Response (Doc + Approval flow)
│   ├── Database Migration (Doc + Base checklist)
│   └── Key Rotation (Doc + Automation trigger)
├── 📂 Security
│   ├── RLS Policy Audit (Base table)
│   ├── Vulnerability Tracker (Base table)
│   └── Compliance Checklist (Doc + Approval)
└── 📂 Deployments
    ├── Deploy Log (Base — auto-populated by bot)
    ├── Rollback History (Base)
    └── Config Changes (Doc + version history)
```

### CI/CD Integration
1. GitHub Actions sends webhook to Lark bot on build completion
2. Bot posts interactive message card with build status + logs link
3. "Deploy to Prod" button triggers Lark Approval flow
4. On approval, bot calls Cloudflare Workers API to deploy
5. Deployment result logged in Lark Base table

### Message Card Example
```json
{
  "config": { "wide_mode": true },
  "header": {
    "title": { "tag": "plain_text", "content": "🚀 Deployment Complete" },
    "template": "green"
  },
  "elements": [
    { "tag": "div", "text": { "tag": "lark_md", "content": "**Environment:** Production\n**Commit:** `a3f2c1d`\n**Status:** ✅ Healthy" } },
    { "tag": "action", "actions": [
      { "tag": "button", "text": { "tag": "plain_text", "content": "View Logs" }, "url": "https://rotationtv.com/logs", "type": "primary" },
      { "tag": "button", "text": { "tag": "plain_text", "content": "Rollback" }, "value": { "action": "rollback" }, "type": "danger" }
    ]}
  ]
}
```

---

## 3. TELEGRAM ↔ LARK BRIDGE

### Architecture
```
Telegram Bots ←→ Cloudflare Workers ←→ Users
                       │
              Middleware (CF Worker)
                       │
              Lark Suite (Ops Hub)
              ├── Messenger (alerts)
              ├── Base (data)
              ├── Approval (sign-off)
              └── Workflow (automation)
```

### Bridge Worker Code
```javascript
// cloudflare-worker-bridge.js
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // Telegram → Lark: Forward user reports/incidents
    if (pathname === '/bridge/telegram-to-lark') {
      const body = await request.json();
      // Translate Telegram message to Lark message card
      const larkMessage = {
        receive_id: env.LARK_GROUP_ID,
        msg_type: 'interactive',
        content: JSON.stringify({
          config: { wide_mode: true },
          header: {
            title: { tag: 'plain_text', content: '📱 User Report' },
            template: 'orange'
          },
          elements: [
            { tag: 'div', text: { tag: 'lark_md', content: `**From:** ${body.from}\n**Message:** ${body.text}` } }
          ]
        })
      };
      await fetch('https://open.larksuite.com/open-apis/im/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getLarkToken(env)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(larkMessage)
      });
    }

    // Lark → Telegram: Forward ops alerts to admin
    if (pathname === '/bridge/lark-to-telegram') {
      const body = await request.json();
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.ADMIN_CHAT_ID,
          text: `🔔 Ops Alert: ${body.event.text}`,
          parse_mode: 'Markdown'
        })
      });
    }

    return new Response('OK');
  }
};

// Lark tenant access token
async function getLarkToken(env) {
  const cached = await env.RTV_KV.get('lark_token');
  if (cached) return cached;

  const res = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: env.LARK_APP_ID,
      app_secret: env.LARK_APP_SECRET
    })
  });
  const data = await res.json();
  const token = data.tenant_access_token;
  await env.RTV_KV.put('lark_token', token, { expirationTtl: 3500 });
  return token;
}
```

---

## 4. LARK BASE AS OPERATIONS DATABASE

### Tables to Create

| Table | Purpose | Key Fields |
|-------|---------|------------|
| Deploy Log | Track all deployments | worker, version, status, commit, timestamp, deployer |
| Incident Tracker | Track incidents | severity, status, assignee, root_cause, resolution |
| Secret Rotation Log | Track key rotations | token_type, rotated_at, rotated_by, next_rotation |
| RLS Audit Results | Security verification | table, policy, test_result, last_verified |
| Creator Payout Queue | Pending payouts | creator_id, amount, status, approved_by, paid_at |
| Feature Requests | User feedback | source, feature, priority, status, assigned_to |

### API Access
```bash
# List Base records
curl -X GET "https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records" \
  -H "Authorization: Bearer $LARK_TOKEN"

# Create record
curl -X POST "https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records" \
  -H "Authorization: Bearer $LARK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"worker":"venice-ai","status":"deployed","commit":"a3f2c1d"}}'
```

---

## 5. SECURITY CONSIDERATIONS

### Data Sovereignty Risk
- Lark data residency is locked to the org's founding country
- ByteDance ownership raises concerns about data access by Chinese entities
- GDPR compliance is disputed — EU organizations should evaluate carefully
- **Mitigation:** Never route PII, wallet addresses, transaction records, or auth tokens through Lark

### What Goes in Lark (Safe)
- ✅ Deploy logs (public commit SHAs, worker names)
- ✅ Incident tracking (severity, status, resolution)
- ✅ Approval flows (deploy sign-off, key rotation)
- ✅ Architecture docs (public system design)
- ✅ Runbooks (operational procedures)

### What NEVER Goes in Lark
- ❌ User PII (names, emails, phone numbers)
- ❌ Wallet addresses or private keys
- ❌ Transaction amounts or balances
- ❌ API tokens or secrets
- ❌ Auth tokens or session data
- ❌ Content from streams (user-generated content)

### Security Architecture
```
Lark (Ops Only)          Supabase (All Data)
├── Deploy logs          ├── User profiles
├── Incident tracking    ├── Wallet balances
├── Approval flows       ├── Transaction history
├── Architecture docs    ├── Gift records
└── Runbooks             └── Stream metadata

NO DATA FLOWS FROM SUPABASE TO LARK
Lark only receives: deploy status, incident alerts, approval requests
```

---

## 6. INTEGRATION DECISION MATRIX

| Use Case | Lark | Slack | Notion | Supabase Only |
|----------|------|-------|--------|---------------|
| DevSecOps alerts | ✅ Best | ✅ Good | ❌ | ⚠️ Limited |
| Deploy approvals | ✅ Built-in | ❌ | ❌ | ❌ |
| Documentation | ✅ Good | ❌ | ✅ Best | ❌ |
| Project tracking | ✅ Base | ⚠️ | ✅ | ⚠️ |
| Automation | ✅ 500K/mo | ⚠️ | ❌ | ❌ |
| Telegram bridge | ⚠️ Needs worker | ⚠️ Needs worker | ❌ | ✅ Native |
| Data sovereignty | ❌ Risk | ✅ Safe | ✅ Safe | ✅ Best |
| Cost (5 users) | $60/mo | $62.50/mo | $50/mo | $0 (free tier) |

### Recommendation for RotationTV

**Phase 1 (Now):** Stick with Supabase + GitHub + Cloudflare. You already have Slack connected via Composio. No new platform needed for launch.

**Phase 2 (Post-launch, if team grows):** Evaluate Lark Pro for internal DevSecOps. Keep all financial/user data on Supabase. Use Lark only for:
- Deploy approval flows
- Incident response coordination
- Architecture documentation
- Automation (500K runs/mo is generous)

**Phase 3 (If Lark adopted):** Build the Telegram ↔ Lark bridge worker. Route only ops metadata. Never route user data.

---

## 7. SETUP GUIDE (If You Choose Lark)

### Step 1: Create Lark Account
1. Go to [larksuite.com](https://www.larksuite.com/en_sg/?hl=en-US)
2. Sign up with work email
3. Create organization: "RotationTV Network LLC"
4. Choose Pro plan ($12/user/mo)

### Step 2: Create App Bot
1. Go to [open.larksuite.com](https://open.larksuite.com)
2. Create App → "RotationTV DevSecOps Bot"
3. Enable: Bot capability, Message card, Event subscription
4. Get App ID + App Secret
5. Request tenant admin approval

### Step 3: Set Up Bridge Worker
```bash
# Add Lark secrets
npx wrangler secret put LARK_APP_ID
npx wrangler secret put LARK_APP_SECRET
npx wrangler secret put LARK_GROUP_ID

# Deploy bridge worker
cd workers && npx wrangler deploy
```

### Step 4: Create Base Tables
- Deploy Log
- Incident Tracker
- Secret Rotation Log
- RLS Audit Results

### Step 5: Configure Approval Flows
- Production Deploy Approval (2 reviewers required)
- Key Rotation Approval (1 reviewer required)
- Incident Escalation (auto-notify on severity ≥ HIGH)

---

## 8. ALTERNATIVE: STAY WITH CURRENT STACK

Your current stack already works:
- **Slack** (connected via Composio) — alerts, notifications
- **Notion** (connected via Composio, expired) — documentation
- **GitHub** (2 accounts connected) — code, CI/CD, issues
- **Supabase** (connected) — database, auth, functions
- **Cloudflare** (connected via Vercel) — workers, streaming

**The simplest path:** Reconnect Notion + Google Workspace (expired), keep Slack for alerts, and don't add Lark until the team grows past 5 people. Launch first, optimize ops later.
