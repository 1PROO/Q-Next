"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@clerk/nextjs";
import type { QueueEntry, Shop } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  SkipForward,
  CheckCircle2,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { playNotificationSound } from "@/lib/notification-sound";
import { DashboardSkeleton } from "@/components/loading-skeleton";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [servingEntries, setServingEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevQueueLengthRef = useRef<number>(0);
  const supabase = createClient();

  const fetchShop = useCallback(async () => {
    const res = await fetch("/api/shop");
    if (res.ok) {
      const data = await res.json();
      setShop(data);
      if (data?.notification_sound !== undefined) {
        setSoundEnabled(data.notification_sound);
      }
      return data;
    }
    return null;
  }, []);

  const fetchQueue = useCallback(
    async (shopId: string) => {
      const { data: waiting } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shopId)
        .eq("status", "waiting")
        .order("ticket_number", { ascending: true });

      const { data: serving } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("shop_id", shopId)
        .eq("status", "serving")
        .order("called_at", { ascending: true });

      if (waiting) {
        // Play sound if new customer joined
        if (waiting.length > prevQueueLengthRef.current && prevQueueLengthRef.current > 0 && soundEnabled) {
          playNotificationSound();
        }
        prevQueueLengthRef.current = waiting.length;
        setQueue(waiting as QueueEntry[]);
      }
      if (serving) setServingEntries(serving as QueueEntry[]);
    },
    [supabase, soundEnabled]
  );

  useEffect(() => {
    async function init() {
      const shopData = await fetchShop();
      if (shopData) {
        await fetchQueue(shopData.id);
      }
      setLoading(false);
    }
    init();
  }, [fetchShop, fetchQueue]);

  // Real-time subscription
  useEffect(() => {
    if (!shop) return;

    const channel = supabase
      .channel(`dashboard-${shop.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `shop_id=eq.${shop.id}`,
        },
        () => {
          fetchQueue(shop.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop, fetchQueue, supabase]);

  async function handleAction(entryId: string, action: string) {
    setActionLoading(entryId);
    try {
      await fetch("/api/queue/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, action }),
      });
      if (shop) await fetchQueue(shop.id);
    } finally {
      setActionLoading(null);
    }
  }

  async function callNext() {
    if (queue.length === 0) return;
    await handleAction(queue[0].id, "call");
  }

  async function toggleSound() {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_sound: newValue }),
    });
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          لسه ما أعددت محلك
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          أعد محلك الأول عشان تقدر تبدأ تستقبل زبائن
        </p>
        <Link href="/dashboard/setup">
          <Button className="bg-blue-600 hover:bg-blue-700">
            إعداد المحل الآن
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{shop.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">إدارة الطابور</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSound}
            className={`h-8 text-xs ${
              soundEnabled
                ? "border-green-300 text-green-700 dark:text-green-400"
                : "border-gray-300 text-gray-500"
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3 w-3 ml-1" />
                صوت التنبيه
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 ml-1" />
                صوت مغلق
              </>
            )}
          </Button>
          <Badge variant="outline" className="text-sm px-3 py-1 dark:border-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 ml-1" />
            {queue.length} في الانتظار
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
            <Clock className="h-4 w-4 ml-1" />
            {servingEntries.length} يتم خدمتهم
          </Badge>
        </div>
      </div>

      {/* Call Next Button */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">
              {queue.length > 0
                ? `التالي: رقم ${queue[0].ticket_number}${queue[0].customer_name ? ` - ${queue[0].customer_name}` : ""}`
                : "لا يوجد أحد في الانتظار"}
            </h3>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              {queue.length > 0
                ? `${queue.length} شخص في الطابور`
                : "الطابور فاضي"}
            </p>
            {queue.length > 0 && queue[0].customer_notes && (
              <p className="text-blue-500 dark:text-blue-400 text-xs mt-1 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {queue[0].customer_notes}
              </p>
            )}
          </div>
          <Button
            onClick={callNext}
            disabled={queue.length === 0 || actionLoading !== null}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <PhoneCall className="h-5 w-5 ml-2" />
                نادي التالي
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Currently Serving */}
      {servingEntries.length > 0 && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              يتم خدمتهم الآن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {entry.ticket_number}
                    </span>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">
                        {entry.customer_name || "زبون"}
                      </span>
                      {entry.customer_notes && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {entry.customer_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(entry.id, "complete")}
                    disabled={actionLoading === entry.id}
                    className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    {actionLoading === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 ml-1" />
                        تم
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting Queue */}
      <Card className="dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            قائمة الانتظار ({queue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد أحد في الانتظار</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
                    index === 0
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {entry.ticket_number}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {entry.customer_name || "زبون"}
                      </p>
                      <p className="text-xs text-gray-400">
                        انضم {new Date(entry.joined_at).toLocaleTimeString("ar-EG")}
                      </p>
                      {entry.customer_notes && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {entry.customer_notes}
                        </p>
                      )}
                    </div>
                    {index === 0 && (
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                        التالي
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(entry.id, "call")}
                      disabled={actionLoading === entry.id}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                    >
                      {actionLoading === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <PhoneCall className="h-4 w-4 ml-1" />
                          نادي
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(entry.id, "skip")}
                      disabled={actionLoading === entry.id}
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                    >
                      <SkipForward className="h-4 w-4 ml-1" />
                      تخطي
                    </Button>
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
