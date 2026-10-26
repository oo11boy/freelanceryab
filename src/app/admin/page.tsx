'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  users: { total: number; new_week: number; active: number };
  posts: { total: number; active: number; new_week: number };
  contracts: { total: number; completed: number; in_progress: number };
  growth: {
    users: { date: string; count: number }[];
    posts: { date: string; count: number }[];
  };
  recent: {
    users: any[];
    posts: any[];
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('خطا');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatNumber = (n: number) => n.toLocaleString('fa-IR');

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm animate-pulse"
            >
              <div className="h-8 w-8 bg-gray-200 rounded-lg mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          خطا در دریافت اطلاعات
        </div>
      </div>
    );
  }

  // آماده‌سازی داده نمودار
  const chartData = stats.growth.users.map((u) => ({
    date: formatDate(u.date),
    users: u.count,
    posts: stats.growth.posts.find((p) => p.date === u.date)?.count || 0,
  }));

  // اگه داده کم بود، ۷ روز اخیر رو پر کن
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const existing = chartData.find((c) => c.date === formatDate(dateStr));
    return (
      existing || {
        date: formatDate(dateStr),
        users: 0,
        posts: 0,
      }
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* عنوان */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
          داشبورد مدیریت
        </h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          خلاصه‌ای از وضعیت پلتفرم
        </p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon="👥"
          label="کل کاربران"
          value={formatNumber(stats.users.total)}
          extra={`+${formatNumber(stats.users.new_week)} این هفته`}
          color="blue"
        />
        <StatCard
          icon="📝"
          label="کل آگهی‌ها"
          value={formatNumber(stats.posts.total)}
          extra={`${formatNumber(stats.posts.active)} فعال`}
          color="indigo"
        />
        <StatCard
          icon="✅"
          label="پروژه‌های موفق"
          value={formatNumber(stats.contracts.completed)}
          extra={`${formatNumber(stats.contracts.in_progress)} در جریان`}
          color="green"
        />
        <StatCard
          icon="🔥"
          label="آگهی جدید"
          value={formatNumber(stats.posts.new_week)}
          extra="۷ روز اخیر"
          color="purple"
        />
      </div>

      {/* نمودار */}
      <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 text-sm lg:text-base">
            📈 رشد ۷ روز اخیر
          </h2>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              کاربران
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              آگهی‌ها
            </span>
          </div>
        </div>
        <div className="h-56 lg:h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  direction: 'rtl',
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                name="کاربران"
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ fill: '#a855f7', r: 3 }}
                activeDot={{ r: 5 }}
                name="آگهی‌ها"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* بخش دو ستونی */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* جدیدترین کاربران */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span>👥</span> جدیدترین کاربران
            </h2>
            <Link
              href="/admin/users"
              className="text-[11px] text-blue-600 font-medium hover:underline"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent.users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                کاربری یافت نشد
              </p>
            ) : (
              stats.recent.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {u.full_name?.charAt(0) || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">
                      {u.full_name || 'کاربر'}
                    </div>
                    <div className="text-[10px] text-gray-500" dir="ltr">
                      {u.phone}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(u.created_at)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* جدیدترین آگهی‌ها */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span>📝</span> جدیدترین آگهی‌ها
            </h2>
            <Link
              href="/admin/posts"
              className="text-[11px] text-blue-600 font-medium hover:underline"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent.posts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                آگهی‌ای یافت نشد
              </p>
            ) : (
              stats.recent.posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/posts/${p.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-lg shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {p.user_name || 'کاربر'}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : p.status === 'locked'
                        ? 'bg-purple-50 text-purple-700'
                        : p.status === 'completed'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.status === 'active'
                      ? 'فعال'
                      : p.status === 'locked'
                      ? 'قفل'
                      : p.status === 'completed'
                      ? 'تکمیل'
                      : p.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// کامپوننت کارت آمار
function StatCard({
  icon,
  label,
  value,
  extra,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  extra: string;
  color: 'blue' | 'indigo' | 'green' | 'purple';
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
    green: 'from-green-500 to-emerald-600 shadow-green-500/20',
    purple: 'from-purple-500 to-fuchsia-600 shadow-purple-500/20',
  };

  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-xl shadow-md mb-3`}
      >
        {icon}
      </div>
      <div className="text-xl lg:text-2xl font-bold text-gray-800">
        {value}
      </div>
      <div className="text-xs lg:text-sm text-gray-500 mt-0.5">{label}</div>
      <div className="text-[10px] lg:text-xs text-gray-400 mt-1">{extra}</div>
    </div>
  );
}