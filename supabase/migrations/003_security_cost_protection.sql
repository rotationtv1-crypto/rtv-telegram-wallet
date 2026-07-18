-- ============================================================
-- ROTATIONTVNETWORK LLC — SECURITY + COST PROTECTION SCHEMA
-- Migration: 003_security_cost_protection.sql
-- Presidential Authority: Darrel | 2026
-- ============================================================

-- ── CREATOR RATE LIMITS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_limits (
    creator_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tier          VARCHAR(20) NOT NULL DEFAULT 'basic'
                  CHECK (tier IN ('basic', 'premium', 'agency', 'vip', 'unlimited')),
    daily_limit   INT NOT NULL DEFAULT 1000,   -- in RTV tokens
    used_today    INT NOT NULL DEFAULT 0,
    reset_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_limits_tier ON creator_limits(tier);

-- Auto-reset daily usage at midnight UTC
CREATE OR REPLACE FUNCTION reset_daily_creator_limits()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE creator_limits
    SET used_today = 0,
        reset_at   = NOW() + INTERVAL '1 day',
        updated_at = NOW()
    WHERE reset_at <= NOW();
END;
$$;

-- ── AI SPEND TRACKING (server-side audit log) ─────────────────
CREATE TABLE IF NOT EXISTS ai_spend_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider     VARCHAR(30) NOT NULL  -- venice, kimi, openai, workers_ai
                 CHECK (provider IN ('venice', 'kimi', 'openai', 'workers_ai', 'cloudflare')),
    model        VARCHAR(80) NOT NULL,
    endpoint     VARCHAR(120),
    actor_id     VARCHAR(60),          -- telegram_id or IP
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd     DECIMAL(10,6) NOT NULL DEFAULT 0,
    request_id   VARCHAR(80),
    allowed      BOOLEAN NOT NULL DEFAULT true,
    blocked_reason VARCHAR(200),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_spend_date     ON ai_spend_log(DATE(created_at));
CREATE INDEX idx_ai_spend_provider ON ai_spend_log(provider, DATE(created_at));
CREATE INDEX idx_ai_spend_actor    ON ai_spend_log(actor_id);

-- Daily spend summary view
CREATE OR REPLACE VIEW ai_spend_daily AS
SELECT
    DATE(created_at)   AS day,
    provider,
    COUNT(*)           AS request_count,
    SUM(input_tokens)  AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_usd)      AS total_cost_usd,
    COUNT(*) FILTER (WHERE NOT allowed) AS blocked_count
FROM ai_spend_log
GROUP BY DATE(created_at), provider
ORDER BY day DESC, provider;

-- ── RATE LIMIT LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(60) NOT NULL,  -- IP or telegram_id
    endpoint   VARCHAR(80) NOT NULL,
    hit_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent VARCHAR(200)
);

CREATE INDEX idx_rl_events_identifier ON rate_limit_events(identifier, hit_at);

