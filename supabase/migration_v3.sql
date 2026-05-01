-- ============================================
-- Migration V3: Lifetime Subscription & Customization
-- ============================================

-- 1. Modify subscriptions check constraint to include 'lifetime'
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'starter', 'business', 'premium', 'lifetime'));

-- 2. Add customization columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS qr_code_key TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS qr_updated_at TIMESTAMPTZ;

-- 3. Update existing shops with initial qr_code_key if empty
UPDATE shops SET qr_code_key = gen_random_uuid()::text, qr_updated_at = now() WHERE qr_code_key IS NULL;
