"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, Image as ImageIcon, CheckCircle2, Lock, Sparkles } from "lucide-react";
import type { Shop } from "@/lib/types";
import Link from "next/link";

export default function CustomizePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");

  useEffect(() => {
    async function fetchShop() {
      const res = await fetch("/api/shop");
      if (res.ok) {
        const data = await res.json();
        setShop(data);
        setLogoUrl(data.logo_url || "");
        setPrimaryColor(data.primary_color || "#1e40af");
      }
      setLoading(false);
    }
    fetchShop();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl,
          primary_color: primaryColor,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!shop) return null;

  const subscription = (shop as any)?.subscription;
  const isProOrLifetime = subscription?.plan === "lifetime" || subscription?.plan === "premium";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تخصيص الصفحة</h1>
          <p className="text-gray-500 dark:text-gray-400">خصص شكل صفحة الزبائن بشعارك وألوانك</p>
        </div>
        {!isProOrLifetime && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Lock className="h-3 w-3 ml-1" />
            ميزة مدفوعة
          </Badge>
        )}
      </div>

      {!isProOrLifetime && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                ترقية لـ "مدى الحياة"
              </h3>
              <p className="text-blue-100 opacity-90">
                احصل على صفحة احترافية بشعارك، ألوانك الخاصة، و QR Code ثابت للأبد.
              </p>
            </div>
            <Link href="/dashboard/subscription">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8">
                اشترك الآن
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className={!isProOrLifetime ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            شعار المحل (Logo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رابط الصورة
            </label>
            <Input 
              placeholder="https://example.com/logo.png" 
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-2">
              يفضل استخدام صورة بخلفية شفافة (PNG) وبمقاس مربع.
            </p>
          </div>

          {logoUrl && (
            <div className="p-4 border rounded-xl bg-gray-50 flex items-center justify-center">
              <img src={logoUrl} alt="Preview" className="h-20 w-20 object-contain" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={!isProOrLifetime ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            لون الصفحة الأساسي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {["#1e40af", "#059669", "#7c3aed", "#db2777", "#ea580c", "#111827"].map((color) => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  primaryColor === color ? "border-white shadow-lg scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="relative">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-full border-4 border-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: `${primaryColor}10`, borderColor: primaryColor }}>
            <p className="font-bold" style={{ color: primaryColor }}>معاينة اللون المختار</p>
            <Button className="mt-2 text-white" style={{ backgroundColor: primaryColor }}>
              هذا هو لون الأزرار
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {success && (
          <div className="flex items-center text-green-600 font-medium animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 className="h-5 w-5 ml-2" />
            تم الحفظ بنجاح!
          </div>
        )}
        <Button 
          disabled={!isProOrLifetime || saving} 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 px-8"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
}
