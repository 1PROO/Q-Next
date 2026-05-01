"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAN_NAMES, type Shop, type Subscription } from "@/lib/types";
import {
  Store,
  Users,
  ShoppingCart,
  TrendingUp,
  Loader2,
  ShieldAlert,
  Power,
  PowerOff,
  Gift,
  Calendar,
} from "lucide-react";
import { AdminSkeleton } from "@/components/loading-skeleton";

interface ShopWithSub extends Shop {
  subscription: Subscription | null;
}

interface AdminStats {
  total_shops: number;
  today_orders: number;
  top_shops: { shop_name: string; count: number }[];
  plan_distribution: Record<string, number>;
}

export default function AdminPage() {
  const { userId } = useAuth();
  const [shops, setShops] = useState<ShopWithSub[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [shopsRes, statsRes] = await Promise.all([
        fetch("/api/admin"),
        fetch("/api/admin?action=stats"),
      ]);

      if (shopsRes.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (shopsRes.ok) {
        const shopsData = await shopsRes.json();
        setShops(shopsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch {
      // Error handling
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleActive(shopId: string) {
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", shop_id: shopId }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function changePlan(shopId: string, plan: string) {
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_plan", shop_id: shopId, plan }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function giftDays(shopId: string, days: number) {
    if (!days || days <= 0) return;
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gift_days", shop_id: shopId, days }),
    });
    await fetchData();
    setActionLoading(null);
  }

  if (loading) return <AdminSkeleton />;

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              غير مصرح
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              ليس لديك صلاحية الوصول لهذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    premium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    lifetime: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              لوحة تحكم الأدمن
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            Admin Panel
          </Badge>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-5 text-center">
                <Store className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.total_shops}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المحلات</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
              <CardContent className="p-5 text-center">
                <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {stats.today_orders}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">أوردرات اليوم</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardContent className="p-5 text-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.plan_distribution.free || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">باقة مجانية</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
              <CardContent className="p-5 text-center">
                <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {(stats.plan_distribution.starter || 0) +
                    (stats.plan_distribution.business || 0) +
                    (stats.plan_distribution.premium || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">باقات مدفوعة</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Shops */}
        {stats && stats.top_shops.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">أكثر المحلات نشاطاً اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.top_shops.map((shop, index) => (
                  <div
                    key={shop.shop_name}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {shop.shop_name}
                      </span>
                    </div>
                    <Badge variant="outline">{shop.count} أوردر</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shops List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">
              كل المحلات ({shops.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shops.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد محلات مسجلة</p>
            ) : (
              <div className="space-y-3">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {shop.name}
                        </h3>
                        {!shop.is_active && (
                          <Badge variant="destructive" className="text-xs">
                            معطل
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{shop.type}</span>
                        <span>·</span>
                        <span>
                          {new Date(shop.created_at).toLocaleDateString("ar-EG")}
                        </span>
                        <span>·</span>
                        <span>/q/{shop.slug}</span>
                        {shop.subscription?.expires_at && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Calendar className="h-3 w-3" />
                              ينتهي في: {new Date(shop.subscription.expires_at).toLocaleDateString("ar-EG")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        className={`text-xs border-0 ${planColors[shop.subscription?.plan || "free"]}`}
                      >
                        {PLAN_NAMES[shop.subscription?.plan || "free"]}
                      </Badge>

                      <Select
                        value={shop.subscription?.plan || "free"}
                        onValueChange={(v) => changePlan(shop.id, v as string)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">مجاني</SelectItem>
                          <SelectItem value="premium">برو (تجريبي)</SelectItem>
                          <SelectItem value="lifetime">مدى الحياة</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(shop.id)}
                        disabled={actionLoading === shop.id}
                        className={`h-8 text-xs ${
                          shop.is_active
                            ? "border-red-300 text-red-600 hover:bg-red-50"
                            : "border-green-300 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {actionLoading === shop.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : shop.is_active ? (
                          <>
                            <PowerOff className="h-3 w-3 ml-1" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <Power className="h-3 w-3 ml-1" />
                            تفعيل
                          </>
                        )}
                      </Button>

                      <div className="flex items-center border rounded-md overflow-hidden h-8">
                        <input
                          type="number"
                          placeholder="أيام"
                          className="w-12 h-full text-xs px-1 border-0 focus:ring-0 text-center dark:bg-gray-700"
                          id={`gift-${shop.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`gift-${shop.id}`) as HTMLInputElement;
                            giftDays(shop.id, parseInt(input.value));
                            input.value = "";
                          }}
                          disabled={actionLoading === shop.id}
                          className="h-full px-2 rounded-none bg-amber-50 text-amber-700 hover:bg-amber-100 border-r"
                        >
                          <Gift className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
