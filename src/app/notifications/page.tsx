'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { notificationsAPI } from '@/app/services/api';

interface Notification {
  id: number;
  type: 'message' | 'offer' | 'system' | 'reminder';
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadNotifications();
  }, [token]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications(50);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('خطا:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('خطا:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAsRead(undefined, true);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('خطا:', error);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'offer':
        return '🤝';
      case 'system':
        return '⚙️';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-50';
      case 'offer':
        return 'bg-green-50';
      case 'system':
        return 'bg-gray-50';
      case 'reminder':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffHours = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'لحظاتی پیش';
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffHours < 48) return 'دیروز';
    return notifDate.toLocaleDateString('fa-IR');
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.is_read
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-600 text-2xl">
            ←
          </button>
          <h1 className="text-xl font-bold">اعلانات</h1>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm text-blue-600">
              خواندن همه
            </button>
          )}
        </div>

        {/* فیلتر */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            خوانده نشده
            {unreadCount > 0 && (
              <span className="mr-1 text-xs">({unreadCount})</span>
            )}
          </button>
        </div>
      </div>

      {/* لیست اعلانات */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`${getBgColor(notif.type)} rounded-lg p-4 shadow-sm cursor-pointer transition ${
                  !notif.is_read ? 'border-r-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800">{notif.title}</h3>
                      <span className="text-xs text-gray-500">{formatDate(notif.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-lg font-semibold mb-2">هیچ اعلانی ندارید</p>
            <p className="text-sm">وقتی اعلان جدیدی دریافت کنید اینجا نمایش داده می‌شود</p>
          </div>
        )}
      </div>
    </div>
  );
}