import Link from "next/link";
import {
  Clock,
  Users,
  Bell,
  QrCode,
  BarChart3,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "مسح QR Code",
    description: "الزبون يمسح الكود عند المحل ويحصل على رقمه فوراً بدون تحميل أي تطبيق",
  },
  {
    icon: Clock,
    title: "وقت الانتظار المتوقع",
    description: "يعرف الزبون كم شخص قبله والوقت المتوقع لدوره بدقة",
  },
  {
    icon: Bell,
    title: "تنبيه فوري",
    description: "يصل الزبون تنبيه في المتصفح لما دوره يقرب - بدون ما يفضل واقف",
  },
  {
    icon: Users,
    title: "إدارة الطابور",
    description: "صاحب المحل يدير الطابور بضغطة زر: ينادي التالي، يتخطى، يلغي",
  },
  {
    icon: BarChart3,
    title: "إحصائيات ذكية",
    description: "تقارير عن أوقات الذروة ومتوسط الانتظار وعدد الزبائن",
  },
  {
    icon: Smartphone,
    title: "يعمل على أي جهاز",
    description: "تصميم متجاوب يعمل على الموبايل والتابلت والكمبيوتر",
  },
];

const steps = [
  {
    number: "١",
    title: "سجّل محلك",
    description: "أنشئ حساب مجاني وأضف بيانات محلك في دقيقة واحدة",
  },
  {
    number: "٢",
    title: "اطبع الـ QR Code",
    description: "حمّل الكود المخصص لمحلك وعلّقه في مكان واضح",
  },
  {
    number: "٣",
    title: "ابدأ استقبال الزبائن",
    description: "الزبائن يمسحوا الكود وأنت تدير الطابور من لوحة التحكم",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            دورك
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" className="text-base dark:text-gray-300">الأسعار</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" className="text-base dark:text-gray-300">تسجيل الدخول</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="text-base bg-blue-600 hover:bg-blue-700">
                سجّل محلك مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <CheckCircle2 className="h-4 w-4" />
          مجاني بالكامل لأول 100 محل - بدون بطاقة ائتمان
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          وداعاً للطوابير الطويلة
          <br />
          <span className="text-blue-600 dark:text-blue-400">أهلاً بالنظام الرقمي</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          نظام ذكي لإدارة قوائم الانتظار. زبائنك ياخدوا رقمهم من الموبايل
          ويتابعوا دورهم لحظة بلحظة بدون ما يفضلوا واقفين
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              ابدأ الآن مجاناً
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 rounded-xl dark:border-gray-600 dark:text-gray-200"
            >
              عرض الأسعار
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            كل اللي محتاجه في مكان واحد
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            أدوات بسيطة وفعّالة لإدارة طابور محلك
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-white dark:bg-gray-800"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              إزاي بيشتغل؟
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">ثلاث خطوات بس وتبدأ</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop types */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            يناسب كل أنواع المحلات
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            "حلاق",
            "مطعم",
            "عيادة",
            "صيدلية",
            "بنك",
            "جهة حكومية",
            "مغسلة",
            "ورشة",
            "مختبر",
          ].map((type) => (
            <span
              key={type}
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 font-medium hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-default"
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 dark:bg-blue-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            جاهز تنظّم طابور محلك؟
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            سجّل الآن مجاناً وابدأ في أقل من دقيقة
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 rounded-xl font-bold"
              >
                سجّل محلك الآن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-xl font-bold border-white/30 text-white hover:bg-white/10"
              >
                عرض الباقات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xl font-bold text-white mb-2">دورك</p>
          <p className="text-sm">
            نظام قوائم الانتظار الرقمية - صنع بحب في مصر
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/pricing" className="text-sm hover:text-white transition-colors">
              الأسعار
            </Link>
            <span>·</span>
            <Link href="/sign-in" className="text-sm hover:text-white transition-colors">
              تسجيل الدخول
            </Link>
            <span>·</span>
            <Link href="/sign-up" className="text-sm hover:text-white transition-colors">
              إنشاء حساب
            </Link>
          </div>
          <p className="text-xs mt-4">
            &copy; {new Date().getFullYear()} دورك. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
