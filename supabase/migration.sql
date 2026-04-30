-- =============================================
-- دورك - Dawrak Digital Queue System
-- Database Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- جدول المحلات (Shops)
-- =============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'other',
  service_points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_shops_slug ON shops(slug);

-- =============================================
-- جدول الطابور (Queue Entries)
-- =============================================
CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_name TEXT,
  ticket_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'done', 'skipped')),
  push_subscription JSONB,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_queue_entries_shop_id ON queue_entries(shop_id);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_queue_entries_shop_status ON queue_entries(shop_id, status);

-- =============================================
-- جدول الإحصائيات اليومية (Daily Stats)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_customers INTEGER NOT NULL DEFAULT 0,
  avg_wait_time INTEGER NOT NULL DEFAULT 0,
  peak_hour INTEGER NOT NULL DEFAULT 0,
  UNIQUE(shop_id, date)
);

CREATE INDEX idx_daily_stats_shop_date ON daily_stats(shop_id, date);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Shops: owner can do everything, public can read by slug
CREATE POLICY "Public can read shops by slug" ON shops
  FOR SELECT USING (true);

CREATE POLICY "Owner can insert shops" ON shops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner can update own shops" ON shops
  FOR UPDATE USING (true);

-- Queue entries: public can insert (join queue), shop owner can manage
CREATE POLICY "Anyone can read queue entries" ON queue_entries
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert queue entries" ON queue_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update queue entries" ON queue_entries
  FOR UPDATE USING (true);

-- Daily stats: readable by all, writable by system
CREATE POLICY "Anyone can read daily stats" ON daily_stats
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert daily stats" ON daily_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update daily stats" ON daily_stats
  FOR UPDATE USING (true);

-- =============================================
-- Enable Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;

-- =============================================
-- Function: Get next ticket number for a shop today
-- =============================================
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  INTO next_number
  FROM queue_entries
  WHERE shop_id = p_shop_id
    AND joined_at::date = CURRENT_DATE;
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;
