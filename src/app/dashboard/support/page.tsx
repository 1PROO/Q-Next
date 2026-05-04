"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, ShieldAlert } from "lucide-react";
import type { Message } from "@/lib/types";

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // In a real app we'd use Supabase realtime subscription here
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, shop_id: "" }), // API figures out shop_id if not admin
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        setText("");
      }
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الدعم الفني والرسائل</h1>
        <p className="text-gray-500 dark:text-gray-400">تواصل مع إدارة النظام لأي استفسار أو مشكلة</p>
      </div>

      <Card className="flex flex-col h-[600px]">
        <CardHeader className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            فريق الدعم (الإدارة)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-12 w-12 opacity-20 mb-2" />
              <p>لا توجد رسائل سابقة. أرسل رسالتك الآن!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "shop" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === "shop"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالتك للإدارة..."
              className="flex-1 dark:bg-gray-900 dark:border-gray-700"
            />
            <Button type="submit" disabled={sending || !text.trim()} className="bg-blue-600 hover:bg-blue-700">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-1" />}
              إرسال
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
