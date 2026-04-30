# دورك - نظام قوائم الانتظار الرقمية

نظام SaaS لإدارة قوائم الانتظار في المحلات الخدمية في مصر. بدل الطوابير الطويلة، الزبون يمسح QR Code ويحصل على رقم رقمي ويتابع دوره من موبايله.

## المميزات

- **للزبائن:** مسح QR Code -> أخذ رقم -> متابعة الدور لحظة بلحظة -> تنبيه قبل الدور
- **لصاحب المحل:** لوحة تحكم بسيطة -> إدارة الطابور -> إحصائيات -> QR Code تلقائي
- **بدون تحميل:** يعمل من المتصفح مباشرة
- **Real-time:** تحديثات لحظية عبر Supabase Realtime
- **موبايل أولاً:** تصميم متجاوب يعمل على كل الأجهزة
- **عربي بالكامل:** واجهة RTL كاملة

## التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| Next.js (App Router) | الإطار الأساسي |
| TypeScript | لغة البرمجة |
| Tailwind CSS + shadcn/ui | التصميم |
| Clerk | تسجيل الدخول والمصادقة |
| Supabase | قاعدة البيانات + Real-time |
| Browser Push Notifications | التنبيهات |
| QRCode.react | توليد QR Code |

## هيكل المشروع

```
dawrak/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # صفحة الهبوط
│   │   ├── layout.tsx                  # Layout رئيسي (RTL + Clerk)
│   │   ├── not-found.tsx               # صفحة 404
│   │   ├── q/[slug]/page.tsx           # صفحة الزبون (الطابور)
│   │   ├── sign-in/[[...sign-in]]/     # تسجيل الدخول
│   │   ├── sign-up/[[...sign-up]]/     # إنشاء حساب
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Layout لوحة التحكم
│   │   │   ├── page.tsx                # إدارة الطابور
│   │   │   ├── setup/page.tsx          # إعداد المحل
│   │   │   ├── stats/page.tsx          # الإحصائيات
│   │   │   └── qrcode/page.tsx         # QR Code
│   │   └── api/
│   │       ├── queue/join/route.ts     # انضمام للطابور
│   │       ├── queue/manage/route.ts   # إدارة الطابور
│   │       └── shop/route.ts           # إدارة المحل
│   ├── components/
│   │   ├── ui/                         # مكونات shadcn/ui
│   │   └── customer-queue.tsx          # مكون صفحة الزبون
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase client-side
│   │   │   └── server.ts             # Supabase server-side
│   │   ├── types.ts                   # TypeScript types
│   │   └── utils.ts                   # أدوات مساعدة
│   └── middleware.ts                   # Clerk middleware
├── supabase/
│   └── migration.sql                   # SQL لإنشاء الجداول
├── .env.local                          # متغيرات البيئة
└── README.md
```

## طريقة التشغيل

### 1. المتطلبات
- Node.js 18+
- حساب [Clerk](https://clerk.com) (مجاني)
- حساب [Supabase](https://supabase.com) (مجاني)

### 2. تثبيت المشروع
```bash
cd dawrak
npm install
```

### 3. إعداد قاعدة البيانات
1. أنشئ مشروع جديد في Supabase
2. اذهب إلى SQL Editor
3. انسخ محتوى `supabase/migration.sql` ونفذه
4. تأكد من تفعيل Realtime على جدول `queue_entries`

### 4. إعداد المتغيرات
أنشئ ملف `.env.local` وأضف:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/setup
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. تشغيل المشروع
```bash
npm run dev
```
المشروع هيشتغل على `http://localhost:3000`

### 6. النشر على Vercel
```bash
npx vercel
```

## طريقة الاستخدام

### لصاحب المحل:
1. سجّل حساب من `/sign-up`
2. أعد بيانات محلك من `/dashboard/setup`
3. حمّل الـ QR Code من `/dashboard/qrcode`
4. ابدأ استقبال الزبائن من `/dashboard`

### للزبون:
1. امسح QR Code بالموبايل
2. ادخل اسمك (اختياري) واضغط "خد رقمك"
3. تابع دورك وفعّل التنبيهات

## قاعدة البيانات

### جداول:
- **shops** - بيانات المحلات
- **queue_entries** - سجل الطابور (waiting/serving/done/skipped)
- **daily_stats** - إحصائيات يومية

## الرخصة
MIT
