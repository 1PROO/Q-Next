import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

async function isAdmin(userId: string) {
  const adminUserId = process.env.ADMIN_USER_ID;
  return adminUserId === userId;
}

// GET: Fetch all shops with their subscriptions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "stats") {
      // Overall stats
      const { count: totalShops } = await supabase
        .from("shops")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: todayOrders } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .gte("joined_at", today);

      const { data: activeShops } = await supabase
        .from("shops")
        .select("id, name")
        .eq("is_active", true);

      // Most active shops today
      let topShops: { shop_name: string; count: number }[] = [];
      if (activeShops) {
        const shopCounts = await Promise.all(
          activeShops.slice(0, 20).map(async (shop) => {
            const { count } = await supabase
              .from("queue_entries")
              .select("*", { count: "exact", head: true })
              .eq("shop_id", shop.id)
              .gte("joined_at", today);
            return { shop_name: shop.name, count: count || 0 };
          })
        );
        topShops = shopCounts
          .filter((s) => s.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }

      // Plan distribution
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("status", "active");

      const planCounts: Record<string, number> = { free: 0, starter: 0, business: 0, premium: 0 };
      subs?.forEach((s) => {
        planCounts[s.plan] = (planCounts[s.plan] || 0) + 1;
      });

      return NextResponse.json({
        total_shops: totalShops || 0,
        today_orders: todayOrders || 0,
        top_shops: topShops,
        plan_distribution: planCounts,
      });
    }

    // Default: list all shops
    const { data: shops, error } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "فشل في تحميل البيانات" }, { status: 500 });
    }

    // Fetch subscriptions for each shop
    const shopIds = shops?.map((s) => s.id) || [];
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .in("shop_id", shopIds);

    const shopsWithSubs = shops?.map((shop) => ({
      ...shop,
      subscription: subscriptions?.find((s) => s.shop_id === shop.id) || null,
    }));

    return NextResponse.json(shopsWithSubs);
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}

// POST: Admin actions (toggle active, change plan)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await request.json();
    const { action, shop_id, plan, status: newStatus } = body;
    const supabase = await createClient();

    if (action === "toggle_active") {
      const { data: shop } = await supabase
        .from("shops")
        .select("is_active")
        .eq("id", shop_id)
        .single();

      if (!shop) {
        return NextResponse.json({ error: "المحل غير موجود" }, { status: 404 });
      }

      await supabase
        .from("shops")
        .update({ is_active: !shop.is_active })
        .eq("id", shop_id);

      return NextResponse.json({ success: true, is_active: !shop.is_active });
    }

    if (action === "change_plan") {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("shop_id", shop_id)
        .single();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            plan: plan || "free",
            status: newStatus || "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          shop_id,
          plan: plan || "free",
          status: newStatus || "active",
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
