'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface UserDetail {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: string;
  experience: string | null;
  bio: string | null;
  skills: string[];
  avatar: string | null;
  rating: number;
  completed_projects: number;
  is_active: number;
  online_status: number;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

interface Stats {
  posts_count: number;
  active_posts: number;
  messages_count: number;
  contracts_count: number;
  reviews_count: number;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user: currentAdmin } = useAuth();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
  });

  useEffect(() => {
    if (token) loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setUser(data.user);
      setStats(data.stats);
      setRecentPosts(data.recentPosts || []);
      setFormData({
        full_name: data.user.full_name || '',
        email: data.user.email || '',
        role: data.user.role,
      });
    } catch {
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
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
      loadUser();
    } catch (e: any) {
      alert(e.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    const msg = user.is_active
      ? 'آیا از مسدود کردن این کاربر مطمئنید؟'
      : 'آیا از فعال کردن این کاربر مطمئنید؟';
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle-block' }),
      });
      if (!res.ok) throw new Error();
      loadUser();
    } catch {
      alert('خطا');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (user.id === currentAdmin?.id) {
      alert('نمی‌توانید خودتان را حذف کنید');
      return;
    }
    if (
      !confirm(
        `آیا از حذف کامل ${user.full_name || user.phone} مطمئنید؟ این عمل قابل بازگشت نیست و همه آگهی‌ها، پیام‌ها و قراردادهای کاربر حذف می‌شوند.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      router.push('/admin/users');
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

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-4" />
          <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isSelf = user.id === currentAdmin?.id;

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
          <h1 className="text-lg font-bold text-gray-800">جزئیات کاربر</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBlock}
            disabled={isSelf}
            className={`px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-40 ${
              user.is_active
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {user.is_active ? 'مسدود' : 'فعال'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isSelf}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-40"
          >
            حذف
          </button>
        </div>
      </div>

      {/* کارت کاربر */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold">
              {user.full_name?.charAt(0) || '👤'}
            </div>
            {user.online_status === 1 && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-800 truncate">
                {user.full_name || 'بدون نام'}
              </h2>
              {user.role === 'admin' && (
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                  ⭐ ادمین
                </span>
              )}
              {!user.is_active && (
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  🚫 مسدود
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1" dir="ltr" style={{ textAlign: 'right' }}>
              {user.phone}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              عضویت: {formatDate(user.created_at)}
            </div>
          </div>
        </div>

        {/* آمار */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-blue-700">{stats.posts_count}</div>
              <div className="text-[10px] text-blue-600">آگهی</div>
            </div>
            <div className="bg-green-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-green-700">{stats.active_posts}</div>
              <div className="text-[10px] text-green-600">فعال</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-purple-700">{stats.messages_count}</div>
              <div className="text-[10px] text-purple-600">پیام</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-amber-700">{stats.contracts_count}</div>
              <div className="text-[10px] text-amber-600">قرارداد</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-pink-700">{stats.reviews_count}</div>
              <div className="text-[10px] text-pink-600">نظر</div>
            </div>
          </div>
        )}
      </div>

      {/* اطلاعات قابل ویرایش */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm">اطلاعات کاربر</h3>
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
            <label className="text-xs text-gray-500 mb-1 block">نام</label>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-sm font-semibold text-gray-800">
                {user.full_name || '—'}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">ایمیل</label>
            {editing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            ) : (
              <div className="text-sm text-gray-800" dir="ltr" style={{ textAlign: 'right' }}>
                {user.email || '—'}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">نقش</label>
            {editing ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">کاربر عادی</option>
                <option value="admin">ادمین</option>
              </select>
            ) : (
              <div className="text-sm font-semibold text-gray-800">
                {user.role === 'admin' ? '⭐ ادمین' : 'کاربر عادی'}
              </div>
            )}
          </div>

          {user.bio && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">بیو</label>
              <div className="text-sm text-gray-700 leading-relaxed">{user.bio}</div>
            </div>
          )}
        </div>
      </div>

      {/* آگهی‌های اخیر */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">آگهی‌های اخیر</h3>
            <Link
              href={`/admin/posts?user=${user.id}`}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              همه
            </Link>
          </div>
          <div className="space-y-2">
            {recentPosts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/posts/${p.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{p.title}</div>
                  <div className="text-[10px] text-gray-400">
                    {p.views} بازدید • {formatDate(p.created_at)}
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                  p.status === 'active' ? 'bg-green-50 text-green-700' :
                  p.status === 'locked' ? 'bg-purple-50 text-purple-700' :
                  p.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {p.status === 'active' ? 'فعال' :
                   p.status === 'locked' ? 'قفل' :
                   p.status === 'completed' ? 'تکمیل' : p.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}