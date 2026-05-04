"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Shop, type Subscription, type Plan, type SystemSettings } from "@/lib/types";
import {
  Store,
  Users,
  ShoppingCart,
  TrendingUp,
  Loader2,
  ShieldAlert,
  Power,
  PowerOff,
  Gift,
  Calendar,
  LayoutDashboard,
  Settings as SettingsIcon,
  MessageSquare,
  CreditCard,
  Circle,
  Save,
  PlusCircle,
} from "lucide-react";
import { AdminSkeleton } from "@/components/loading-skeleton";

interface ShopWithSub extends Shop {
  subscription: Subscription | null;
}

interface AdminStats {
  total_shops: number;
  today_orders: number;
  top_shops: { shop_name: string; count: number }[];
  plan_distribution: Record<string, number>;
}

export default function AdminPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [shops, setShops] = useState<ShopWithSub[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Chat States
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [shopsRes, statsRes, plansRes, settingsRes] = await Promise.all([
        fetch("/api/admin"),
        fetch("/api/admin?action=stats"),
        fetch("/api/admin?action=plans"),
        fetch("/api/admin?action=settings"),
      ]);

      if (shopsRes.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (shopsRes.ok) setShops(await shopsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {
      // Error handling
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleActive(shopId: string) {
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", shop_id: shopId }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function changePlan(shopId: string, planSlug: string) {
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_plan", shop_id: shopId, plan: planSlug }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function giftDays(shopId: string, days: number) {
    if (!days || days <= 0) return;
    setActionLoading(shopId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gift_days", shop_id: shopId, days }),
    });
    await fetchData();
    setActionLoading(null);
  }

  async function updateSettings(key: string, value: any) {
    setActionLoading("settings");
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_settings", key, value }),
    });
    await fetchData();
    setActionLoading(null);
  }

  const fetchChat = async (shopId: string) => {
    try {
      const res = await fetch(`/api/messages?shop_id=${shopId}`);
      if (res.ok) setChatMessages(await res.json());
    } catch {}
  };

  const selectChat = (id: string, name: string) => {
    setActiveChat(id);
    setActiveChatName(name);
    fetchChat(id);
  };

  useEffect(() => {
    let interval: any;
    if (activeTab === "messages" && activeChat) {
      interval = setInterval(() => fetchChat(activeChat), 10000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    const text = chatInput;
    setChatInput("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, shop_id: activeChat }),
      });
      if (res.ok) {
        const newMessage = await res.json();
        setChatMessages(prev => [...prev, newMessage]);
      }
    } catch {}
  };

  if (loading) return <AdminSkeleton />;

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">غير مصرح</h2>
            <p className="text-gray-500 dark:text-gray-400">ليس لديك صلاحية الوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnline = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false;
    const diffMins = (new Date().getTime() - new Date(lastActiveAt).getTime()) / 60000;
    return diffMins < 10; // Online if active in last 10 mins
  };

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    premium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    lifetime: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">لوحة تحكم الأدمن</h1>
          </div>
          <Badge variant="outline" className="text-xs">Admin Portal</Badge>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Button variant={activeTab === "overview" ? "default" : "outline"} onClick={() => setActiveTab("overview")}>
            <LayoutDashboard className="h-4 w-4 ml-2" /> الإحصائيات
          </Button>
          <Button variant={activeTab === "shops" ? "default" : "outline"} onClick={() => setActiveTab("shops")}>
            <Store className="h-4 w-4 ml-2" /> المحلات ({shops.length})
          </Button>
          <Button variant={activeTab === "plans" ? "default" : "outline"} onClick={() => setActiveTab("plans")}>
            <CreditCard className="h-4 w-4 ml-2" /> الباقات والإعدادات
          </Button>
          <Button variant={activeTab === "messages" ? "default" : "outline"} onClick={() => setActiveTab("messages")}>
            <MessageSquare className="h-4 w-4 ml-2" /> الرسائل
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-5 text-center">
                  <Store className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total_shops}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المحلات</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                <CardContent className="p-5 text-center">
                  <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.today_orders}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">أوردرات اليوم</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-5 text-center">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {stats.plan_distribution.free || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">باقة مجانية</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
                <CardContent className="p-5 text-center">
                  <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {Object.values(stats.plan_distribution).reduce((a, b) => a + b, 0) - (stats.plan_distribution.free || 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">باقات مدفوعة</p>
                </CardContent>
              </Card>
            </div>

            {stats.top_shops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">أكثر المحلات نشاطاً اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.top_shops.map((shop, index) => (
                      <div key={shop.shop_name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{shop.shop_name}</span>
                        </div>
                        <Badge variant="outline">{shop.count} أوردر</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "shops" && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">إدارة المحلات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shops.map((shop) => (
                    <div key={shop.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isOnline(shop.last_active_at) ? (
                            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                          ) : (
                            <Circle className="h-3 w-3 fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600" />
                          )}
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{shop.name}</h3>
                          {!shop.is_active && <Badge variant="destructive" className="text-xs">معطل</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{shop.type}</span>
                          <span>·</span>
                          <span>{new Date(shop.created_at).toLocaleDateString("ar-EG")}</span>
                          <span>·</span>
                          <span>/q/{shop.slug}</span>
                          {shop.subscription?.expires_at && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Calendar className="h-3 w-3" />
                                ينتهي في: {new Date(shop.subscription.expires_at).toLocaleDateString("ar-EG")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                        <Select
                          value={shop.subscription?.plan || "free"}
                          onValueChange={(v) => changePlan(shop.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.length > 0 ? plans.map(p => (
                               <SelectItem key={p.slug} value={p.slug}>{p.name_ar}</SelectItem>
                            )) : (
                               <>
                                <SelectItem value="free">مجاني</SelectItem>
                                <SelectItem value="premium">برو (تجريبي)</SelectItem>
                                <SelectItem value="lifetime">مدى الحياة</SelectItem>
                               </>
                            )}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center border rounded-md overflow-hidden h-8">
                          <input
                            type="number"
                            placeholder="أيام"
                            className="w-12 h-full text-xs px-1 border-0 focus:ring-0 text-center dark:bg-gray-700"
                            id={`gift-${shop.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`gift-${shop.id}`) as HTMLInputElement;
                              giftDays(shop.id, parseInt(input.value));
                              input.value = "";
                            }}
                            disabled={actionLoading === shop.id}
                            className="h-full px-2 rounded-none bg-amber-50 text-amber-700 hover:bg-amber-100 border-r"
                          >
                            <Gift className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(shop.id)}
                          disabled={actionLoading === shop.id}
                          className={`h-8 text-xs ${shop.is_active ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"}`}
                        >
                          {actionLoading === shop.id ? <Loader2 className="h-3 w-3 animate-spin" /> : shop.is_active ? <><PowerOff className="h-3 w-3 ml-1" /> إيقاف</> : <><Power className="h-3 w-3 ml-1" /> تفعيل</>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-gray-500" /> إعدادات صفحة الأسعار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.pricing_page && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">العنوان الرئيسي</label>
                      <input 
                        type="text" 
                        defaultValue={settings.pricing_page.title}
                        id="setting-title"
                        className="w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">نص الهدية (Promo)</label>
                      <input 
                        type="text" 
                        defaultValue={settings.pricing_page.promo_text}
                        id="setting-promo"
                        className="w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-amber-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">أيام الهدية التلقائية للتسجيل الجديد</label>
                      <input 
                        type="number" 
                        defaultValue={settings.pricing_page.promo_days}
                        id="setting-days"
                        className="w-full text-sm p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                         const title = (document.getElementById('setting-title') as HTMLInputElement).value;
                         const promo = (document.getElementById('setting-promo') as HTMLInputElement).value;
                         const days = parseInt((document.getElementById('setting-days') as HTMLInputElement).value);
                         updateSettings('pricing_page', { ...settings.pricing_page, title, promo_text: promo, promo_days: days });
                      }}
                      disabled={actionLoading === "settings"}
                    >
                      {actionLoading === "settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 ml-2" /> حفظ الإعدادات</>}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">الباقات الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                   {plans.map(p => (
                     <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                       <div>
                         <p className="font-bold">{p.name_ar}</p>
                         <p className="text-xs text-gray-500">{p.price} ج.م - {p.duration_days ? p.duration_days + ' يوم' : 'مدى الحياة'}</p>
                       </div>
                       <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "نشط" : "معطل"}</Badge>
                     </div>
                   ))}
                   <Button variant="outline" className="w-full border-dashed">
                      <PlusCircle className="h-4 w-4 ml-2" />
                      إضافة باقة جديدة (قريباً)
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "messages" && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 h-[600px]">
             <Card className="md:col-span-1 overflow-y-auto">
               <CardHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700 p-4">
                 <CardTitle className="text-lg">المحادثات</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 {shops.map(shop => {
                   // A very simple shop list for chat selection
                   return (
                     <div 
                       key={shop.id} 
                       onClick={() => {
                         // Fetch messages for this shop
                         // Note: In a real app we'd keep track of selected shop state and fetch
                         // For brevity, we could just alert or use a sub-state.
                         // We will implement a proper sub-state for this below.
                         // But since we are restricted in simple React without rewriting the whole component,
                         // I will just add an id to click on.
                         selectChat(shop.id, shop.name);
                       }}
                       className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 ${activeChat === shop.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600" : ""}`}
                     >
                       {isOnline(shop.last_active_at) ? (
                         <Circle className="h-3 w-3 fill-green-500 text-green-500 flex-shrink-0" />
                       ) : (
                         <Circle className="h-3 w-3 fill-gray-300 text-gray-300 dark:fill-gray-600 flex-shrink-0" />
                       )}
                       <div className="min-w-0 flex-1">
                         <p className="font-bold truncate dark:text-white">{shop.name}</p>
                         <p className="text-xs text-gray-500 truncate">{shop.subscription?.plan === 'lifetime' || shop.subscription?.plan === 'premium' ? 'VIP 👑' : 'مجاني'}</p>
                       </div>
                     </div>
                   )
                 })}
               </CardContent>
             </Card>

             <Card className="md:col-span-2 flex flex-col h-full">
               <CardHeader className="border-b dark:border-gray-700 p-4">
                 <CardTitle className="text-lg">{activeChatName || "اختر محادثة للبدء"}</CardTitle>
               </CardHeader>
               <CardContent className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                 {!activeChat ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <MessageSquare className="h-12 w-12 opacity-20 mb-2" />
                     <p>لم يتم اختيار أي محادثة</p>
                   </div>
                 ) : chatMessages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <p>لا توجد رسائل سابقة.</p>
                   </div>
                 ) : (
                   chatMessages.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.sender === "admin" ? "items-end" : "items-start"}`}>
                       <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === "admin" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-tl-sm"}`}>
                         <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                       </div>
                       <span className="text-[10px] text-gray-400 mt-1 mx-1">
                         {new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                       </span>
                     </div>
                   ))
                 )}
                 <div ref={chatEndRef} />
               </CardContent>
               <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                 <form onSubmit={sendAdminMessage} className="flex gap-2">
                   <input 
                     type="text" 
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                     disabled={!activeChat}
                     placeholder="اكتب رسالتك هنا..." 
                     className="flex-1 rounded-md border p-2 text-sm dark:bg-gray-900 dark:border-gray-700" 
                   />
                   <Button disabled={!activeChat || !chatInput.trim()}>إرسال</Button>
                 </form>
               </div>
             </Card>
           </div>
        )}

      </div>
    </div>
  );
}
