import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CustomerQueuePage from "@/components/customer-queue";
import type { Shop } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: shop ? `${shop.name} - دورك` : "دورك",
    description: shop
      ? `انضم لطابور ${shop.name} الرقمي`
      : "نظام قوائم الانتظار الرقمية",
  };
}

export default async function QueuePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  return <CustomerQueuePage shop={shop as Shop} />;
}
