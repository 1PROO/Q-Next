"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Shop } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, QrCode, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function QRCodePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchShop() {
      const res = await fetch("/api/shop");
      if (res.ok) {
        const data = await res.json();
        setShop(data);
      }
      setLoading(false);
    }
    fetchShop();
  }, []);

  const queueUrl = shop
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${shop.slug}`
    : "";

  function downloadQR() {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 0, 0, 1024, 1024);
      }

      const link = document.createElement("a");
      link.download = `dawrak-${shop?.slug || "qrcode"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  async function copyLink() {
    await navigator.clipboard.writeText(queueUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          لسه ما أعددت محلك
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">أعد محلك الأول عشان تحصل على QR Code</p>
        <Link href="/dashboard/setup">
          <Button className="bg-blue-600 hover:bg-blue-700">إعداد المحل</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code المحل</h1>
        <p className="text-gray-500 dark:text-gray-400">اطبعه وعلّقه في مكان واضح للزبائن</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl dark:text-white">{shop.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-8">
          <div
            ref={qrRef}
            className="bg-white p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-800 mb-6"
          >
            <QRCodeSVG
              value={queueUrl}
              size={256}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1e40af"
            />
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center" dir="ltr">
            {queueUrl}
          </p>

          <div className="flex gap-3 w-full">
            <Button
              onClick={downloadQR}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل PNG
            </Button>
            <Button
              variant="outline"
              onClick={copyLink}
              className="flex-1 dark:border-gray-700"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                  تم النسخ!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ الرابط
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-1">نصيحة</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                اطبع الـ QR Code بحجم كبير وعلّقه عند المدخل أو عند كاونتر
                الاستقبال. الزبائن هيمسحوه من موبايلاتهم ويحصلوا على رقمهم
                فوراً.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
