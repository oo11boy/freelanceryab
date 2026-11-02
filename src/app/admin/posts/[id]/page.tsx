'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface PostDetail {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  category: string;
  sub_category: string | null;
  price: string | null;
  price_type: string;
  description: string;
  skills: string[];
  location: string | null;
  images: string[];
  deadline: string | null;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_phone: string;
  user_role: string;
  user_active: number;
  user_rating: number;
}

interface Contract {
  id: number;
  status: string;
  started_at: string;
  delivered_at: string | null;
  completed_at: string | null;
  client_name: string | null;
  client_phone: string;
  freelancer_name: string | null;
  freelancer_phone: string;
}

export default function AdminPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    sub_category: '',
    price: '',
    price_type: 'fixed',
    description: '',
  });

  // 🔑 صبر کن تا auth لود بشه
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, params.id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setPost(data.post);
      setContracts(data.contracts || []);
      setStats(data.stats);
      setFormData({
        title: data.post.title || '',
        category: data.post.category || '',
        sub_category: data.post.sub_category || '',
        price: data.post.price || '',
        price_type: data.post.price_type || 'fixed',
        description: data.post.description || '',
      });
    } catch {
      router.push('/admin/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'update', ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing(false);
      loadPost();
    } catch (e: any) {
      alert(e.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReject = async (action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          note: action === 'reject' ? rejectNote.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      loadPost();
      setShowRejectBox(false);
      setRejectNote('');
    } catch {
      alert('خطا');
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!confirm(`تغییر وضعیت به «${statusLabel(status)}»؟`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'change-status', status }),
      });
      if (!res.ok) throw new Error();
      loadPost();
    } catch {
      alert('خطا');
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm(`آیا از حذف کامل «${post.title}» مطمئنید؟ قراردادهای مرتبط نیز حذف می‌شوند.`)) return;

    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      router.push('/admin/posts');
    } catch {
      alert('خطا در حذف');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
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

  // 🔑 اسپینر تا auth لود بشه
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

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">جزئیات آگهی</h1>
          <p className="text-xs text-gray-500">#{post.id}</p>
        </div>
        <button
          onClick={handleDelete}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
        >
          حذف
        </button>
      </div>

      {/* باکس تأیید/رد برای pending */}
      {post.status === 'pending' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">این آگهی در انتظار تأیید است</h3>
              <p className="text-xs text-gray-500">تأیید کن تا در اپ نمایش داده بشه</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleApproveReject('approve')}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all"
            >
              ✅ تأیید و انتشار
            </button>
            <button
              onClick={() => setShowRejectBox(!showRejectBox)}
              className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 active:scale-95 transition-all"
            >
              ❌ رد کردن
            </button>
          </div>

          {showRejectBox && (
            <div className="animate-fade-in">
              <label className="text-xs text-gray-600 mb-1 block">دلیل رد (اختیاری)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="مثلاً: محتوای نامناسب، اطلاعات ناقص..."
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={() => handleApproveReject('reject')}
                className="w-full mt-2 bg-red-600 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                تأیید رد
              </button>
            </div>
          )}
        </div>
      )}

      {/* کارت اصلی */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl shrink-0">
            📄
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 leading-tight">{post.title}</h2>
            <div className="text-xs text-gray-500 mt-1">
              {post.category}
              {post.sub_category ? ` / ${post.sub_category}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusClass(post.status)}`}>
                {statusLabel(post.status)}
              </span>
              <span className="text-[10px] text-gray-400">
                👁 {post.views.toLocaleString('fa-IR')} بازدید
              </span>
              <span className="text-[10px] text-gray-400">
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* نویسنده */}
        <Link
          href={`/admin/users/${post.user_id}`}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {post.user_name?.charAt(0) || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">
              {post.user_name || 'بدون نام'}
            </div>
            <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
              {post.user_phone}
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* آمار */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-blue-700">{stats.saves_count}</div>
              <div className="text-[10px] text-blue-600">ذخیره</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-amber-700">{stats.contracts_count}</div>
              <div className="text-[10px] text-amber-600">قرارداد</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-purple-700">{stats.messages_count}</div>
              <div className="text-[10px] text-purple-600">پیام</div>
            </div>
          </div>
        )}
      </div>

      {/* تغییر وضعیت */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-3">تغییر وضعیت</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'pending', l: 'در انتظار', c: 'amber' },
            { v: 'active', l: 'فعال', c: 'green' },
            { v: 'locked', l: 'قفل', c: 'purple' },
            { v: 'completed', l: 'تکمیل', c: 'blue' },
            { v: 'rejected', l: 'رد شده', c: 'red' },
            { v: 'expired', l: 'منقضی', c: 'gray' },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => handleChangeStatus(s.v)}
              disabled={post.status === s.v}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 ${
                post.status === s.v
                  ? 'bg-gray-100 text-gray-400'
                  : s.c === 'green'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : s.c === 'purple'
                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  : s.c === 'blue'
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : s.c === 'amber'
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : s.c === 'red'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* اطلاعات قابل ویرایش */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm">اطلاعات آگهی</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              ویرایش
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-500 hover:underline"
              >
                لغو
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50"
              >
                {saving ? '...' : 'ذخیره'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">عنوان</label>
            {editing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-sm font-semibold text-gray-800">{post.title}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">دسته</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-800">{post.category || '—'}</div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">زیردسته</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.sub_category}
                  onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-800">{post.sub_category || '—'}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">قیمت</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-800">
                  {post.price || 'توافقی'}
                  {post.price_type === 'hourly' ? ' (ساعتی)' : post.price_type === 'fixed' ? ' (ثابت)' : ''}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">موقعیت</label>
              <div className="text-sm text-gray-800">{post.location || '—'}</div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">توضیحات</label>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.description || '—'}
              </div>
            )}
          </div>

          {post.skills.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">مهارت‌ها</label>
              <div className="flex flex-wrap gap-1.5">
                {post.skills.map((s, i) => (
                  <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* قراردادهای مرتبط */}
      {contracts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-3">قراردادهای مرتبط</h3>
          <div className="space-y-2">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-sm shrink-0">🤝</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">
                    {c.client_name || '?'} ↔ {c.freelancer_name || '?'}
                  </div>
                  <div className="text-[10px] text-gray-500">{formatDate(c.started_at)}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                  c.status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
                  c.status === 'delivered' ? 'bg-sky-50 text-sky-700' :
                  c.status === 'completed' ? 'bg-green-50 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {c.status === 'in_progress' ? 'در جریان' :
                   c.status === 'delivered' ? 'تحویل' :
                   c.status === 'completed' ? 'تکمیل' : 'لغو'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}