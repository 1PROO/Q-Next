import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Settings, BarChart3, QrCode } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-extrabold text-blue-600">
              دورك
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                الطابور
              </Link>
              <Link
                href="/dashboard/stats"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                الإحصائيات
              </Link>
              <Link
                href="/dashboard/qrcode"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </Link>
              <Link
                href="/dashboard/setup"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                إعدادات المحل
              </Link>
            </div>
          </div>
          <UserButton />
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t flex items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-gray-600"
          >
            <LayoutDashboard className="h-5 w-5" />
            الطابور
          </Link>
          <Link
            href="/dashboard/stats"
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-gray-600"
          >
            <BarChart3 className="h-5 w-5" />
            إحصائيات
          </Link>
          <Link
            href="/dashboard/qrcode"
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-gray-600"
          >
            <QrCode className="h-5 w-5" />
            QR Code
          </Link>
          <Link
            href="/dashboard/setup"
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-gray-600"
          >
            <Settings className="h-5 w-5" />
            إعدادات
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
