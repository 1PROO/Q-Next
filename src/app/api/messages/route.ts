import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get("shop_id");
    const isAdmin = userId === process.env.ADMIN_USER_ID;

    const supabase = isAdmin ? createAdminClient() : await createClient();

    let query = supabase.from("messages").select("*").order("created_at", { ascending: true });

    if (isAdmin) {
      if (shopId) {
        query = query.eq("shop_id", shopId);
      } else {
        // Admin fetching all latest messages grouped by shop (complex, so we just fetch all or recent)
        query = query.order("created_at", { ascending: false }).limit(200);
      }
    } else {
      // Fetch user's own shop messages
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", userId).single();
      if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      query = query.eq("shop_id", shop.id);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json(messages || []);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { content, shop_id } = body;
    const isAdmin = userId === process.env.ADMIN_USER_ID;

    const supabase = isAdmin ? createAdminClient() : await createClient();

    let targetShopId = shop_id;

    if (!isAdmin) {
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", userId).single();
      if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      targetShopId = shop.id;
    }

    if (!targetShopId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        shop_id: targetShopId,
        sender: isAdmin ? "admin" : "shop",
        content: content,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(message);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
