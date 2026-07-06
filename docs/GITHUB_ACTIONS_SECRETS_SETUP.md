# GitHub Actions Secrets — Setup Guide
# Required for: .github/workflows/security-gated-deploy.yml
# Repository: rotationtv1-crypto/rtv-telegram-wallet
# Updated: 2026-07-06

---

## How to Set Secrets

1. Go to: https://github.com/rotationtv1-crypto/rtv-telegram-wallet/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret below

---

## Required Secrets

| Secret Name | Source | How to Get |
|-------------|--------|------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | `https://zzybjoowhkwuomnpixuy.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Copy from API section |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API | Copy from API section (service_role key) |
| `CLOUDFLARE_API_TOKEN` | CF Dashboard → My Profile → API Tokens | Create token with Workers deploy permissions |
| `CLOUDFLARE_ACCOUNT_ID` | CF Dashboard → Overview | Copy from right sidebar |

---

## Branch Protection Rules

1. Go to: https://github.com/rotationtv1-crypto/rtv-telegram-wallet/settings/branches
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Required status checks:
     - `🔍 Secret Scan`
     - `🔧 Type Check`
     - `🔒 Security Tests`
   - ✅ Require signed commits (optional but recommended)
   - ✅ Do not allow force pushes
   - ✅ Do not allow deletions

---

## Verification

After setting secrets + branch protection:

1. Push a test commit to `main`
2. Check Actions tab: https://github.com/rotationtv1-crypto/rtv-telegram-wallet/actions
3. All 6 stages should run in sequence
4. If secret-scan fails → you have exposed credentials in code
5. If security-tests fails → RLS or function ACL is broken

---

## Security Note

**NEVER** set secrets that contain actual token values from chat.
All tokens pasted in chat are compromised — generate NEW ones first:

1. @BotFather → `/revoke` → `/token` for each bot
2. Venice Dashboard → API Keys → Revoke + Create
3. Cloudflare Dashboard → API Tokens → Revoke + Create
4. Supabase Dashboard → Settings → API → Reset keys if needed

Then set the NEW values as GitHub Secrets.
