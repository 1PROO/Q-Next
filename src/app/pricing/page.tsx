import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Star, Zap, Crown } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "مجاني",
    price: "0",
    period: "",
    description: "لأول 100 محل يسجل",
    icon: CheckCircle2,
    color: "blue",
    features: [
      "حتى 50 أوردر/يوم",
      "QR Code مخصص",
      "إدارة الطابور",
      "تنبيهات المتصفح",
      "إحصائيات أساسية",
    ],
    cta: "ابدأ مجاناً",
    popular: false,
  },
  {
    id: "starter",
    name: "ستارتر",
    price: "149",
    period: "/شهر",
    description: "للمحلات الصغيرة",
    icon: Star,
    color: "indigo",
    features: [
      "حتى 50 زبون/يوم",
      "QR Code مخصص",
      "إدارة الطابور",
      "تنبيهات المتصفح",
      "إحصائيات أساسية",
      "رسالة ترحيبية مخصصة",
    ],
    cta: "اشترك الآن",
    popular: false,
  },
  {
    id: "business",
    name: "بيزنس",
    price: "299",
    period: "/شهر",
    description: "للمحلات المتوسطة والكبيرة",
    icon: Zap,
    color: "purple",
    features: [
      "عدد غير محدود من الزبائن",
      "إحصائيات متقدمة",
      "براند مخصص",
      "رسالة ترحيبية مخصصة",
      "ملاحظات من الزبون",
      "صوت تنبيه لدخول زبون جديد",
      "وقت انتظار أدق",
    ],
    cta: "اشترك الآن",
    popular: true,
  },
  {
    id: "premium",
    name: "بريميوم",
    price: "499",
    period: "/شهر",
    description: "للسلاسل والفروع المتعددة",
    icon: Crown,
    color: "amber",
    features: [
      "كل مميزات بيزنس",
      "فروع متعددة",
      "رسائل SMS",
      "أولوية في الدعم الفني",
      "تقارير متقدمة",
      "API خاص",
    ],
    cta: "اشترك الآن",
    popular: false,
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">
            دورك
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-base">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="text-base bg-blue-600 hover:bg-blue-700">
                سجّل محلك
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          باقات بسيطة وواضحة
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          اختار الباقة اللي تناسب محلك. أول 100 محل يسجل هياخد الخدمة مجاناً بالكامل!
        </p>
      </section>

      {/* Plans Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = colorMap[plan.color];
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? `ring-2 ring-purple-500 shadow-xl ${colors.border}`
                    : `shadow-md ${colors.border}`
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white text-xs px-3 py-1">
                      الأكثر شعبية
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <div
                    className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3`}
                  >
                    <plan.icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <CardTitle className="text-xl dark:text-white">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div>
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "0" && (
                      <span className="text-gray-500 dark:text-gray-400 mr-1">ج.م</span>
                    )}
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 text-sm text-right">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 flex-shrink-0 ${colors.text}`}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/sign-up" className="block">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {plan.cta}
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
            أسئلة شائعة
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "هل الباقة المجانية فعلاً مجانية؟",
                a: "أيوه، أول 100 محل يسجل هياخد الخدمة مجاناً بحد أقصى 50 أوردر في اليوم. بدون بطاقة ائتمان.",
              },
              {
                q: "أقدر أغير الباقة بعدين؟",
                a: "طبعاً! تقدر تترقى لأي باقة في أي وقت من لوحة التحكم.",
              },
              {
                q: "إيه طريقة الدفع؟",
                a: "حالياً بنتواصل معاك شخصياً لترتيب الدفع. قريباً هيكون في بوابة دفع أونلاين.",
              },
              {
                q: "في فترة تجريبية؟",
                a: "الباقة المجانية هي تجربتك! لو عجبك الموضوع، تقدر تترقى في أي وقت.",
              },
            ].map((faq) => (
              <Card key={faq.q} className="shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xl font-bold text-white mb-2">دورك</p>
          <p className="text-sm">نظام قوائم الانتظار الرقمية</p>
        </div>
      </footer>
    </div>
  );
}
