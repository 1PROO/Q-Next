import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, service_points, welcome_message, logo_url, primary_color } = body;

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
        qr_code_key: crypto.randomUUID(),
        qr_updated_at: new Date().toISOString(),
        logo_url: logo_url || null,
        primary_color: primary_color || "#1e40af",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "فشل في إنشاء المحل" },
        { status: 500 }
      );
    }

    // Auto-create premium trial subscription for the new shop (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("subscriptions").insert({
      shop_id: shop.id,
      plan: "premium",
      status: "active",
      expires_at: expiresAt.toISOString(),
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

    const adminUserId = process.env.ADMIN_USER_ID;
    const userIsAdmin = adminUserId === userId;

    const { data: shop, error } = await supabase

      .from("shops")
      .select()
      .eq("owner_id", userId)
      .single();

    if (error || !shop) {
      return NextResponse.json(null, { status: 200 });
    }

    // Always include subscription for logic
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // QR Code Key Rotation Logic (Free Plan - only if no active paid/trial plan)
    let currentShop = shop;
    const hasActivePlan = !!subscription && (subscription.plan === "lifetime" || subscription.plan === "premium");
    
    if (!hasActivePlan) {
      const lastUpdate = shop.qr_updated_at ? new Date(shop.qr_updated_at) : new Date(0);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      if (lastUpdate < twoDaysAgo) {
        const newKey = crypto.randomUUID();
        const { data: updatedShop } = await supabase
          .from("shops")
          .update({
            qr_code_key: newKey,
            qr_updated_at: new Date().toISOString(),
          })
          .eq("id", shop.id)
          .select()
          .single();
        if (updatedShop) currentShop = updatedShop;
      }
    }

    // Update last_active_at asynchronously to track online status
    if (shop) {
      supabase
        .from("shops")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", shop.id)
        .then();
    }

    // Fetch unread notifications
    let notifications = [];
    if (shop) {
       const { data: notifs } = await supabase
         .from("notifications")
         .select("*")
         .eq("shop_id", shop.id)
         .eq("is_read", false)
         .order("created_at", { ascending: false });
       if (notifs) notifications = notifs;
    }

    return NextResponse.json({
      ...currentShop,
      subscription: subscription || null,
      isAdmin: userIsAdmin,
      notifications,
    });
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
    const { welcome_message, notification_sound, logo_url, primary_color, action, notification_id } = body;

    const supabase = await createClient();

    if (action === "read_notification") {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification_id)
        .eq("shop_id", (await supabase.from("shops").select("id").eq("owner_id", userId).single()).data?.id);
      return NextResponse.json({ success: true });
    }

    // Check subscription for customization limits
    const { data: shopCheck } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (!shopCheck) {
      return NextResponse.json({ error: "المحل غير موجود" }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("shop_id", shopCheck.id)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isProOrLifetime = subscription?.plan === "lifetime" || subscription?.plan === "premium";

    const updates: Record<string, unknown> = {};
    if (welcome_message !== undefined) updates.welcome_message = welcome_message;
    if (notification_sound !== undefined) updates.notification_sound = notification_sound;
    
    // Limits customization to pro trial or lifetime plan
    if (isProOrLifetime) {
      if (logo_url !== undefined) updates.logo_url = logo_url;
      if (primary_color !== undefined) updates.primary_color = primary_color;
    }

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
