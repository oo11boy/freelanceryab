'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import PushSubscribersCard from '../components/PushSubscribersCard';

interface PushNotif {
  id: number;
  admin_id: number;
  title: string;
  message: string;
  link: string | null;
  icon: string | null;
  audience: string;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  clicked_count: number;
  sent_at: string;
  admin_name: string | null;
}

interface User {
  id: number;
  full_name: string | null;
  phone: string;
}

export default function AdminPushPage() {
  const { token, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<PushNotif[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // فرم
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: '',
    icon: '/icons/icon-192.png',
    audience: 'all' as 'all' | 'active' | 'specific',
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/push?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setStats(data.stats);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(userSearch.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setUserResults(data.users || []);
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch, token]);

  const addUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch('');
    setUserResults([]);
  };

  const removeUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSend = async () => {
    setFormError('');
    if (!formData.title.trim() || !formData.message.trim()) {
      setFormError('عنوان و متن الزامی است');
      return;
    }
    if (formData.audience === 'specific' && selectedUsers.length === 0) {
      setFormError('حداقل یک کاربر انتخاب کنید');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          specific_user_ids:
            formData.audience === 'specific'
              ? selectedUsers.map((u) => u.id)
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      alert(`✅ ${data.message}`);
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        link: '',
        icon: '/icons/icon-192.png',
        audience: 'all',
      });
      setSelectedUsers([]);
      setPage(1);
      loadNotifications();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('fa-IR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const audienceLabel = (a: string) =>
    a === 'all' ? 'همه' : a === 'active' ? 'آنلاین' : 'منتخب';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            ارسال پوش نوتیفیکیشن
          </h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            {pagination.total.toLocaleString('fa-IR')} ارسال
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          ارسال جدید
        </button>
      </div>

      {/* 🆕 کارت کاربران با پوش فعال */}
      <PushSubscribersCard   />

      {/* آمار ارسال‌ها */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="کل ارسال" value={stats.total} color="blue" icon="📤" />
          <MiniStat label="ارسال شده" value={stats.total_delivered} color="green" icon="✅" />
          <MiniStat label="کلیک شده" value={stats.total_clicked} color="indigo" icon="👁️" />
          <MiniStat label="ناموفق" value={stats.total_failed} color="red" icon="❌" />
        </div>
      )}

      {/* فرم */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-base">📢 ارسال پوش جدید</h2>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={70}
              placeholder="مثلاً: به‌روزرسانی جدید پلتفرم"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <div className="text-[10px] text-gray-400 text-left mt-1">
              {formData.title.length}/70
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              متن پیام <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="متن اعلان..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
            <div className="text-[10px] text-gray-400 text-left mt-1">
              {formData.message.length}/500
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              لینک (اختیاری)
            </label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="/explore یا /post/17"
              dir="ltr"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">
              مخاطبان
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'all', l: 'همه', i: '🌐' },
                { v: 'active', l: 'آنلاین', i: '🟢' },
                { v: 'specific', l: 'منتخب', i: '🎯' },
              ].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setFormData({ ...formData, audience: r.v as any })}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    formData.audience === r.v
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">{r.i}</div>
                  <div
                    className={`text-[10px] font-bold mt-0.5 ${
                      formData.audience === r.v ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {r.l}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {formData.audience === 'specific' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-gray-700 block">
                انتخاب کاربران
              </label>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 rounded-xl">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="bg-white border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                    >
                      {u.full_name || u.phone}
                      <button
                        onClick={() => removeUser(u.id)}
                        className="w-4 h-4 rounded-full bg-blue-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="جستجوی کاربر (نام یا شماره)"
                  className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </span>
              </div>

              {userResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addUser(u)}
                      className="w-full flex items-center gap-2 p-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-right"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {u.full_name?.charAt(0) || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">
                          {u.full_name || 'بدون نام'}
                        </div>
                        <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                          {u.phone}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowForm(false)}
              disabled={sending}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-[2] py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  ارسال پوش
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* لیست */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-sm">📜 تاریخچه ارسال‌ها</h2>
        </div>

        {loading ? (
          <div className="p-8 animate-pulse">
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📤</div>
            <p className="text-gray-700 font-semibold mb-1">پوشی ارسال نشده</p>
            <p className="text-sm text-gray-500">اولین پوش رو بفرست!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => {
              const ctr =
                n.delivered_count > 0
                  ? Math.round((n.clicked_count / n.delivered_count) * 100)
                  : 0;

              return (
                <div key={n.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xl shrink-0">
                      🔔
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-gray-800 truncate">
                          {n.title}
                        </span>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                          {audienceLabel(n.audience)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                        <span>👥 {n.sent_count}</span>
                        <span>•</span>
                        <span className="text-green-600">
                          ✅ {n.delivered_count}
                        </span>
                        <span>•</span>
                        <span className="text-indigo-600">
                          👁️ {n.clicked_count} ({ctr}%)
                        </span>
                        {n.failed_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">
                              ❌ {n.failed_count}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(n.sent_at)}</span>
                        {n.admin_name && (
                          <>
                            <span>•</span>
                            <span>توسط {n.admin_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* صفحه‌بندی */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
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
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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

function MiniStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'indigo' | 'red';
  icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-2.5">
      <div
        className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center text-base shrink-0`}
      >
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