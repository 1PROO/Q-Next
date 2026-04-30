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
    const { entry_id, action } = body;

    if (!entry_id || !action) {
      return NextResponse.json(
        { error: "entry_id و action مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (action === "call") {
      // Call next customer
      const { data, error } = await supabase
        .from("queue_entries")
        .update({
          status: "serving",
          called_at: new Date().toISOString(),
        })
        .eq("id", entry_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "فشل في استدعاء الزبون" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    if (action === "complete") {
      const { data: entry } = await supabase
        .from("queue_entries")
        .select()
        .eq("id", entry_id)
        .single();

      const { data, error } = await supabase
        .from("queue_entries")
        .update({
          status: "done",
          completed_at: new Date().toISOString(),
        })
        .eq("id", entry_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "فشل في إكمال الخدمة" },
          { status: 500 }
        );
      }

      // Update avg wait time
      if (entry?.called_at && entry?.joined_at) {
        const waitTime = Math.round(
          (new Date(entry.called_at).getTime() -
            new Date(entry.joined_at).getTime()) /
            60000
        );
        const today = new Date().toISOString().split("T")[0];
        const { data: stat } = await supabase
          .from("daily_stats")
          .select()
          .eq("shop_id", entry.shop_id)
          .eq("date", today)
          .single();

        if (stat) {
          const completedCount = stat.total_customers > 1 ? stat.total_customers - 1 : 1;
          const newAvg = Math.round(
            (stat.avg_wait_time * completedCount + waitTime) /
              (completedCount + 1)
          );
          await supabase
            .from("daily_stats")
            .update({
              avg_wait_time: newAvg,
              peak_hour: new Date().getHours(),
            })
            .eq("id", stat.id);
        }
      }

      return NextResponse.json(data);
    }

    if (action === "skip") {
      const { data, error } = await supabase
        .from("queue_entries")
        .update({
          status: "skipped",
          completed_at: new Date().toISOString(),
        })
        .eq("id", entry_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "فشل في تخطي الزبون" },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "إجراء غير معروف" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
