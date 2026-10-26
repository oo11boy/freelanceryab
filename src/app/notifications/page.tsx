'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { notificationsAPI } from '@/app/services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: string; bg: string; iconBg: string; label: string }
> = {
  message: {
    icon: '💬',
    bg: 'from-blue-50 to-indigo-50',
    iconBg: 'bg-blue-100 text-blue-600',
    label: 'پیام',
  },
  offer: {
    icon: '🤝',
    bg: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100 text-green-600',
    label: 'پیشنهاد',
  },
  system: {
    icon: '⚙️',
    bg: 'from-gray-50 to-slate-50',
    iconBg: 'bg-gray-100 text-gray-600',
    label: 'سیستمی',
  },
  reminder: {
    icon: '⏰',
    bg: 'from-amber-50 to-orange-50',
    iconBg: 'bg-amber-100 text-amber-600',
    label: 'یادآوری',
  },
  info: {
    icon: 'ℹ️',
    bg: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-100 text-blue-600',
    label: 'اطلاع',
  },
  warning: {
    icon: '⚠️',
    bg: 'from-amber-50 to-red-50',
    iconBg: 'bg-amber-100 text-amber-700',
    label: 'اخطار',
  },
  success: {
    icon: '✅',
    bg: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100 text-green-700',
    label: 'موفقیت',
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push('/login');
      return;
    }
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

 const loadNotifications = async () => {
  try {
    const data = await notificationsAPI.getNotifications(50);
    // 🔑 اعلان‌های مربوط به پیام را حذف کن
    const filtered = (data.notifications || []).filter(
      (n: Notification) => n.type !== 'message'
    );
    setNotifications(filtered);
  } catch (error) {
    console.error('خطا:', error);
  } finally {
    setLoading(false);
  }
};

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('خطا:', error);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsAPI.markAsRead(undefined, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('خطا:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatDate = (date: string) => {
    try {
      const now = new Date();
      const notifDate = new Date(date);
      const diffMs = now.getTime() - notifDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'لحظاتی پیش';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      if (diffDays === 1) return 'دیروز';
      if (diffDays < 7) return `${diffDays} روز پیش`;
      return notifDate.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.is_read
  );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      {/* ===== نوار بالا موبایل ===== */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-800 text-center">
              اعلانات
            </h1>
            {unreadCount > 0 && (
              <p className="text-[10px] text-gray-500 text-center">
                {unreadCount} خوانده نشده
              </p>
            )}
          </div>
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {markingAll ? (
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              خواندن همه
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* فیلتر موبایل */}
        <div className="px-3 pb-3">
          <div className="bg-gray-100 rounded-xl p-1 flex">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              همه
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'all'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              خوانده نشده
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== هدر دسکتاپ ===== */}
      <div className="hidden lg:block max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🔔 اعلانات
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {unreadCount} جدید
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              تمام رویدادهای حساب خود را اینجا دنبال کنید
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-blue-300 hover:text-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {markingAll ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              خواندن همه
            </button>
          )}
        </div>

        {/* فیلتر دسکتاپ — به شکل پیل‌های مستقل */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            همه اعلانات
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            خوانده نشده
            {unreadCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  filter === 'unread'
                    ? 'bg-white/20 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== لیست ===== */}
      <div className="p-4 lg:max-w-5xl lg:mx-auto lg:px-6 lg:pt-2">
        {loading ? (
          <div className="space-y-3 lg:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm animate-pulse"
              >
                <div className="flex gap-3 lg:gap-4">
                  <div className="w-11 h-11 lg:w-14 lg:h-14 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 lg:h-5 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 lg:h-4 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 lg:h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2.5 lg:space-y-3">
            {filteredNotifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notif);
                    }
                  }}
                  className={`group relative bg-white rounded-2xl p-4 lg:p-5 shadow-sm border cursor-pointer transition-all active:scale-[0.99] lg:hover:shadow-md ${
                    !notif.is_read
                      ? 'border-blue-200 shadow-blue-100/50 lg:border-blue-300'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div
                      className={`w-11 h-11 lg:w-14 lg:h-14 rounded-xl ${config.iconBg} flex items-center justify-center text-xl lg:text-2xl shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5 lg:mb-1">
                        <h3
                          className={`font-semibold text-sm lg:text-base leading-relaxed ${
                            !notif.is_read
                              ? 'text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-[10px] lg:text-xs text-gray-400 whitespace-nowrap shrink-0">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-600 leading-relaxed line-clamp-2 lg:line-clamp-3">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 lg:gap-3 mt-2 lg:mt-3 flex-wrap">
                        <span
                          className={`text-[10px] lg:text-xs px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-md font-medium ${config.iconBg}`}
                        >
                          {config.label}
                        </span>
                        {!notif.is_read && (
                          <span className="text-[10px] lg:text-xs text-blue-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                            جدید
                          </span>
                        )}
                        {notif.link && (
                          <span className="text-[10px] lg:text-xs text-gray-400 mr-auto flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
                            مشاهده
                            <svg
                              className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    {!notif.is_read && (
                      <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5 lg:mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[60vh] lg:bg-white lg:rounded-2xl lg:shadow-sm lg:py-16">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-5xl lg:text-6xl mb-5 lg:mb-6">
              {filter === 'unread' ? '✅' : '🔔'}
            </div>
            <p className="text-lg lg:text-xl font-bold text-gray-800 mb-2">
              {filter === 'unread'
                ? 'همه اعلانات خوانده شده'
                : 'هیچ اعلانی ندارید'}
            </p>
            <p className="text-sm lg:text-base text-gray-500 mb-8 leading-relaxed max-w-xs lg:max-w-md">
              {filter === 'unread'
                ? 'اعلان خوانده نشده‌ای برای نمایش وجود ندارد'
                : 'وقتی اعلان جدیدی دریافت کنید، اینجا نمایش داده می‌شود'}
            </p>
            {filter === 'unread' && (
              <button
                onClick={() => setFilter('all')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                مشاهده همه اعلانات
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}