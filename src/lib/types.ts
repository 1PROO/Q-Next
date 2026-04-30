export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  type: string;
  service_points: number;
  created_at: string;
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
}

export interface DailyStat {
  id: string;
  shop_id: string;
  date: string;
  total_customers: number;
  avg_wait_time: number;
  peak_hour: number;
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
