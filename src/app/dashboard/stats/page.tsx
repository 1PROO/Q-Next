"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shop, DailyStat } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Clock,
  TrendingUp,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StatsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [todayStats, setTodayStats] = useState<DailyStat | null>(null);
  const [weekStats, setWeekStats] = useState<DailyStat[]>([]);
  const [todayServed, setTodayServed] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Fetch shop
      const res = await fetch("/api/shop");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const shopData = await res.json();
      if (!shopData) {
        setLoading(false);
        return;
      }
      setShop(shopData);

      const today = new Date().toISOString().split("T")[0];

      // Today's stats
      const { data: tStats } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("date", today)
        .single();

      if (tStats) setTodayStats(tStats as DailyStat);

      // Count served today
      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shopData.id)
        .in("status", ["done", "serving"])
        .gte("joined_at", today);

      setTodayServed(count || 0);

      // Last 7 days stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: wStats } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("shop_id", shopData.id)
        .gte("date", weekAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (wStats) setWeekStats(wStats as DailyStat[]);

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          لسه ما أعددت محلك
        </h2>
        <p className="text-gray-500 mb-6">أعد محلك الأول عشان تشوف الإحصائيات</p>
        <Link href="/dashboard/setup">
          <Button className="bg-blue-600 hover:bg-blue-700">إعداد المحل</Button>
        </Link>
      </div>
    );
  }

  const peakHourLabel = todayStats
    ? `${todayStats.peak_hour}:00 - ${todayStats.peak_hour + 1}:00`
    : "--";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإحصائيات</h1>
        <p className="text-gray-500">نظرة عامة على أداء محلك</p>
      </div>

      {/* Today Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-700">
              {todayStats?.total_customers || 0}
            </p>
            <p className="text-sm text-gray-500">زبائن اليوم</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-5 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-700">{todayServed}</p>
            <p className="text-sm text-gray-500">تمت خدمتهم</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-5 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-orange-700">
              {todayStats?.avg_wait_time || 0}
              <span className="text-sm font-normal mr-1">د</span>
            </p>
            <p className="text-sm text-gray-500">متوسط الانتظار</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-5 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-purple-700">{peakHourLabel}</p>
            <p className="text-sm text-gray-500">ساعة الذروة</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent>
          {weekStats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد بيانات بعد</p>
              <p className="text-sm">ابدأ استقبال زبائن وهتظهر الإحصائيات هنا</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weekStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(stat.date).toLocaleDateString("ar-EG", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">
                        {stat.total_customers}
                      </p>
                      <p className="text-gray-400">زبون</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-orange-600">
                        {stat.avg_wait_time}د
                      </p>
                      <p className="text-gray-400">انتظار</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-purple-600">
                        {stat.peak_hour}:00
                      </p>
                      <p className="text-gray-400">ذروة</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
