"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_NAMES, PLAN_PRICES, type Subscription } from "@/lib/types";
import {
  CreditCard,
  CheckCircle2,
  Star,
  Zap,
  Crown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { CardSkeleton } from "@/components/loading-skeleton";

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const shopRes = await fetch("/api/shop");
      if (shopRes.ok) {
        const shop = await shopRes.json();
        if (shop) {
          setHasShop(true);
          // Fetch subscription via shop
          const subRes = await fetch(`/api/shop?include=subscription`);
          if (subRes.ok) {
            const data = await subRes.json();
            if (data?.subscription) {
              setSubscription(data.subscription);
            }
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!hasShop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          لسه ما أعددت محلك
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          أعد محلك الأول عشان تشوف باقتك
        </p>
        <Link href="/dashboard/setup">
          <Button className="bg-blue-600 hover:bg-blue-700">إعداد المحل</Button>
        </Link>
      </div>
    );
  }

  const planIcons: Record<string, typeof Star> = {
    free: CheckCircle2,
    starter: Star,
    business: Zap,
    premium: Crown,
  };

  const planColors: Record<string, string> = {
    free: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    starter: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    business: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    premium: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  };

  const currentPlan = subscription?.plan || "free";
  const PlanIcon = planIcons[currentPlan] || CheckCircle2;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الاشتراك</h1>
        <p className="text-gray-500 dark:text-gray-400">إدارة باقتك الحالية</p>
      </div>

      {/* Current Plan */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <CreditCard className="h-5 w-5 text-blue-600" />
            الباقة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${planColors[currentPlan]}`}
              >
                <PlanIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {PLAN_NAMES[currentPlan]}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {PLAN_PRICES[currentPlan] === 0
                    ? "مجاني"
                    : `${PLAN_PRICES[currentPlan]} ج.م/شهر`}
                </p>
              </div>
            </div>
            <Badge className={`${planColors[currentPlan]} border-0`}>
              {subscription?.status === "active"
                ? "فعال"
                : subscription?.status === "expired"
                  ? "منتهي"
                  : subscription?.status === "suspended"
                    ? "موقوف"
                    : "فعال"}
            </Badge>
          </div>

          {subscription?.started_at && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                تاريخ البدء:{" "}
                {new Date(subscription.started_at).toLocaleDateString("ar-EG")}
              </p>
              {subscription.expires_at && (
                <p>
                  تاريخ الانتهاء:{" "}
                  {new Date(subscription.expires_at).toLocaleDateString("ar-EG")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade */}
      {currentPlan !== "premium" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              ترقية الباقة
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              ترقّى لباقة أعلى عشان تحصل على مميزات أكثر
            </p>
            <Link href="/pricing">
              <Button className="bg-blue-600 hover:bg-blue-700">
                عرض الباقات المتاحة
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg dark:text-white">مميزات باقتك</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {currentPlan === "free" && (
              <>
                <PlanFeature text="حتى 50 أوردر/يوم" />
                <PlanFeature text="QR Code مخصص" />
                <PlanFeature text="إدارة الطابور" />
                <PlanFeature text="تنبيهات المتصفح" />
                <PlanFeature text="إحصائيات أساسية" />
              </>
            )}
            {currentPlan === "starter" && (
              <>
                <PlanFeature text="حتى 50 زبون/يوم" />
                <PlanFeature text="QR Code مخصص" />
                <PlanFeature text="إدارة الطابور" />
                <PlanFeature text="رسالة ترحيبية مخصصة" />
                <PlanFeature text="إحصائيات أساسية" />
              </>
            )}
            {currentPlan === "business" && (
              <>
                <PlanFeature text="عدد غير محدود من الزبائن" />
                <PlanFeature text="إحصائيات متقدمة" />
                <PlanFeature text="براند مخصص" />
                <PlanFeature text="رسالة ترحيبية مخصصة" />
                <PlanFeature text="ملاحظات من الزبون" />
                <PlanFeature text="صوت تنبيه لدخول زبون جديد" />
              </>
            )}
            {currentPlan === "premium" && (
              <>
                <PlanFeature text="كل مميزات بيزنس" />
                <PlanFeature text="فروع متعددة" />
                <PlanFeature text="رسائل SMS" />
                <PlanFeature text="أولوية في الدعم الفني" />
                <PlanFeature text="تقارير متقدمة" />
                <PlanFeature text="API خاص" />
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-gray-700 dark:text-gray-300 text-sm">{text}</span>
    </li>
  );
}
