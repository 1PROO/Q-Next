-- ============================================
-- Migration V4: Dynamic Plans, Settings, Messages, Notifications
-- ============================================

-- 1. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
('pricing_page', $json${"title": "اختر الباقة المناسبة لمحلك", "subtitle": "خطط أسعار مرنة تناسب جميع الأنشطة التجارية", "promo_text": "هدية: 30 يوم \"برو\" مجاناً عند التسجيل لأول مرة!", "promo_days": 30}$json$),
('admin_announcement', '{"text": "", "is_active": false}')
ON CONFLICT (key) DO NOTHING;

-- 2. Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER, -- null means lifetime or monthly/yearly if extended
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (slug, name_ar, price, duration_days, features) VALUES
('free', 'مجاني', 0, null, '{"remove_branding": false, "advanced_stats": false, "static_qr": false, "custom_branding": false, "social_links": false, "custom_welcome": false, "queue_announcement": false, "priority_support": false, "export_data": false, "custom_sounds": false}'),
('premium', 'برو (شهري)', 250, 30, '{"remove_branding": true, "advanced_stats": true, "static_qr": true, "custom_branding": true, "social_links": true, "custom_welcome": true, "queue_announcement": true, "priority_support": true, "export_data": true, "custom_sounds": true}'),
('lifetime', 'مدى الحياة', 999, null, '{"remove_branding": true, "advanced_stats": true, "static_qr": true, "custom_branding": true, "social_links": true, "custom_welcome": true, "queue_announcement": true, "priority_support": true, "export_data": true, "custom_sounds": true}')
ON CONFLICT (slug) DO NOTHING;

-- 3. Modify subscriptions table to remove constraints and link to plans
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'gift', 'system'
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON notifications(shop_id);

-- 5. Create messages table (Admin-Shop Chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin', 'shop')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false, -- If admin sends, shop reads. If shop sends, admin reads.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_shop_id ON messages(shop_id);

-- 6. Add last_active_at and other new columns to shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE shops ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "whatsapp": ""}'::jsonb;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS queue_announcement TEXT DEFAULT '';

-- 7. RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- system_settings: anyone can read, admin can manage
CREATE POLICY "Anyone can read system_settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Service role can manage system_settings" ON system_settings FOR ALL USING (true);

-- plans: anyone can read, admin can manage
CREATE POLICY "Anyone can read plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Service role can manage plans" ON plans FOR ALL USING (true);

-- notifications: shop owner can read, admin can manage
CREATE POLICY "Shop owners can read their notifications" ON notifications FOR SELECT USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = (SELECT auth.uid()::text))
);
CREATE POLICY "Service role can manage notifications" ON notifications FOR ALL USING (true);

-- messages: shop owner can read/insert, admin can manage
CREATE POLICY "Shop owners can read their messages" ON messages FOR SELECT USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = (SELECT auth.uid()::text))
);
CREATE POLICY "Shop owners can send messages" ON messages FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM shops WHERE owner_id = (SELECT auth.uid()::text)) AND sender = 'shop'
);
CREATE POLICY "Service role can manage messages" ON messages FOR ALL USING (true);
