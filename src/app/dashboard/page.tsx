"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [servingEntries, setServingEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const fetchShop = useCallback(async () => {
    const res = await fetch("/api/shop");
    if (res.ok) {
      const data = await res.json();
      setShop(data);
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

      if (waiting) setQueue(waiting as QueueEntry[]);
      if (serving) setServingEntries(serving as QueueEntry[]);
    },
    [supabase]
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
        <p className="text-gray-500 mb-6">
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
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
          <p className="text-gray-500">إدارة الطابور</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Users className="h-4 w-4 ml-1" />
            {queue.length} في الانتظار
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1 border-green-300 text-green-700">
            <Clock className="h-4 w-4 ml-1" />
            {servingEntries.length} يتم خدمتهم
          </Badge>
        </div>
      </div>

      {/* Call Next Button */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              {queue.length > 0
                ? `التالي: رقم ${queue[0].ticket_number}${queue[0].customer_name ? ` - ${queue[0].customer_name}` : ""}`
                : "لا يوجد أحد في الانتظار"}
            </h3>
            <p className="text-blue-600 text-sm">
              {queue.length > 0
                ? `${queue.length} شخص في الطابور`
                : "الطابور فاضي"}
            </p>
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
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              يتم خدمتهم الآن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-green-50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-700">
                      {entry.ticket_number}
                    </span>
                    <span className="text-gray-600">
                      {entry.customer_name || "زبون"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(entry.id, "complete")}
                    disabled={actionLoading === entry.id}
                    className="border-green-300 text-green-700 hover:bg-green-100"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
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
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0 ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {entry.ticket_number}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">
                        {entry.customer_name || "زبون"}
                      </p>
                      <p className="text-xs text-gray-400">
                        انضم {new Date(entry.joined_at).toLocaleTimeString("ar-EG")}
                      </p>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-blue-100 text-blue-700 border-0">
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
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
                      className="border-red-300 text-red-600 hover:bg-red-50"
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
