import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, service_points, welcome_message } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "الاسم والرابط مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if slug exists
    const { data: existing } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "هذا الرابط مستخدم بالفعل، اختر رابطاً آخر" },
        { status: 409 }
      );
    }

    const { data: shop, error } = await supabase
      .from("shops")
      .insert({
        owner_id: userId,
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        type: type || "other",
        service_points: service_points || 1,
        welcome_message: welcome_message || "",
        is_active: true,
        notification_sound: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "فشل في إنشاء المحل" },
        { status: 500 }
      );
    }

    // Auto-create free subscription for the new shop
    await supabase.from("subscriptions").insert({
      shop_id: shop.id,
      plan: "free",
      status: "active",
    });

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const supabase = await createClient();
    const includeParam = request.nextUrl.searchParams.get("include");

    const { data: shop, error } = await supabase
      .from("shops")
      .select()
      .eq("owner_id", userId)
      .single();

    if (error || !shop) {
      return NextResponse.json(null, { status: 200 });
    }

    // If subscription data is requested
    if (includeParam === "subscription") {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        ...shop,
        subscription: subscription || null,
      });
    }

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

// PATCH: Update shop settings
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { welcome_message, notification_sound } = body;

    const supabase = await createClient();

    const updates: Record<string, unknown> = {};
    if (welcome_message !== undefined) updates.welcome_message = welcome_message;
    if (notification_sound !== undefined) updates.notification_sound = notification_sound;

    const { data: shop, error } = await supabase
      .from("shops")
      .update(updates)
      .eq("owner_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "فشل في تحديث الإعدادات" },
        { status: 500 }
      );
    }

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
