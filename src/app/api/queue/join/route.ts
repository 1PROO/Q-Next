import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, customer_name, customer_notes } = body;

    if (!shop_id) {
      return NextResponse.json(
        { error: "shop_id مطلوب" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get next ticket number
    const { data: ticketData, error: ticketError } = await supabase.rpc(
      "get_next_ticket_number",
      { p_shop_id: shop_id }
    );

    let ticketNumber: number;

    if (ticketError) {
      // Fallback: manual calculation
      const { data: lastEntry } = await supabase
        .from("queue_entries")
        .select("ticket_number")
        .eq("shop_id", shop_id)
        .gte("joined_at", new Date().toISOString().split("T")[0])
        .order("ticket_number", { ascending: false })
        .limit(1)
        .single();

      ticketNumber = (lastEntry?.ticket_number || 0) + 1;
    } else {
      ticketNumber = ticketData as number;
    }

    const { data: entry, error: insertError } = await supabase
      .from("queue_entries")
      .insert({
        shop_id,
        customer_name: customer_name || null,
        customer_notes: customer_notes || "",
        ticket_number: ticketNumber,
        status: "waiting",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "فشل في الانضمام للطابور" },
        { status: 500 }
      );
    }

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    const { data: existingStat } = await supabase
      .from("daily_stats")
      .select()
      .eq("shop_id", shop_id)
      .eq("date", today)
      .single();

    if (existingStat) {
      await supabase
        .from("daily_stats")
        .update({
          total_customers: existingStat.total_customers + 1,
        })
        .eq("id", existingStat.id);
    } else {
      await supabase.from("daily_stats").insert({
        shop_id,
        date: today,
        total_customers: 1,
        avg_wait_time: 0,
        peak_hour: new Date().getHours(),
      });
    }

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
