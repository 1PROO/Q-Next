import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "دورك - نظام قوائم الانتظار الرقمية",
  description:
    "نظام ذكي لإدارة قوائم الانتظار في المحلات الخدمية. وداعاً للطوابير الطويلة!",
  keywords: ["قوائم انتظار", "طابور رقمي", "إدارة المحلات", "دورك"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={arSA}>
      <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-[family-name:var(--font-cairo)]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
