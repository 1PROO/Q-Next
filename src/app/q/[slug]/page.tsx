import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CustomerQueuePage from "@/components/customer-queue";
import type { Shop } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
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

export default async function QueuePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { k } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*, subscriptions(*)")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  const subscription = shop.subscriptions?.[0];
  const isFree = !subscription || subscription.plan === "free";

  // Validate Key for Free Plan
  if (isFree) {
    if (!k || k !== shop.qr_code_key) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold text-red-600">كود قديم! ⚠️</h1>
            <p className="text-gray-600 dark:text-gray-400">
              عذراً، الـ QR Code ده انتهت صلاحيته. اطلب من المحل يظهرلك الكود الجديد،
              أو اشترك في النسخة <strong>مدى الحياة</strong> لتثبيت الكود للأبد.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <CustomerQueuePage 
      shop={{
        ...shop,
        subscription: subscription || null
      } as any} 
    />
  );
}
