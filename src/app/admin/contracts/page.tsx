'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Contract {
  id: number;
  post_id: number;
  client_id: number;
  freelancer_id: number;
  status: string;
  needs_review: number;
  started_at: string;
  delivered_at: string | null;
  completed_at: string | null;
  post_title: string | null;
  client_name: string | null;
  client_phone: string;
  freelancer_name: string | null;
  freelancer_phone: string;
  days_active: number;
}

interface Stats {
  total: number;
  in_progress: number;
  delivered: number;
  completed: number;
  cancelled: number;
  needs_review: number;
  old_in_progress: number;
  completion_rate: number;
}

export default function AdminContractsPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, in_progress: 0, delivered: 0, completed: 0,
    cancelled: 0, needs_review: 0, old_in_progress: 0, completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    if (token) loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, sort, page, search]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('filter', filter);
      params.set('sort', sort);
      params.set('page', String(page));
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/contracts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setContracts(data.contracts || []);
      setStats(data.stats || {
        total: 0, in_progress: 0, delivered: 0, completed: 0,
        cancelled: 0, needs_review: 0, old_in_progress: 0, completion_rate: 0,
      });
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

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return '—'; }
  };

  const statusLabel = (s: string) =>
    s === 'in_progress' ? 'در جریان'
    : s === 'delivered' ? 'تحویل'
    : s === 'completed' ? 'تکمیل'
    : s === 'cancelled' ? 'لغو'
    : s;

  const statusClass = (s: string) =>
    s === 'in_progress' ? 'bg-amber-50 text-amber-700'
    : s === 'delivered' ? 'bg-sky-50 text-sky-700'
    : s === 'completed' ? 'bg-green-50 text-green-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* هدر */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">مدیریت قراردادها</h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          {pagination.total.toLocaleString('fa-IR')} قرارداد
        </p>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="کل" value={stats.total} color="blue" icon="🤝" />
        <MiniStat label="در جریان" value={stats.in_progress} color="amber" icon="🔄" />
        <MiniStat label="تکمیل" value={stats.completed} color="green" icon="✅" />
        <MiniStat label="لغو" value={stats.cancelled} color="red" icon="❌" />
        <MiniStat
          label="نرخ تکمیل"
          value={`${stats.completion_rate}%`}
          color="indigo"
          icon="📊"
          isText
        />
      </div>

      {/* هشدارها */}
      {(stats.needs_review > 0 || stats.old_in_progress > 0) && (
        <div className="space-y-2">
          {stats.needs_review > 0 && (
            <button
              onClick={() => { setFilter('needs_review'); setPage(1); }}
              className="w-full bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 hover:bg-red-100 transition-colors text-right"
            >
              <span className="text-2xl">🚨</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-700">
                  {stats.needs_review} قرارداد نیاز به بررسی دارد
                </div>
                <div className="text-[11px] text-red-600">برای دیدن کلیک کنید</div>
              </div>
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {stats.old_in_progress > 0 && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-700">
                  {stats.old_in_progress} قرارداد بیش از ۱۴ روز در جریان
                </div>
                <div className="text-[11px] text-amber-600">احتمالاً نیاز به پیگیری دارند</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* فیلتر */}
      <div className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو (عنوان آگهی، نام، شماره)"
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
            { v: 'in_progress', l: 'در جریان' },
            { v: 'delivered', l: 'تحویل' },
            { v: 'completed', l: 'تکمیل' },
            { v: 'cancelled', l: 'لغو' },
            { v: 'needs_review', l: '🚨 نیاز بررسی' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => { setFilter(f.v); setPage(1); }}
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
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="mr-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="oldest_active">قدیمی‌ترین در جریان</option>
          </select>
        </div>
      </div>

      {/* لیست */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-8 bg-gray-100 rounded-lg w-20" />
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-gray-700 font-semibold mb-1">قراردادی یافت نشد</p>
            <p className="text-sm text-gray-500">فیلتر را تغییر بده</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/admin/contracts/${c.id}`}
                className="p-4  items-center gap-3 hover:bg-gray-50 transition-colors block"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-xl shrink-0 relative">
                  🤝
                  {c.needs_review === 1 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">
                    {c.post_title || `آگهی #${c.post_id}`}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {c.client_name || '?'} ↔ {c.freelancer_name || '?'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>📅 {formatDate(c.started_at)}</span>
                    {c.status === 'in_progress' && (
                      <>
                        <span>•</span>
                        <span className={c.days_active > 14 ? 'text-amber-600 font-bold' : ''}>
                          {c.days_active} روز
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className={`text-[9px] px-2 py-1 rounded-full font-bold shrink-0 ${statusClass(c.status)}`}>
                  {statusLabel(c.status)}
                </span>
              </Link>
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
  label, value, color, icon, isText,
}: {
  label: string; value: number | string;
  color: 'blue' | 'green' | 'red' | 'indigo' | 'amber'; icon: string;
  isText?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center text-base shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-gray-800 leading-tight">
          {isText ? value : (value as number).toLocaleString('fa-IR')}
        </div>
        <div className="text-[10px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}