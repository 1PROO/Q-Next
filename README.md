# دورك (Dawrak) - نظام إدارة الطوابير الرقمية الذكي 🚀

**دورك** هو نظام MVP متطور لإدارة قوائم الانتظار، مصمم خصيصاً للمحلات الخدمية (حلاقين، عيادات، مطاعم) في السوق العربي. النظام يعتمد على مبدأ "امسح الكود وخد رقمك" بدون الحاجة لتحميل أي تطبيق.

---

## 🛠 التكنولوجيا المستخدمة (Tech Stack)
*   **Framework:** Next.js (App Router) - النسخة الحديثة (V16.x) مع دعم `Turbopack`.
*   **Authentication:** [Clerk](https://clerk.com/) لإدارة حسابات أصحاب المحلات والأدمن.
*   **Database & Realtime:** [Supabase](https://supabase.com/) (PostgreSQL) مع تفعيل الـ Realtime لتحديث الطابور لحظياً.
*   **Styling:** Tailwind CSS + Shadcn UI.
*   **Fonts:** Cairo (خط القاهرة) كخط أساسي للنظام لتوفير أفضل تجربة مستخدم عربية.

---

## 🏗 هيكل المشروع (Project Structure)
*   `src/app/q/[slug]`: الصفحة العامة التي يراها الزبون بعد مسح الـ QR Code للانضمام للطابور.
*   `src/app/dashboard`: لوحة تحكم صاحب المحل (إدارة الطابور، الإحصائيات، الـ QR Code، الإعدادات).
*   `src/app/admin`: لوحة التحكم العليا (للأدمن فقط) لإدارة جميع المحلات وتعديل باقات الاشتراك.
*   `src/proxy.ts`: المسؤول عن حماية المسارات (بديلاً لـ `middleware.ts` في هذه النسخة من Next.js).
*   `src/lib/supabase`: إعدادات الربط مع قاعدة البيانات (Client & Server Components).
*   `src/components`: تحتوي على المكونات الأساسية مثل `customer-queue.tsx` و `loading-skeleton.tsx`.

---

## ✨ الميزات الأساسية (Core Features)
1.  **نظام الطابور الذكي:** حساب وقت الانتظار المتوقع بناءً على أداء المحل الفعلي خلال اليوم.
2.  **نظام اشتراكات:** دعم 4 باقات (Free, Starter, Business, Premium) مع تحكم كامل من لوحة الأدمن.
3.  **حماية ضد الإساءة (Anti-Abuse):** استخدام بصمة الجهاز (Device Fingerprinting) لمنع إنشاء عدة محلات مجانية من نفس الجهاز.
4.  **تنبيهات صوتية وفورية:** تنبيه صوتي (Web Audio API) لصاحب المحل عند دخول زبون جديد، مع دعم Push Notifications للزبائن.
5.  **ملاحظات الزبائن:** إمكانية إضافة ملاحظات (مثل نوع الخدمة المطلوبة) تظهر لصاحب المحل فوراً.
6.  **الوضع الداكن (Dark Mode):** دعم كامل وشامل للوضع الليلي مع منع وميض الألوان عند التحميل (FOUC Prevention).

---

## 🔒 قاعدة البيانات (Database Schema)
*   `shops`: بيانات المحلات (الاسم، الرابط `slug` الفريد، النوع، رسالة الترحيب).
*   `queue_entries`: بيانات الزبائن (الاسم، رقم التذكرة، الملاحظات، الحالة: `waiting`, `serving`, `done`, `skipped`).
*   `subscriptions`: تتبع باقات المحلات وحالتها.
*   `daily_stats`: تخزين البيانات التاريخية للتحليل (أوقات الذروة، متوسط الانتظار).
*   `device_fingerprints`: ربط بصمة الجهاز بحساب المستخدم للأمان.

---

## 📝 ملاحظات تقنية هامة (للإدارة والتطوير)
*   **Middleware Migration:** تم تحويل `middleware.ts` إلى `proxy.ts` مع استخدام `export const proxy = ...` ليتوافق مع تحديثات Framework.
*   **Environment Variables:**
    *   `ADMIN_USER_ID`: يجب وضع الـ User ID الخاص بالأدمن من Clerk لفتح صلاحيات `/admin`.
    *   `NEXT_PUBLIC_APP_URL`: يجب تحديثه لرابط الدومين النهائي (مثلاً `https://q-next.codro.me`) لضمان عمل الـ QR Code بشكل صحيح.
*   **Performance:** النظام يستخدم `Dynamic Imports` و `Suspense` لضمان سرعة التحميل على شبكات الموبايل الضعيفة.
*   **Database Updates:** عند إضافة ميزات جديدة، تأكد من تحديث ملف `supabase/migration_v2.sql` وتشغيله في Supabase.

---

**تم التطوير بواسطة: Antigravity AI Assistant** 🚀
**أبريل 2026**
