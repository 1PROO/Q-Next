"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, BarChart3, QrCode, Settings, CreditCard, Moon, Sun, Palette } from "lucide-react";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "الطابور", icon: LayoutDashboard },
  { href: "/dashboard/stats", label: "إحصائيات", icon: BarChart3 },
  { href: "/dashboard/qrcode", label: "QR Code", icon: QrCode },
  { href: "/dashboard/customize", label: "تخصيص", icon: Palette },
  { href: "/dashboard/subscription", label: "الاشتراك", icon: CreditCard },
  { href: "/dashboard/setup", label: "إعدادات", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 rounded-lg p-1 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200 dark:shadow-none">
                <img src="/logo.png" alt="Dawrak Logo" className="h-6 w-6 invert brightness-0" />
              </div>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                دورك
              </span>
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

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
