'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useUILayout } from '@/app/hooks/useUILayout';
import { messagesAPI } from '@/app/services/api';

const navItems = [
  {
    name: 'خانه',
    href: '/',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'جستجو',
    href: '/explore',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    name: 'ثبت آگهی',
    href: '/create-post',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    isPrimary: true,
  },
  {
    name: 'پیام‌ها',
    href: '/messages',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    name: 'پروفایل',
    href: '/profile',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { token } = useAuth();
  const { hideBottomNav } = useUILayout();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // بارگذاری تعداد پیام‌های خوانده‌نشده
  useEffect(() => {
    if (!token) return;

    loadUnreadMessages();

    // هر ۳۰ ثانیه یک‌بار رفرش (سبک)
    const interval = setInterval(loadUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // بارگذاری مجدد هنگام تغییر مسیر (مثلاً وقتی از صفحه پیام‌ها برمی‌گردیم)
  useEffect(() => {
    if (token) loadUnreadMessages();
  }, [pathname, token]);

  const loadUnreadMessages = async () => {
    try {
      const data = await messagesAPI.getConversations();
      const total = (data.conversations || []).reduce(
        (sum: number, c: any) => sum + (c.unread_count || 0),
        0
      );
      setUnreadMessages(total);
    } catch (error) {
      // بی‌صدا fail کن - badge مهم نیست
    }
  };

  if (hideBottomNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      {/* سایه بالای نوار */}
      <div className="absolute -top-3 left-0 right-0 h-3 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

      <div className="relative bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-end px-1 pt-1.5 pb-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            // دکمه مرکزی برجسته (ثبت آگهی)
            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center -mt-5 shrink-0"
                  aria-label={item.name}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-90 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/40 scale-105'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            }

            const showBadge = item.name === 'پیام‌ها' && unreadMessages > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all active:scale-95 relative flex-1 max-w-[68px]"
                aria-label={item.name}
              >
                {/* پس‌زمینه فعال */}
                {isActive && (
                  <div className="absolute inset-x-2 inset-y-1 bg-blue-50 rounded-xl -z-0" />
                )}

                <div
                  className={`relative z-10 transition-all ${
                    isActive ? 'text-blue-600 scale-110' : 'text-gray-500'
                  }`}
                >
                  {item.icon}

                  {/* Badge پیام‌ها */}
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>

                <span
                  className={`relative z-10 text-[10px] mt-0.5 transition-all truncate ${
                    isActive ? 'font-bold text-blue-600' : 'font-medium text-gray-500'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* نشانگر پایین صفحه (home indicator style) */}
        <div className="h-[2px] mx-auto w-12 bg-gray-200 rounded-full mb-1.5" />
      </div>
    </nav>
  );
}