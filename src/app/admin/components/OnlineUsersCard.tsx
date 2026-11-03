'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { getSocket } from '@/app/services/socket';

interface OnlineUser {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: string;
  rating: number;
  completed_projects: number;
  avatar: string | null;
  online_status: number;
  last_seen_at: string | null;
  created_at: string;
}

interface RecentUser {
  id: number;
  phone: string;
  full_name: string | null;
  role: string;
  online_status: number;
  last_seen_at: string;
  minutes_ago: number;
}

interface Stats {
  total_users: number;
  online_now: number;
  online_admins: number;
  online_regular: number;
  active_last_hour: number;
  active_last_24h: number;
}

export default function OnlineUsersCard() {
  const { token } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'online' | 'recent'>('online');

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/online-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOnlineUsers(data.onlineUsers || []);
      setRecentUsers(data.recentUsers || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 🔑 رفرش هر ۳۰ ثانیه
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 🔑 گوش دادن به Socket برای آپدیت لحظه‌ای
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    if (!socket) return;

    const onUserOnline = () => loadData();
    const onUserOffline = () => loadData();

    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    return () => {
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const formatRelativeTime = (date: string | null) => {
    if (!date) return '—';
    try {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'همین الان';
      if (mins < 60) return `${mins} دقیقه پیش`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} ساعت پیش`;
      const days = Math.floor(hours / 24);
      return `${days} روز پیش`;
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
      {/* هدر */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            کاربران آنلاین
          </h2>
          {stats.online_now > 0 && (
            <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.online_now.toLocaleString('fa-IR')}
            </span>
          )}
        </div>
        <button
          onClick={loadData}
          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          title="رفرش"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-green-700">
            {stats.online_now.toLocaleString('fa-IR')}
          </div>
          <div className="text-[10px] text-green-600">آنلاین</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-blue-700">
            {stats.active_last_hour.toLocaleString('fa-IR')}
          </div>
          <div className="text-[10px] text-blue-600">۱ ساعت اخیر</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-indigo-700">
            {stats.active_last_24h.toLocaleString('fa-IR')}
          </div>
          <div className="text-[10px] text-indigo-600">۲۴ ساعت اخیر</div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="bg-gray-100 rounded-xl p-1 flex mb-3">
        <button
          onClick={() => setTab('online')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tab === 'online'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          🟢 آنلاین ({onlineUsers.length})
        </button>
        <button
          onClick={() => setTab('recent')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tab === 'recent'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          🕐 اخیر ({recentUsers.length})
        </button>
      </div>

      {/* لیست */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {tab === 'online' ? (
          onlineUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">😴</div>
              <p className="text-sm text-gray-500">هیچ کاربر آنلاینی نیست</p>
            </div>
          ) : (
            onlineUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {u.full_name?.charAt(0) || '👤'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {u.full_name || 'بدون نام'}
                    </span>
                    {u.role === 'admin' && (
                      <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                        ادمین
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                    {u.phone}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 shrink-0">
                  {formatRelativeTime(u.last_seen_at)}
                </div>
              </Link>
            ))
          )
        ) : recentUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-gray-500">کاربری در ۲۴ ساعت اخیر نبوده</p>
          </div>
        ) : (
          recentUsers.map((u) => (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {u.full_name?.charAt(0) || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {u.full_name || 'بدون نام'}
                  </span>
                  {u.role === 'admin' && (
                    <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                      ادمین
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                  {u.phone}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 shrink-0">
                {formatRelativeTime(u.last_seen_at)}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* لینک مشاهده همه */}
      {onlineUsers.length > 0 && (
        <Link
          href="/admin/users"
          className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-600 font-medium hover:underline"
        >
          مشاهده همه کاربران
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}
    </div>
  );
}