import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          الصفحة مش موجودة
        </h2>
        <p className="text-gray-500 mb-6">
          الرابط ده غلط أو المحل مش موجود
        </p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">
            الرجوع للصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}
