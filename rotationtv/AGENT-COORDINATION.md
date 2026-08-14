# Agent Coordination Protocol — RotationTV Ecosystem

**Purpose:** Multiple AI agents (across sessions, and potentially across
different tools/orchestrators) work on this codebase. This file is the single
source of truth for "who's touching what right now" so agents don't silently
overwrite each other's work. Every agent — this one or any other — should read
this file BEFORE editing anything in this repo, and update it AFTER.

## The Core Rule

**Don't modify a file or feature area that's actively claimed by another agent
unless you've found a confirmed bug or error in it.** If you find a bug in
someone else's claimed work:
1. Don't just silently patch it and move on.
2. Log the bug (what's wrong, evidence) in the "Bug/Override Log" section below.
3. Make the fix, note it in the same log entry, and cite the file(s) changed.
4. This is the ONLY exception to "don't touch another agent's claim." Feature
   changes, refactors, or style opinions on someone else's active work are NOT
   a valid reason to override — only a demonstrable error is.

If a file/area has no active claim, claim it before you start, work, then
release the claim (mark Done) when finished.

## How to Claim

Add a row to the Active Claims table with: your agent/session identifier, the
file(s) or feature area, a one-line task description, start time (UTC), and
status. Keep claims narrow (specific files, not "the whole repo") so agents can
work in parallel without blocking each other unnecessarily.

## Active Claims

| Agent/Session | Files / Area | Task | Started (UTC) | Status |
|---|---|---|---|---|
| Superagent (this session, 2026-07-02) | src/index.ts (8 new routes), src/App.tsx, package.json, wrangler deploy | Full repo audit: fixed broken CI dependency conflict, wired 8 missing frontend↔backend API routes, fixed dead auth-init bug | 2026-07-02 12:00 | ✅ Done — deployed as d3a406e4 (v6.7.0) |

*(Clear completed rows periodically, or move them to the Change History
section below to keep this table readable — don't just delete history.)*

## Bug/Override Log

### 2026-07-03 — Superagent — Flying-gift feature: built real, found + fixed 2 more bugs
**Task:** Build a real, working flying-gift animation for live streams (was pasted
as vanilla HTML/JS by the user — reimplemented as React matching the locked
design system and real backend, since the vanilla version had no working
payment/animation-on-success logic and referenced a nonexistent module).

**New files:** `src/hooks/useStreamRoom.ts` (WebSocket client for the
StreamRoom DO's tip broadcasts — this channel existed on the backend with zero
frontend consumer before now), `src/components/FlyingGift.tsx` (animated gift
overlay, reuses the LOCKED purple/lavender tokens from `LiveHostOverlay.tsx` —
NOT the off-brand cyan `#00d4ff` from the pasted snippet), `src/components/GiftSendBar.tsx`
(only fires success feedback after a confirmed 200 from `/api/stream/tip` —
the pasted version animated/celebrated before knowing if the backend call
succeeded).

**Found while wiring it up — two real bugs, not touched without evidence:**
1. **Two separate, disconnected "watch stream" modals existed.** `App.tsx` had
   its own `activeStream` state + a full-featured modal (`StreamViewer` +
   `AgentChat`), but nothing ever called its `setActiveStream` — grepped the
   whole `src/` tree, zero call sites. `DiscoverScreen.tsx` — the only place
   live streams are actually listed — had its OWN separate `activeStream`
   state and rendered a second, bare-bones modal with no chat and no gift
   sending. Users tapping a stream always hit the incomplete modal; the
   full-featured one was dead code. **Fix:** moved `activeStream` into the
   shared Zustand store (`useStore.ts`), `DiscoverScreen` now sets it there
   instead of keeping local state, removed the duplicate modal.
2. **`deductRtv`/`addRtv` didn't floor at 0** (flagged in the July 2 audit as
   low-priority, fixed now while already in the file) — added `Math.max(0, ...)`.

**Verified:** `npm run build` clean (1945 modules), `wrangler deploy --dry-run`
clean, deployed as version `140585f6`.


Use this when you touched something you didn't originally claim, because you
found it was broken. One entry per override, most recent first.

### 2026-07-02 — Superagent — initUser() never called + stale state ref
**Found:** `App.tsx` destructured `currentStreamId` from the Zustand store,
but it was never defined there — dead reference. Also, `initUser()` (the
function that authenticates the Telegram user) was defined in the store but
never invoked anywhere in the app — meaning nobody could ever actually log in.
**Fix:** Added `useEffect(() => { initUser(); }, [])` to `App.tsx`, removed
the stale `currentStreamId` destructure.
**Evidence:** grepped the entire `src/` tree for `initUser` and `currentStreamId`
usage — zero call sites for the former outside its own definition, zero
definitions for the latter outside the one dead destructure.

### 2026-07-02 — Superagent — CI dependency conflict
**Found:** `npm install` failed cold (ERESOLVE) on every fresh clone/CI run —
`agents@0.17.x` requires zod ^4, `openai@4.104.0` only supports zod ^3.
**Fix:** Bumped `openai` to `^6.45.0` (supports zod v4), pinned `zod` to `^4.0.0`.
**Evidence:** `rm -rf node_modules package-lock.json && npm install` reproduced
the failure before the fix, clean install after. `chat.completions.create()`
API confirmed unchanged v4→v6 by reviewing actual call sites in
`super-agent.ts` / `RTVStreamAgent.ts` before making the bump.

## Change History (completed claims, archived)

*(none yet — this file was just created)*

## Ground Rules for All Agents

1. **Read this file first, every session, before editing rotationtv/.**
2. **Read the code before writing.** Don't assume a feature is broken or
   missing without grepping/checking first — confirm with evidence (a failing
   test, a 404, a grep with zero results) before calling something a bug.
3. **Cite evidence in every override log entry.** "I think this is wrong"
   is not enough — show the failing command, the missing route, the dead
   reference.
4. **Keep locked specs locked.** Design system (colors, fonts, border radius),
   the 6-host AI broadcast grid, the 80/15/5 payout split, and the dual-client
   Supabase pattern are NOT up for reinterpretation by any agent — see
   `docs/SYSTEM-AUDIT-AND-LAUNCH-GUIDE.md` and the project's locked memory
   entries for the frozen specs.
5. **Deploy is a claim too.** Running `wrangler deploy` affects every other
   agent's live testing — note it in Active Claims (or the change history)
   with the version ID, so the next agent knows what's actually running
   without having to re-derive it.
6. **When in doubt, narrow the claim and ship a small, verifiable fix** rather
   than a broad rewrite — smaller diffs are easier for the next agent (human
   or AI) to review against this log.

## Supabase Schema Ground Truth (verified July 4, 2026 — direct REST API query, not assumption)

**Do not trust any AI-generated claim about table names in this project
(xynkgaxfwvpcixissxdz.supabase.co) without verifying against the live schema
first.** This project has been touched by multiple different AI
tools/sessions (this agent, Supabase AI, Claude Code, Manus AI references
found in table names) with zero coordination before this file existed. The
result is a genuinely inconsistent, mixed-convention schema — **76 tables**,
not the ~24 any single migration file implies.

**Confirmed facts (verified by querying `/rest/v1/` directly):**
- Naming convention is MIXED, not uniformly snake_case or PascalCase.
  Examples of tables that exist as PascalCase-ONLY: `AgencyRoster`,
  `AcademyCredit`, `CreatorPayout`, `RotationPay_Ledger`, `Omni_Logs`.
  Examples of tables that exist as snake_case: `creator_payouts`,
  `rtv_wallets`, `payments`, `profiles`, `telegram_bots`, `wallets`.
- **`creator_payouts` and `CreatorPayout` are BOTH real, separate tables.**
  Do not assume one is "the wrong version" of the other — verify which one
  the live worker code (`src/lib/supabase.ts`) actually queries before
  changing either.
- None of this project's own `supabase/migrations/001-005*.sql` files'
  tables (`agencies`, `creators`, `live_streams`, `gifts`, `tips`,
  `pk_battles`, etc.) exist in the live database at all. Those migrations
  were apparently never applied to this specific Supabase project.
- Tables unrelated to RotationTV also exist in this same project
  (`university_enrollments`, `faucet_claims`, `manus_ai_tasks`,
  `sovereign_wallets`) — evidence of a shared/reused Supabase instance.

**Rule going forward:** before writing any SQL, RLS policy, or migration
against this project, query `GET /rest/v1/` (returns the swagger table list)
or `information_schema.tables` first and confirm exact table names/casing.
Never paste-and-run a migration file generated by a different AI session
without this check — it has already produced one false "bug report" (claimed
all tables were PascalCase; verification showed a mix, with some claimed
table names not existing under either casing).

## Bug/Override Log

### 2026-07-04 — CRITICAL: infinite recursion in RLS policy on `profiles`
**Evidence:** Direct REST query with anon key —
`GET /rest/v1/profiles?select=*&limit=1` → HTTP 500,
`{"code":"42P17","message":"infinite recursion detected in policy for relation \"profiles\""}`.
Same error cascades to `payments` and `CreatorPayout` (both HTTP 500, same
error, implying their policies reference `profiles`). Tested directly against
live project xynkgaxfwvpcixissxdz — not simulated, not a claim from another
AI, reproduced by this agent.
**Impact:** Any anon-key request (i.e. real app traffic, unauthenticated or
authenticated via anon+JWT) to `profiles`, `payments`, or `CreatorPayout`
currently 500s. Likely breaks login/profile reads and payment/payout displays
in production right now.
**Status:** NOT YET FIXED. Root cause is almost certainly a self-referencing
policy on `profiles` (a permission check that queries `profiles` from within
its own policy, e.g. an "is admin" lookup). Standard fix is a
`SECURITY DEFINER` helper function to break the recursion — but exact policy
text not yet retrieved (DB password on file does not authenticate; direct
`db.xynkgaxfwvpcixissxdz.supabase.co:5432` unreachable from sandbox, pooler
`aws-1-us-east-1.pooler.supabase.com:6543` reachable but auth failed).
**Next agent:** if you get a working DB password, pull
`SELECT * FROM pg_policies WHERE tablename = 'profiles';` before writing any
fix — don't guess at the policy structure.
