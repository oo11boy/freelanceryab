'use client';
import { useState, useEffect } from 'react';
import { usePushSubscription } from '@/app/hooks/usePushSubscription';
import { useAuth } from '@/app/hooks/useAuth';

const STORAGE_KEY = 'notification_prompt_shown';

export default function NotificationPrompt() {
  const { token } = useAuth();
  const { permission, subscribe, loading } = usePushSubscription();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!token) return;

    // چک پشتیبانی
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    // اگه قبلاً نشون داده شده → نشون نده
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;

    // اگه permission granted یا denied → نشون نده
    if (Notification.permission !== 'default') return;

    // بعد از ۵ ثانیه نشون بده
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [token]);

  // اگه permission عوض شد (مثلاً Allow داد) → ببند
  useEffect(() => {
    if (permission === 'granted' || permission === 'denied') {
      setShow(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [permission]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShow(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const handleLater = () => {
    setShow(false);
    setDismissed(true);
    // ۷ روز بعد دوباره نشون بده
    const tomorrow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(tomorrow));
  };

  // چک کن مودال باید نشون داده بشه
  const shouldShow = () => {
    if (!show || dismissed) return false;
    if (permission !== 'default') return false;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return false;
    
    // اگه timestamp هست (۷ روز)
    if (stored && !isNaN(Number(stored))) {
      return Date.now() > Number(stored);
    }
    
    return true;
  };

  if (!shouldShow()) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
        {/* هدر با گرادیانت */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl shadow-lg animate-bounce-slow">
              🔔
            </div>
            <h2 className="text-xl font-bold text-center mb-2">
              اعلان‌ها رو فعال کن!
            </h2>
            <p className="text-sm text-center text-white/90 leading-relaxed">
              تا از پیام‌ها، تأیید آگهی و پیشنهادهای جدید باخبر بشی
            </p>
          </div>
        </div>

        {/* محتوا */}
        <div className="p-6">
          {/* مزایا */}
          <div className="space-y-3 mb-6">
            <Benefit icon="💬" title="پیام‌های جدید" desc="وقتی کسی بهت پیام می‌ده، فوری باخبر شی" />
            <Benefit icon="✅" title="تأیید یا رد آگهی" desc="نتیجه بررسی آگهی‌هات رو در لحظه بدون" />
            <Benefit icon="🤝" title="پیشنهادهای جدید" desc="پروژه‌های مناسب رو از دست نده" />
            <Benefit icon="⭐" title="نظرات و امتیازها" desc="نظرات جدید روی پروفایلت رو ببین" />
          </div>

          {/* دکمه‌ها */}
          <div className="space-y-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال فعال‌سازی...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  فعال‌سازی اعلان‌ها
                </>
              )}
            </button>

            <button
              onClick={handleLater}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              بعداً
            </button>
          </div>

          {/* نکته */}
          <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
            🔒 اعلان‌ها فقط برای اطلاع‌رسانی مهم هستن و هرگز مزاحمتی ایجاد نمی‌کنن
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function Benefit({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-lg shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-800">{title}</div>
        <div className="text-[11px] text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}