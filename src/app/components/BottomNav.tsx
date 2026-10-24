'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { notificationsAPI } from '@/app/services/api';

const navItems = [
  { name: 'خانه', href: '/', icon: '🏠' },
  { name: 'جستجو', href: '/explore', icon: '🔍' },
  { name: 'ثبت آگهی', href: '/create-post', icon: '➕' },
  { name: 'پیام‌ها', href: '/messages', icon: '💬' },
  { name: 'پروفایل', href: '/profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { token } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('خطا:', error);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            let badge = null;
            if (item.name === 'پیام‌ها' && unreadMessages > 0) {
              badge = unreadMessages;
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition-all relative ${
                  isActive ? 'text-blue-600 scale-105' : 'text-gray-500'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                <span className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center py-1 px-3 text-gray-500 relative"
          >
            <span className="text-2xl">⚙️</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-xs mt-1">بیشتر</span>
          </button>
        </div>
      </div>

      {/* مودال بیشتر */}
      {showMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">بیشتر</h3>
              <button onClick={() => setShowMore(false)} className="text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/notifications" onClick={() => setShowMore(false)} className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 relative">
                <div className="text-2xl mb-1">🔔</div>
                <div>اعلانات</div>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/saved" onClick={() => setShowMore(false)} className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                <div className="text-2xl mb-1">❤️</div>
                <div>ذخیره شده‌ها</div>
              </Link>
              <Link href="/rules" onClick={() => setShowMore(false)} className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                <div className="text-2xl mb-1">📜</div>
                <div>قوانین</div>
              </Link>
              <Link href="/about" onClick={() => setShowMore(false)} className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
                <div className="text-2xl mb-1">📖</div>
                <div>درباره ما</div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}