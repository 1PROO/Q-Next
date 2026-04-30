"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QueueEntry, Shop } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Bell, BellOff, Loader2, CheckCircle2, MessageSquare } from "lucide-react";

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return "أقل من دقيقة";
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}

export default function CustomerQueuePage({
  shop,
}: {
  shop: Shop;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [positionAhead, setPositionAhead] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationDenied, setNotificationDenied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [avgServiceTime, setAvgServiceTime] = useState(5); // Dynamic based on actual data

  const supabase = createClient();

  // Calculate dynamic average service time from actual data
  const calculateAvgServiceTime = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    
    // Get completed entries from today with timing data
    const { data: completedEntries } = await supabase
      .from("queue_entries")
      .select("called_at, completed_at")
      .eq("shop_id", shop.id)
      .eq("status", "done")
      .gte("joined_at", today)
      .not("called_at", "is", null)
      .not("completed_at", "is", null);

    if (completedEntries && completedEntries.length >= 2) {
      const totalServiceTime = completedEntries.reduce((sum, entry) => {
        const serviceTime = (new Date(entry.completed_at!).getTime() - new Date(entry.called_at!).getTime()) / 60000;
        return sum + Math.max(serviceTime, 1); // at least 1 minute
      }, 0);
      const avg = Math.round(totalServiceTime / completedEntries.length);
      setAvgServiceTime(Math.max(avg, 1)); // at least 1 min
    } else {
      // Also try daily_stats for historical average
      const { data: stats } = await supabase
        .from("daily_stats")
        .select("avg_wait_time, total_customers")
        .eq("shop_id", shop.id)
        .order("date", { ascending: false })
        .limit(7);

      if (stats && stats.length > 0) {
        const totalWait = stats.reduce((sum, s) => sum + s.avg_wait_time, 0);
        const avgWait = Math.round(totalWait / stats.length);
        if (avgWait > 0) {
          setAvgServiceTime(avgWait);
        }
      }
    }
  }, [shop.id, supabase]);

  const fetchQueueStatus = useCallback(async () => {
    const { data: waiting } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("status", "waiting")
      .order("ticket_number", { ascending: true });

    if (waiting) {
      setWaitingCount(waiting.length);

      if (myEntry) {
        const myPosition = waiting.findIndex((e) => e.id === myEntry.id);
        setPositionAhead(myPosition >= 0 ? myPosition : 0);

        // Check if my entry status changed
        const myCurrentEntry = waiting.find((e) => e.id === myEntry.id);
        if (!myCurrentEntry) {
          // Check if being served or done
          const { data: updated } = await supabase
            .from("queue_entries")
            .select("*")
            .eq("id", myEntry.id)
            .single();

          if (updated) {
            setMyEntry(updated as QueueEntry);
          }
        }
      }
    }
  }, [shop.id, myEntry, supabase]);

  // Real-time subscription
  useEffect(() => {
    fetchQueueStatus();
    calculateAvgServiceTime();

    const channel = supabase
      .channel(`queue-${shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shop.id}`,
        },
        () => {
          fetchQueueStatus();
          calculateAvgServiceTime();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop.id, fetchQueueStatus, calculateAvgServiceTime, supabase]);

  // Push notification when position changes
  useEffect(() => {
    if (
      myEntry &&
      myEntry.status === "waiting" &&
      positionAhead <= 2 &&
      positionAhead > 0 &&
      notificationsEnabled
    ) {
      sendNotification(
        "دورك قرب! 🎉",
        `باقي ${positionAhead} ${positionAhead === 1 ? "شخص" : positionAhead === 2 ? "شخصين" : "أشخاص"} قبلك`
      );
    }
    if (myEntry && myEntry.status === "serving" && notificationsEnabled) {
      sendNotification("دورك الآن! 🔔", "تفضل، دورك جه!");
    }
  }, [positionAhead, myEntry?.status, notificationsEnabled, myEntry]);

  function sendNotification(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "dawrak-notification",
      });
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      setNotificationDenied(false);
    } else {
      setNotificationDenied(true);
    }
  }

  async function joinQueue() {
    setIsJoining(true);
    try {
      const res = await fetch("/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shop.id,
          customer_name: customerName.trim() || null,
          customer_notes: customerNotes.trim() || "",
        }),
      });

      if (res.ok) {
        const entry = await res.json();
        setMyEntry(entry);
        setHasJoined(true);
        fetchQueueStatus();
      }
    } finally {
      setIsJoining(false);
    }
  }

  // Serving state
  if (myEntry && myEntry.status === "serving") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-green-200 dark:border-green-800 shadow-xl">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
              دورك الآن!
            </h1>
            <p className="text-green-600 dark:text-green-500 text-lg mb-4">تفضل للخدمة</p>
            <div className="text-6xl font-extrabold text-green-700 dark:text-green-400 mb-4">
              {myEntry.ticket_number}
            </div>
            <p className="text-gray-500 dark:text-gray-400">رقم تذكرتك</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Done/Skipped state
  if (myEntry && (myEntry.status === "done" || myEntry.status === "skipped")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              {myEntry.status === "done" ? "تمت الخدمة" : "تم التخطي"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {myEntry.status === "done"
                ? "شكراً لزيارتك! نتمنى نشوفك قريب"
                : "تم تخطي دورك. يمكنك الانضمام مرة أخرى"}
            </p>
            <Button
              onClick={() => {
                setMyEntry(null);
                setHasJoined(false);
                setCustomerNotes("");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              انضم للطابور مرة أخرى
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting state
  if (hasJoined && myEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="text-center shadow-xl border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{shop.name}</p>
              <CardTitle className="text-xl text-gray-700 dark:text-gray-200">رقم تذكرتك</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-7xl font-extrabold text-blue-600 dark:text-blue-400 mb-6">
                {myEntry.ticket_number}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                  <Users className="h-6 w-6 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {positionAhead}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">قبلك في الطابور</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4">
                  <Clock className="h-6 w-6 text-orange-500 dark:text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    ~{formatWaitTime(positionAhead * avgServiceTime)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">وقت الانتظار المتوقع</p>
                </div>
              </div>

              {positionAhead <= 2 && positionAhead > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4">
                  <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                    دورك قرب! جهّز نفسك
                  </p>
                </div>
              )}

              {positionAhead === 0 && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4 animate-pulse">
                  <p className="text-green-700 dark:text-green-400 font-bold">
                    أنت التالي! استعد
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification card */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              {notificationsEnabled ? (
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                  <Bell className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    هنبلغك لما دورك يقرب
                  </span>
                </div>
              ) : notificationDenied ? (
                <div className="flex items-center gap-3 text-red-500">
                  <BellOff className="h-5 w-5" />
                  <span className="text-sm">
                    التنبيهات مرفوضة - فعّلها من إعدادات المتصفح
                  </span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={requestNotifications}
                >
                  <Bell className="h-4 w-4 ml-2" />
                  فعّل التنبيهات عشان نبلغك لما دورك يقرب
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Join queue state
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold dark:text-white">{shop.name}</CardTitle>
          {shop.welcome_message ? (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{shop.welcome_message}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">خد رقمك وانتظر براحتك</p>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">عدد المنتظرين حالياً</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{waitingCount}</p>
            <p className="text-xs text-gray-400 mt-1">
              وقت الانتظار المتوقع: ~{formatWaitTime(waitingCount * avgServiceTime)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسمك (اختياري)
            </label>
            <Input
              placeholder="اكتب اسمك هنا..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-center text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="h-4 w-4 inline ml-1" />
              ملاحظات (اختياري)
            </label>
            <Input
              placeholder="مثال: عايز قصة شعر معينة..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="text-sm"
            />
          </div>

          <Button
            onClick={joinQueue}
            disabled={isJoining}
            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري أخذ الرقم...
              </>
            ) : (
              "خد رقمك الآن"
            )}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              {shop.type === "barber"
                ? "حلاق"
                : shop.type === "restaurant"
                  ? "مطعم"
                  : shop.type === "clinic"
                    ? "عيادة"
                    : shop.type === "pharmacy"
                      ? "صيدلية"
                      : shop.type === "government"
                        ? "جهة حكومية"
                        : shop.type === "bank"
                          ? "بنك"
                          : "خدمات"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
