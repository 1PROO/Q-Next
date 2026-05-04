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
  logo_url?: string;
  primary_color?: string;
  qr_code_key?: string;
  qr_updated_at?: string;
  last_active_at?: string;
  queue_announcement?: string;
  social_links?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  subscription?: Subscription | null;
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
  plan: "free" | "starter" | "business" | "premium" | "lifetime";
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
  premium: "برو (تجريبي)",
  lifetime: "مدى الحياة",
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  premium: 0,
  lifetime: 999,
};

export interface PlanFeatures {
  remove_branding: boolean;
  advanced_stats: boolean;
  static_qr: boolean;
  custom_branding: boolean;
  social_links: boolean;
  custom_welcome: boolean;
  queue_announcement: boolean;
  priority_support: boolean;
  export_data: boolean;
  custom_sounds: boolean;
}

export interface Plan {
  id: string;
  slug: string;
  name_ar: string;
  price: number;
  duration_days: number | null;
  features: PlanFeatures;
  is_active: boolean;
}

export interface SystemSettings {
  key: string;
  value: any;
}

export interface Notification {
  id: string;
  shop_id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  shop_id: string;
  sender: "admin" | "shop";
  content: string;
  is_read: boolean;
  created_at: string;
}
