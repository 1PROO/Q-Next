export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  type: string;
  service_points: number;
  created_at: string;
  welcome_message?: string;
  is_active?: boolean;
  notification_sound?: boolean;
}

export interface QueueEntry {
  id: string;
  shop_id: string;
  customer_name: string | null;
  ticket_number: number;
  status: "waiting" | "serving" | "done" | "skipped";
  joined_at: string;
  called_at: string | null;
  completed_at: string | null;
  customer_notes?: string;
}

export interface DailyStat {
  id: string;
  shop_id: string;
  date: string;
  total_customers: number;
  avg_wait_time: number;
  peak_hour: number;
}

export interface Subscription {
  id: string;
  shop_id: string;
  plan: "free" | "starter" | "business" | "premium";
  status: "active" | "expired" | "suspended";
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceFingerprint {
  id: string;
  fingerprint_hash: string;
  clerk_user_id: string;
  created_at: string;
}

export type ShopType =
  | "barber"
  | "restaurant"
  | "clinic"
  | "pharmacy"
  | "government"
  | "bank"
  | "other";

export const SHOP_TYPES: Record<ShopType, string> = {
  barber: "حلاق",
  restaurant: "مطعم",
  clinic: "عيادة",
  pharmacy: "صيدلية",
  government: "جهة حكومية",
  bank: "بنك",
  other: "أخرى",
};

export const PLAN_NAMES: Record<string, string> = {
  free: "مجاني",
  starter: "ستارتر",
  business: "بيزنس",
  premium: "بريميوم",
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 149,
  business: 299,
  premium: 499,
};
