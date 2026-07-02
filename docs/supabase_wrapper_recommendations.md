# RTV Supabase Wrapper Recommendations
## Priority Install Order for RotationTV Network

## TIER 1 — Install NOW (critical for launch)

### 1. Slack Wrapper
**Why:** Team communications data, channel queries, message search
**Install:** Supabase Dashboard → Integrations → Slack Wrapper → Install
**Config:** Requires Slack Bot Token (already connected via Base44)

### 2. Stripe Wrapper  
**Why:** Direct Stripe data queries from Postgres (separate from Sync Engine)
**Install:** Supabase Dashboard → Integrations → Stripe Wrapper → Install
**Config:** Requires Stripe API key (already have Stripe connected)

### 3. Redis Wrapper
**Why:** Edge caching for hot data (user balances, stream counts, token prices)
**Install:** Supabase Dashboard → Integrations → Redis Wrapper → Install
**Config:** Requires Redis instance URL (can use Upstash free tier)

## TIER 2 — Install for AI Enhancement

### 4. S3 Vectors Wrapper
**Why:** AI embedding storage for semantic search, content recommendations
**Install:** Supabase Dashboard → Integrations → S3 Vectors Wrapper → Install
**Config:** AWS S3 bucket + access keys

### 5. S3 Wrapper
**Why:** Cloud object storage for media assets, NFT metadata
**Install:** Supabase Dashboard → Integrations → S3 Wrapper → Install

## TIER 3 — Install for Growth

### 6. Paddle Wrapper
**Why:** Alternative subscription billing (if Stripe has issues)
**Config:** Requires Paddle API key

### 7. HubSpot Wrapper
**Why:** CRM data sync for B2B sales (RotationCall, White Logistics)
**Config:** Requires HubSpot API key

### 8. Notion Wrapper
**Why:** Internal docs and project management sync
**Config:** Requires Notion integration token

## NOT RECOMMENDED (conflicts with RTV stack)
- Firebase Wrapper — RTV uses Supabase, not Firebase
- Cognito Wrapper — RTV uses Telegram HMAC auth, not AWS Cognito
- MSSQL Wrapper — RTV uses PostgreSQL, not MS SQL
- Snowflake Wrapper — Overkill for current data volume

## MCP SERVER CONFIGURATION

### For Claude Code:
```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=xynkgaxfwvpcixissxdz"
```

### For Base44 Agent:
The MCP server URL can be added to the agent's MCP config at:
`.agents/mcps/config.json`

Add:
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xynkgaxfwvpcixissxdz",
      "transport": "http"
    }
  }
}
```

Then authenticate via:
```bash
claude /mcp
# Select supabase → Authenticate
```

