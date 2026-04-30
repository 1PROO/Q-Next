import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint_hash, clerk_user_id } = body;

    if (!fingerprint_hash || !clerk_user_id) {
      return NextResponse.json(
        { error: "البيانات ناقصة" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if this fingerprint was used by another user who exhausted free plan
    const { data: existingFingerprints } = await supabase
      .from("device_fingerprints")
      .select("clerk_user_id")
      .eq("fingerprint_hash", fingerprint_hash)
      .neq("clerk_user_id", clerk_user_id);

    let shouldBlockFree = false;

    if (existingFingerprints && existingFingerprints.length > 0) {
      // Check if any of the old users' shops had their free plan used up
      for (const fp of existingFingerprints) {
        const { data: oldShop } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", fp.clerk_user_id)
          .single();

        if (oldShop) {
          const { data: oldSub } = await supabase
            .from("subscriptions")
            .select("plan, status")
            .eq("shop_id", oldShop.id)
            .single();

          if (oldSub && (oldSub.plan !== "free" || oldSub.status === "expired")) {
            shouldBlockFree = true;
            break;
          }

          // Also check if they used a lot of orders
          const { count } = await supabase
            .from("queue_entries")
            .select("*", { count: "exact", head: true })
            .eq("shop_id", oldShop.id);

          if (count && count >= 100) {
            shouldBlockFree = true;
            break;
          }
        }
      }
    }

    // Save/update the fingerprint
    const { data: existing } = await supabase
      .from("device_fingerprints")
      .select("id")
      .eq("fingerprint_hash", fingerprint_hash)
      .eq("clerk_user_id", clerk_user_id)
      .single();

    if (!existing) {
      await supabase
        .from("device_fingerprints")
        .insert({ fingerprint_hash, clerk_user_id });
    }

    // Set localStorage flag via response
    return NextResponse.json({
      should_block_free: shouldBlockFree,
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
