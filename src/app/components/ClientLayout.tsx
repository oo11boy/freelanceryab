'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import BottomNav from './BottomNav';
import Header from './Header';
import Footer from './Footer';
import { useUILayout } from '@/app/hooks/useUILayout';
import { usePushSubscription } from '@/app/hooks/usePushSubscription';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hideHeader } = useUILayout();
  const { subscribe, permission } = usePushSubscription();
  const initRef = useRef(false);

  // 🔔 ثبت Web Push (یه بار، بعد از mount)
  useEffect(() => {
    if (initRef.current) return;
    if (typeof window === 'undefined') return;

    // چک پشتیبانی
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ Push not supported in this browser');
      return;
    }

    // اگه قبلاً مجوز داده شده → دوباره ثبت کن
    if (Notification.permission === 'granted') {
      initRef.current = true;
      const timer = setTimeout(() => subscribe(), 3000);
      return () => clearTimeout(timer);
    }

    // اگه هنوز تصمیم نگرفته → بعد از ۱۰ ثانیه درخواست بده
    // (بعد از اینکه کاربر یه صفحه رو دید، نه همون اول)
    if (Notification.permission === 'default') {
      initRef.current = true;
      const timer = setTimeout(() => {
        // فقط اگه کاربر هنوز تصمیم نگرفته
        if (Notification.permission === 'default') {
          subscribe();
        }
      }, 10000);
      return () => clearTimeout(timer);
    }

    // اگه رد کرده (denied) → کاری نکن
    initRef.current = true;
  }, [subscribe]);

  // 🔑 صفحه /admin نباید wrapper، Header، Footer و BottomNav داشته باشه
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* ===== موبایل و تبلت کوچک: تجربه اپ‌مانند (بدون Header سراسری) ===== */}
      <div className="lg:hidden max-w-md mx-auto bg-gray-100 relative pb-20 min-h-screen">
        {children}
        <BottomNav />
      </div>

      {/* ===== دسکتاپ (lg+): Header + Footer همیشگی ===== */}
      <div className="hidden lg:flex lg:flex-col bg-gray-50 min-h-screen">
        {!hideHeader && <Header />}

        {/* main با flex-1 → فضای بین Header و Footer را پر می‌کند */}
        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}