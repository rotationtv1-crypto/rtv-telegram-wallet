# Nuclear Clean — Historical Secret Purge

## Order of operations

1. **Revoke** every exposed key at the provider (BotFather, Venice, Cloudflare, Supabase).
2. Generate **new** keys.
3. Fill `expressions.txt` from `scripts/expressions.example.txt` with **old** values only.
4. Run `scripts/nuclear-clean-history.sh` (force-pushes).
5. Discard all old local clones; re-clone.
6. `npx wrangler secret put ...` for every Worker secret.
7. `pre-commit install` + confirm CI gitleaks is green.

## Permanent protection

- `.pre-commit-config.yaml` — gitleaks + detect-secrets
- `.github/workflows/security-scan.yml` — gitleaks on push/PR
- Never commit `.env`, real tokens, or filled `expressions.txt`

## Telegram / Stars compliance

User-facing tips and subscriptions: **Telegram Stars (XTR) only**.  
Do not reintroduce Stripe PaymentIntent for those paths.
