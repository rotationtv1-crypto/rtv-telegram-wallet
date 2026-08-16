# SECURITY — Nuclear Git History Secret Scrub

**RotationTV Network LLC | Entity: Darrel-spell-living-trust**

This is the production procedure to permanently remove leaked secrets from **all** git history, branches, and tags.

> **WARNING**: This rewrites history. All collaborators must re-clone after the force-push. Old SHAs become invalid.

## Prerequisites

```bash
# Install git-filter-repo (Python)
pip install git-filter-repo

# Or via package manager
# brew install git-filter-repo   # macOS
```

Ensure you have a clean working tree and that you are the repository owner with force-push rights.

## Step 1 — Build the replacement expressions file

Create `expressions.txt` (NEVER commit this file with real values):

```bash
cat > expressions.txt << 'EOF'
# Format: old_string==>replacement
# Add EVERY known leaked value. Use exact matches.
MY_SECRET_KEY==>REMOVED_SECRET
BOT_TOKEN_HERE==>REMOVED_TOKEN
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==>REMOVED_KIMI_KEY
# Add more lines for every Telegram bot token, Cloudflare token,
# Supabase service key, Stripe key, etc. that ever appeared in history.
EOF
```

**Real values must be obtained from your secret manager / password vault.**  
Do not paste live production keys into chat or commits.

## Step 2 — Nuclear clean (run from a fresh clone)

```bash
# Clone a bare or fresh copy so you do not destroy your working copy accidentally
git clone --mirror https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git rtv-scrub
cd rtv-scrub

# Scrub ALL history, all branches, all tags
git filter-repo --replace-text ../expressions.txt --force

# Verify no remaining matches (example patterns)
git log --all -p | grep -E 'sk-[a-zA-Z0-9]{20,}|[0-9]{8,10}:[A-Za-z0-9_-]{35}' || echo "No obvious Telegram/OpenAI style tokens found"
```

## Step 3 — Force-push cleaned history

```bash
# Point origin back if filter-repo removed it
git remote add origin https://github.com/rotationtv1-crypto/rtv-telegram-wallet.git

# Nuclear push
git push origin --force --all
git push origin --force --tags
```

## Step 4 — Rotate every secret that was ever exposed

After history rewrite, **rotate immediately**:

| Secret | Action |
|--------|--------|
| All `TELEGRAM_BOT_TOKEN_*` | Revoke in @BotFather → generate new → `wrangler secret put` |
| `KIMI_API_KEY` | Rotate on platform.moonshot.ai |
| Cloudflare API tokens | Revoke + create new |
| Supabase service role / anon keys | Rotate in Supabase dashboard |
| Any Stripe / TON / other keys | Rotate |

Update GitHub Actions secrets and Cloudflare Worker secrets.

## Step 5 — Force all collaborators to re-clone

```
Old clones are poisoned. Tell every developer:

git fetch origin
# or simply delete local repo and re-clone
```

## Automated Protection Going Forward

- **Local**: `.pre-commit-config.yaml` (gitleaks + detect-secrets) — run `pre-commit install`
- **CI**: `.github/workflows/security-gated-deploy.yml` already runs `gitleaks/gitleaks-action@v2` on every PR and push to main. Deploy is gated behind the scan.

## Telegram Stars / Cloud SDK Compliance Reminder

- User-facing tips, subscriptions, gifts = **Telegram Stars (XTR) only**
- No re-introduction of RTV token or Stripe PaymentIntent for in-app digital goods
- Multi-bot routing stays behind `botGateway` + `telegramCloudSdk` with isolated tokens
- WebApp and Mini App stay on the same Stars invoice path

## Verification Checklist

- [ ] `git log --all -S 'sk-'` returns nothing sensitive
- [ ] All bot tokens rotated and new values only in secret stores
- [ ] `pre-commit install` run on every developer machine
- [ ] CI gitleaks job is green on main
- [ ] Issue #14 closed after confirmation

*Presidential Authority: Darrel | Rotationtvnetwork LLC | 2026*
