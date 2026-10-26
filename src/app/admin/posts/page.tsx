'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Post {
  id: number;
  title: string;
  slug: string;
  category: string;
  sub_category: string | null;
  price: string | null;
  price_type: string;
  status: string;
  views: number;
  created_at: string;
  user_id: number;
  user_name: string | null;
  user_phone: string;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  locked: number;
  completed: number;
  rejected: number;
  expired: number;
}

export default function AdminPostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, active: 0, locked: 0, completed: 0, rejected: 0, expired: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('pending');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    if (token) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, sort, page, search, category]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('filter', filter);
      params.set('sort', sort);
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const res = await fetch(`/api/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setPosts(data.posts || []);
      setStats(data.stats || { total: 0, pending: 0, active: 0, locked: 0, completed: 0, rejected: 0, expired: 0 });
      setCategories(data.categories || []);
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

  const handleQuickAction = async (postId: number, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const note = prompt('دلیل رد (اختیاری):');
      if (note === null) return;
      try {
        const res = await fetch(`/api/admin/posts/${postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, note }),
        });
        if (!res.ok) throw new Error();
        loadPosts();
      } catch {
        alert('خطا در رد آگهی');
      }
      return;
    }

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      loadPosts();
    } catch {
      alert('خطا در تأیید آگهی');
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return ''; }
  };

  const statusLabel = (s: string) =>
    s === 'pending' ? 'در انتظار'
    : s === 'active' ? 'فعال'
    : s === 'locked' ? 'قفل'
    : s === 'in_progress' ? 'در جریان'
    : s === 'delivered' ? 'تحویل'
    : s === 'completed' ? 'تکمیل'
    : s === 'rejected' ? 'رد شده'
    : s === 'expired' ? 'منقضی'
    : s;

  const statusClass = (s: string) =>
    s === 'pending' ? 'bg-amber-50 text-amber-700'
    : s === 'active' ? 'bg-green-50 text-green-700'
    : s === 'locked' ? 'bg-purple-50 text-purple-700'
    : s === 'in_progress' ? 'bg-sky-50 text-sky-700'
    : s === 'delivered' ? 'bg-cyan-50 text-cyan-700'
    : s === 'completed' ? 'bg-blue-50 text-blue-700'
    : s === 'rejected' ? 'bg-red-50 text-red-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* هدر */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">مدیریت آگهی‌ها</h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          {pagination.total.toLocaleString('fa-IR')} آگهی
        </p>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniStat label="در انتظار" value={stats.pending} color="amber" icon="⏳" />
        <MiniStat label="کل" value={stats.total} color="blue" icon="📝" />
        <MiniStat label="فعال" value={stats.active} color="green" icon="✅" />
        <MiniStat label="قفل" value={stats.locked} color="purple" icon="🔒" />
        <MiniStat label="تکمیل" value={stats.completed} color="indigo" icon="🎉" />
        <MiniStat label="رد شده" value={stats.rejected} color="red" icon="❌" />
      </div>

      {/* فیلتر */}
      <div className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو در عنوان و توضیحات"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 rounded-xl text-sm font-medium active:scale-95 transition-all">
            جستجو
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {[
            { v: 'pending', l: '⏳ در انتظار' },
            { v: 'all', l: 'همه' },
            { v: 'active', l: 'فعال' },
            { v: 'rejected', l: 'رد شده' },
            { v: 'locked', l: 'قفل' },
            { v: 'completed', l: 'تکمیل' },
            { v: 'expired', l: 'منقضی' },
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
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="mr-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="views">پربازدیدترین</option>
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
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-700 font-semibold mb-1">آگهی‌ای یافت نشد</p>
            <p className="text-sm text-gray-500">فیلتر را تغییر بده</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <Link
                  href={`/admin/posts/${p.id}`}
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xl shrink-0"
                >
                  📄
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="font-semibold text-sm text-gray-800 truncate hover:text-blue-600 block"
                  >
                    {p.title}
                  </Link>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {p.user_name || 'کاربر ناشناس'} • {p.category}
                    {p.sub_category ? ` / ${p.sub_category}` : ''}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>👁 {p.views.toLocaleString('fa-IR')}</span>
                    <span>•</span>
                    <span>{formatDate(p.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {p.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleQuickAction(p.id, 'approve')}
                        className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-90 transition-all"
                        title="تأیید"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleQuickAction(p.id, 'reject')}
                        className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all"
                        title="رد"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${statusClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  )}
                  <Link
                    href={`/admin/posts/${p.id}`}
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
  label, value, color, icon,
}: {
  label: string; value: number;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'red' | 'amber'; icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
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