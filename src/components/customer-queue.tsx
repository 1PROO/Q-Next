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
  shop: Shop & { subscription?: any };
}) {
  const primaryColor = shop.primary_color || "#1e40af";
  const lightColor = `${primaryColor}15`; // 15 is hex for ~8% opacity
  const mediumColor = `${primaryColor}40`; // 40 is hex for ~25% opacity

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
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"
              style={{ backgroundColor: lightColor }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              دورك الآن!
            </h1>
            <p className="text-lg mb-4 opacity-80" style={{ color: primaryColor }}>تفضل للخدمة</p>
            <div className="text-6xl font-extrabold mb-4" style={{ color: primaryColor }}>
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
              <div className="text-7xl font-extrabold mb-6" style={{ color: primaryColor }}>
                {myEntry.ticket_number}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-4" style={{ backgroundColor: lightColor }}>
                  <Users className="h-6 w-6 mx-auto mb-1" style={{ color: primaryColor }} />
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {positionAhead}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">قبلك في الطابور</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4 border border-orange-100 dark:border-orange-800">
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
          {shop.logo_url ? (
            <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-2xl shadow-sm border dark:border-gray-800 bg-white p-2">
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: lightColor }}
            >
              <Users className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
          )}
          <CardTitle className="text-2xl font-bold dark:text-white">{shop.name}</CardTitle>
          {shop.welcome_message ? (
            <p className="text-gray-600 dark:text-gray-300 mt-1">{shop.welcome_message}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">خد رقمك وانتظر براحتك</p>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div 
            className="rounded-xl p-4 text-center border"
            style={{ backgroundColor: lightColor, borderColor: mediumColor }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">عدد المنتظرين حالياً</p>
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>{waitingCount}</p>
            <p className="text-xs text-gray-400 mt-1">
              وقت الانتظار المتوقع: ~{formatWaitTime(waitingCount * avgServiceTime)}
            </p>
          </div>

          {(shop.subscription?.plan === "premium" || shop.subscription?.plan === "lifetime") && shop.queue_announcement && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">{shop.queue_announcement}</p>
            </div>
          )}

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
            className="w-full py-6 text-lg rounded-xl text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: primaryColor }}
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

          {/* Pro Features: Social Links */}
          {(shop.subscription?.plan === "premium" || shop.subscription?.plan === "lifetime") && shop.social_links && (
            <div className="flex justify-center gap-4 mt-4 border-t pt-4 dark:border-gray-800">
              {shop.social_links.facebook && (
                <a href={shop.social_links.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
              )}
              {shop.social_links.instagram && (
                <a href={shop.social_links.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {shop.social_links.whatsapp && (
                <a href={shop.social_links.whatsapp} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 .006 5.378.006 12.025c0 2.124.551 4.195 1.6 6.015L.034 23.85l5.962-1.564c1.764.957 3.754 1.464 5.795 1.464 6.643 0 12.022-5.378 12.022-12.025C23.813 5.378 18.435 0 12.031 0zM12 21.656c-1.785 0-3.535-.48-5.068-1.39l-.364-.216-3.766.987.999-3.67-.236-.376A9.92 9.92 0 012.022 12c0-5.503 4.48-9.982 9.983-9.982 5.503 0 9.983 4.479 9.983 9.982C22.003 17.502 17.525 21.656 12 21.656zm5.474-7.481c-.301-.151-1.78-.881-2.057-.982-.275-.101-.476-.151-.676.151-.201.301-.777.981-.953 1.183-.175.201-.351.226-.651.075-2.083-1.042-3.486-2.059-4.707-4.148-.201-.341-.018-.521.134-.672.135-.136.301-.351.451-.527.151-.176.201-.301.301-.502.101-.201.05-.376-.025-.526-.075-.151-.676-1.63-.926-2.233-.243-.585-.49-.505-.676-.514-.176-.008-.376-.01-.576-.01-.201 0-.526.075-.802.376-.275.301-1.052 1.028-1.052 2.508 0 1.48 1.077 2.91 1.228 3.112.151.201 2.124 3.243 5.143 4.545.719.31 1.28.495 1.718.634.721.23 1.378.197 1.897.12.58-.087 1.78-.727 2.031-1.429.25-.702.25-1.304.175-1.429-.075-.126-.275-.201-.576-.352z"/></svg>
                </a>
              )}
            </div>
          )}
        </CardContent>
        {(!shop.subscription || shop.subscription.plan === "free") && (
          <div className="text-center pb-4 text-xs text-gray-400">
            Powered by <a href="/" className="font-bold text-blue-500 hover:underline">Dawrak</a>
          </div>
        )}
      </Card>
    </div>
  );
}