-- Auto-cleanup: keep only last 7 days
CREATE OR REPLACE FUNCTION cleanup_rate_limit_events()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM rate_limit_events WHERE hit_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ── REQUEST SIGNING LOG ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_audit (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint     VARCHAR(120) NOT NULL,
    method       VARCHAR(10) NOT NULL,
    ip_address   INET,
    actor_id     VARCHAR(60),
    signature    VARCHAR(120),
    valid        BOOLEAN NOT NULL DEFAULT false,
    status_code  SMALLINT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_audit_valid ON request_audit(valid, created_at);
CREATE INDEX idx_request_audit_ip    ON request_audit(ip_address, created_at);

-- ── CIRCUIT BREAKER STATE ─────────────────────────────────────
-- Tracks when a provider circuit is open (too many errors)
CREATE TABLE IF NOT EXISTS circuit_breaker (
    provider        VARCHAR(30) PRIMARY KEY,
    state           VARCHAR(10) NOT NULL DEFAULT 'closed'
                    CHECK (state IN ('closed', 'open', 'half_open')),
    failure_count   INT NOT NULL DEFAULT 0,
    last_failure_at TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ,
    reset_after     TIMESTAMPTZ,  -- when to try half_open
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate providers
INSERT INTO circuit_breaker (provider) VALUES
    ('venice'), ('kimi'), ('openai'), ('workers_ai')
ON CONFLICT (provider) DO NOTHING;

-- ── AGE VERIFICATION BIOMETRIC LOG ───────────────────────────
-- Extended from moderation_log — stores face scan results
CREATE TABLE IF NOT EXISTS age_verification_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id      BIGINT NOT NULL,
    result           JSONB NOT NULL,   -- full FaceAnalysisResult
    age_estimate_min INT,
    age_estimate_max INT,
    is_adult         BOOLEAN NOT NULL DEFAULT false,
    confidence       DECIMAL(4,2),     -- 0.00 - 1.00
    expression       VARCHAR(20),
    liveness         BOOLEAN DEFAULT true,
    passed           BOOLEAN NOT NULL DEFAULT false,
    ip_address       INET,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_age_verify_telegram ON age_verification_log(telegram_id, created_at);
CREATE INDEX idx_age_verify_passed   ON age_verification_log(passed);

-- ── DOMAIN SEGREGATION CONFIG ─────────────────────────────────
CREATE TABLE IF NOT EXISTS domain_config (
    domain       VARCHAR(100) PRIMARY KEY,
    purpose      VARCHAR(50) NOT NULL,   -- creator_dashboard, api, cdn
    environment  VARCHAR(20) NOT NULL DEFAULT 'production',
    cloudflare_protected BOOLEAN NOT NULL DEFAULT true,
    cors_origins TEXT[],                 -- allowed CORS origins
    rate_limit_rps INT DEFAULT 100,      -- requests per second
    active       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO domain_config (domain, purpose, cors_origins, rate_limit_rps) VALUES
    ('app.rotationtv.network',  'creator_dashboard', ARRAY['https://t.me'], 50),
    ('api.rotationtv.network',  'api_endpoints',     ARRAY['https://t.me', 'https://app.rotationtv.network'], 200),
    ('cdn.rotationtv.network',  'content_cdn',       ARRAY['*'], 1000),
    ('rotationtv-live-ai-clones.rotationtimmy.workers.dev', 'workers_dev', ARRAY['*'], 500)
ON CONFLICT (domain) DO NOTHING;

-- ── API KEY ROTATION LOG ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_key_rotation (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider     VARCHAR(30) NOT NULL,
    rotated_by   VARCHAR(60) NOT NULL DEFAULT 'system',
    reason       VARCHAR(200),
    old_key_hint VARCHAR(20),  -- first/last 4 chars only
    new_key_hint VARCHAR(20),
    rotated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS POLICIES ─────────────────────────────────────────────
ALTER TABLE creator_limits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_spend_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_audit          ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker        ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verification_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rotation       ENABLE ROW LEVEL SECURITY;

-- Service role (server-side) has full access
CREATE POLICY "service_full_access" ON creator_limits
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON ai_spend_log
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON rate_limit_events
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON request_audit
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON circuit_breaker
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON age_verification_log
    USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON api_key_rotation
    USING (auth.role() = 'service_role');

-- ── SCHEDULED JOBS (pg_cron — requires extension) ────────────
-- Enable via Supabase dashboard: Extensions → pg_cron
-- SELECT cron.schedule('reset-creator-limits', '0 0 * * *', 'SELECT reset_daily_creator_limits()');
-- SELECT cron.schedule('cleanup-rl-events',    '0 * * * *', 'SELECT cleanup_rate_limit_events()');

COMMENT ON TABLE creator_limits IS 'Per-creator daily AI/tip spend limits by tier';
COMMENT ON TABLE ai_spend_log IS 'Full audit log of every AI API call with cost tracking';
COMMENT ON TABLE circuit_breaker IS 'Provider circuit breaker state — auto-opened on error spikes';
COMMENT ON TABLE age_verification_log IS 'Biometric age verification results from /face command';
COMMENT ON TABLE domain_config IS 'Configured domains with security settings per subdomain';
