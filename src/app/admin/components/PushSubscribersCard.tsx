'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Subscriber {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
  is_active: number;
  online_status: number;
  last_seen_at: string | null;
  created_at: string;
  devices_count: number;
  first_subscribed_at: string;
  last_updated_at: string;
}

interface Stats {
  total_users: number;
  total_subscribers: number;
  total_devices: number;
  online_subscribers: number;
  subscribe_rate: number;
  not_subscribed: number;
}

export default function PushSubscribersCard() {
  const { token } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/push/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

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

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* آمار */}
      {stats && (
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl p-5 shadow-lg text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔔</span>
              <div>
                <h2 className="font-bold text-base">کاربران با پوش فعال</h2>
                <p className="text-[11px] text-white/80">
                  {stats.subscribe_rate}% از کاربران پوش رو فعال کردن
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatBox
                icon="👥"
                label="کل کاربران"
                value={stats.total_users}
              />
              <StatBox
                icon="✅"
                label="پوش فعال"
                value={stats.total_subscribers}
                highlight
              />
              <StatBox
                icon="📱"
                label="کل دستگاه‌ها"
                value={stats.total_devices}
              />
              <StatBox
                icon="🟢"
                label="آنلاین‌ها"
                value={stats.online_subscribers}
              />
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/80">نرخ فعال‌سازی</span>
                <span className="font-bold">{stats.subscribe_rate}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats.subscribe_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* لیست */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">
              👥 کاربران با پوش فعال ({pagination.total.toLocaleString('fa-IR')})
            </h3>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو (نام، شماره، ایمیل)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-medium active:scale-95 transition-all"
            >
              جستجو
            </button>
          </form>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔕</div>
            <p className="text-gray-700 font-semibold mb-1">
              هیچ کاربری پوش رو فعال نکرده
            </p>
            <p className="text-sm text-gray-500">
              {search ? 'نتیجه‌ای برای جستجو یافت نشد' : 'هنوز کسی اشتراک پوش ثبت نکرده'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {subscribers.map((s) => (
              <Link
                key={s.id}
                href={`/admin/users/${s.id}`}
                className="flex items-center gap-3 p-3 lg:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {s.full_name?.charAt(0) || '👤'}
                  </div>
                  {s.online_status === 1 && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800 truncate">
                      {s.full_name || 'بدون نام'}
                    </span>
                    {s.role === 'admin' && (
                      <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                        ادمین
                      </span>
                    )}
                    {s.devices_count > 1 && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        {s.devices_count} دستگاه
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                    {s.phone}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    📅 فعال‌سازی: {formatDate(s.first_subscribed_at)}
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 shrink-0">
                  {formatRelativeTime(s.last_updated_at)}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* صفحه‌بندی */}
        {pagination.pages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-xs text-gray-600">
              {page} از {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight
          ? 'bg-white/25 backdrop-blur-sm ring-2 ring-white/40'
          : 'bg-white/15 backdrop-blur-sm'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value.toLocaleString('fa-IR')}</div>
      <div className="text-[10px] text-white/80">{label}</div>
    </div>
  );
}