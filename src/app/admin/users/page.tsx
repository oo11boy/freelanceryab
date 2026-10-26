'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface User {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: string;
  rating: number;
  completed_projects: number;
  is_active: number;
  online_status: number;
  created_at: string;
  posts_count: number;
}

interface Stats {
  total: number;
  active: number;
  blocked: number;
  admins: number;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    blocked: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    if (token) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, sort, page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('filter', filter);
      params.set('sort', sort);
      params.set('page', String(page));
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setUsers(data.users || []);
      setStats(data.stats || { total: 0, active: 0, blocked: 0, admins: 0 });
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleBlock = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle-block' }),
      });
      if (!res.ok) throw new Error();
      loadUsers();
    } catch {
      alert('خطا در عملیات');
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* هدر */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
          مدیریت کاربران
        </h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          {pagination.total.toLocaleString('fa-IR')} کاربر
        </p>
      </div>

      {/* آمار کوچک */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="کل" value={stats.total} color="blue" icon="👥" />
        <MiniStat label="فعال" value={stats.active} color="green" icon="✅" />
        <MiniStat label="مسدود" value={stats.blocked} color="red" icon="🚫" />
        <MiniStat label="ادمین" value={stats.admins} color="purple" icon="⭐" />
      </div>

      {/* جستجو و فیلتر */}
      <div className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو (نام، شماره، ایمیل)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded-xl text-sm font-medium active:scale-95 transition-all"
          >
            جستجو
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {[
            { v: 'all', l: 'همه' },
            { v: 'active', l: 'فعال' },
            { v: 'blocked', l: 'مسدود' },
            { v: 'admin', l: 'ادمین' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => {
                setFilter(f.v);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.v
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              {f.l}
            </button>
          ))}

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="mr-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="rating">بالاترین امتیاز</option>
            <option value="projects">بیشترین پروژه</option>
          </select>
        </div>
      </div>

      {/* لیست */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-8 bg-gray-100 rounded-lg w-20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-700 font-semibold mb-1">کاربری یافت نشد</p>
            <p className="text-sm text-gray-500">فیلتر رو تغییر بده</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/admin/users/${u.id}`}
                  className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0"
                >
                  {u.full_name?.charAt(0) || '👤'}
                  {u.online_status === 1 && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-semibold text-sm text-gray-800 truncate hover:text-blue-600"
                    >
                      {u.full_name || 'بدون نام'}
                    </Link>
                    {u.role === 'admin' && (
                      <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                        ادمین
                      </span>
                    )}
                    {!u.is_active && (
                      <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                        مسدود
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                    {u.phone}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {u.posts_count} آگهی • {formatDate(u.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleBlock(u.id)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                      u.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title={u.is_active ? 'مسدود کردن' : 'فعال کردن'}
                  >
                    {u.is_active ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-90 transition-all"
                    title="مشاهده"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* صفحه‌بندی */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 active:scale-90 transition-all"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 px-3">
            {page} از {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 active:scale-90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'purple';
  icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center text-base shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-gray-800 leading-tight">
          {value.toLocaleString('fa-IR')}
        </div>
        <div className="text-[10px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}