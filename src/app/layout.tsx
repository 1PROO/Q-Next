import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دورك - نظام قوائم الانتظار الرقمية",
  description:
    "نظام ذكي لإدارة قوائم الانتظار في المحلات الخدمية. وداعاً للطوابير الطويلة!",
  keywords: ["قوائم انتظار", "طابور رقمي", "إدارة المحلات", "دورك"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "دورك - نظام قوائم الانتظار الرقمية",
    description: "نظام ذكي لإدارة قوائم الانتظار. وداعاً للطوابير الطويلة!",
    type: "website",
    locale: "ar_EG",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={arSA}>
      <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  if (localStorage.getItem('dawrak-dark-mode') === 'true' ||
                      (!localStorage.getItem('dawrak-dark-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              `,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col font-[family-name:var(--font-cairo)]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
