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
    const { name, slug, type, service_points } = body;

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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "فشل في إنشاء المحل" },
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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: shop, error } = await supabase
      .from("shops")
      .select()
      .eq("owner_id", userId)
      .single();

    if (error || !shop) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
