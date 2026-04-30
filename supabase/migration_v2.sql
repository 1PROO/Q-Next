-- ============================================
-- Migration V2: Subscriptions, Fingerprints, Shop Extensions
-- ============================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'business', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 2. Device fingerprints table (anti-abuse)
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON device_fingerprints(clerk_user_id);

-- 3. Add new columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;

-- 4. Add customer_notes column to queue_entries
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS customer_notes TEXT DEFAULT '';

-- 5. Auto-create free subscription for existing shops
INSERT INTO subscriptions (shop_id, plan, status, started_at)
SELECT id, 'free', 'active', created_at
FROM shops
WHERE id NOT IN (SELECT shop_id FROM subscriptions)
ON CONFLICT DO NOTHING;

-- 6. Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for subscriptions
CREATE POLICY "Anyone can read subscriptions" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- 8. RLS Policies for device_fingerprints
CREATE POLICY "Service role can manage fingerprints" ON device_fingerprints
  FOR ALL USING (true);

-- 9. Function to count total free shops (for the 100 limit)
CREATE OR REPLACE FUNCTION get_free_shops_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM subscriptions WHERE plan = 'free' AND status = 'active';
$$ LANGUAGE SQL STABLE;
