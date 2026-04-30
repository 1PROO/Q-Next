"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHOP_TYPES, type ShopType, type Shop } from "@/lib/types";
import { Loader2, Store, CheckCircle2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<ShopType>("barber");
  const [servicePoints, setServicePoints] = useState("1");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingShop, setExistingShop] = useState<Shop | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      const res = await fetch("/api/shop");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setExistingShop(data);
          setName(data.name);
          setSlug(data.slug);
          setType(data.type);
          setServicePoints(String(data.service_points));
          setWelcomeMessage(data.welcome_message || "");
        }
      }
      setPageLoading(false);
    }
    fetchShop();
  }, []);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: generateSlug(slug),
          type,
          service_points: parseInt(servicePoints) || 1,
          welcome_message: welcomeMessage,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSettings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcome_message: welcomeMessage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setExistingShop(data);
        setError(""); // Clear any previous errors
      } else {
        setError("فشل في التحديث");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (existingShop) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="shadow-lg border-green-200 dark:border-green-800">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              محلك مُعد بالفعل!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              <strong>{existingShop.name}</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              الرابط: /q/{existingShop.slug}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                الذهاب للوحة التحكم
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/qrcode")}
              >
                عرض QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Welcome message settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">إعدادات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="welcomeMessage">رسالة ترحيبية للزبائن</Label>
              <Input
                id="welcomeMessage"
                placeholder="مثال: أهلاً بيك في صالون أحمد! ✂️"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">
                تظهر هذه الرسالة للزبون عند دخوله صفحة الطابور
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleUpdateSettings}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الإعدادات"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl dark:text-white">إعداد المحل</CardTitle>
          <p className="text-gray-500 dark:text-gray-400">أدخل بيانات محلك عشان تبدأ تستقبل زبائن</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">اسم المحل</Label>
              <Input
                id="name"
                placeholder="مثال: صالون أحمد"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === generateSlug(name)) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="slug">رابط المحل (بالإنجليزي)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  /q/
                </span>
                <Input
                  id="slug"
                  placeholder="ahmed-salon"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                هذا الرابط هيكون في الـ QR Code
              </p>
            </div>

            <div>
              <Label>نوع المحل</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ShopType)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHOP_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="servicePoints">عدد نقاط الخدمة</Label>
              <Input
                id="servicePoints"
                type="number"
                min="1"
                max="20"
                value={servicePoints}
                onChange={(e) => setServicePoints(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">
                كام شخص تقدر تخدم في نفس الوقت؟
              </p>
            </div>

            <div>
              <Label htmlFor="welcomeMsg">رسالة ترحيبية (اختياري)</Label>
              <Input
                id="welcomeMsg"
                placeholder="مثال: أهلاً بيك! ✂️"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">
                تظهر هذه الرسالة للزبون عند دخوله صفحة الطابور
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "أنشئ المحل"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
