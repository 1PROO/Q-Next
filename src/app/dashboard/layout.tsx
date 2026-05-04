"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, BarChart3, QrCode, Settings, CreditCard, Moon, Sun, Palette, Bell, X, MessageSquare } from "lucide-react";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "الطابور", icon: LayoutDashboard },
  { href: "/dashboard/stats", label: "إحصائيات", icon: BarChart3 },
  { href: "/dashboard/qrcode", label: "QR Code", icon: QrCode },
  { href: "/dashboard/customize", label: "تخصيص", icon: Palette },
  { href: "/dashboard/subscription", label: "الاشتراك", icon: CreditCard },
  { href: "/dashboard/support", label: "الدعم", icon: MessageSquare },
  { href: "/dashboard/setup", label: "إعدادات", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch("/api/shop");
        if (res.ok) {
          const data = await res.json();
          if (data && data.notifications) {
            setNotifications(data.notifications);
          }
        }
      } catch (e) {}
    }
    checkNotifications();
  }, [pathname]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_notification", notification_id: id }),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              دورك
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="h-9 w-9 p-0 text-gray-600 dark:text-gray-300"
              aria-label={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <UserButton />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t dark:border-gray-700 flex items-center justify-around py-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4 space-y-2">
          {notifications.map(n => (
            <div key={n.id} className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-200">تنبيه جديد</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{n.content}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)} className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
