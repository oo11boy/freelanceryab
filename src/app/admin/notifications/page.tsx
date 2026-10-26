'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface Broadcast {
  id: number;
  admin_id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  recipients: string;
  recipient_count: number;
  sent_at: string;
  admin_name: string | null;
}

interface Stats {
  total: number;
  total_recipients: number;
  all_count: number;
  specific_count: number;
}

interface User {
  id: number;
  full_name: string | null;
  phone: string;
  role: string;
  is_active: number;
}

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, total_recipients: 0, all_count: 0, specific_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // فرم
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    link: '',
    recipients: 'all' as 'all' | 'active' | 'specific',
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (token) loadBroadcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBroadcasts(data.notifications || []);
      setStats(data.stats || { total: 0, total_recipients: 0, all_count: 0, specific_count: 0 });
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // جستجوی کاربر
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
    if (!formData.title.trim()) {
      setFormError('عنوان را وارد کنید');
      return;
    }
    if (!formData.message.trim()) {
      setFormError('متن پیام را وارد کنید');
      return;
    }
    if (formData.recipients === 'specific' && selectedUsers.length === 0) {
      setFormError('حداقل یک کاربر انتخاب کنید');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          link: formData.link.trim() || undefined,
          recipients: formData.recipients,
          specific_user_ids:
            formData.recipients === 'specific'
              ? selectedUsers.map((u) => u.id)
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      alert(`✅ ${data.message}`);
      setShowForm(false);
      setFormData({
        title: '', message: '', type: 'info', link: '', recipients: 'all',
      });
      setSelectedUsers([]);
      setPage(1);
      loadBroadcasts();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('fa-IR', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  };

  const typeLabel = (t: string) =>
    t === 'info' ? 'ℹ️ اطلاع'
    : t === 'warning' ? '⚠️ هشدار'
    : t === 'success' ? '✅ موفقیت'
    : '🔔 سیستم';

  const typeClass = (t: string) =>
    t === 'info' ? 'bg-blue-50 text-blue-700'
    : t === 'warning' ? 'bg-amber-50 text-amber-700'
    : t === 'success' ? 'bg-green-50 text-green-700'
    : 'bg-gray-100 text-gray-600';

  const recipientsLabel = (r: string, count: number) =>
    r === 'all' ? `همه (${count})`
    : r === 'active' ? `آنلاین (${count})`
    : `منتخب (${count})`;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">اعلانات</h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            {pagination.total.toLocaleString('fa-IR')} اعلان ارسال‌شده
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          اعلان جدید
        </button>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="کل ارسال‌ها" value={stats.total} color="blue" icon="📢" />
        <MiniStat label="کل دریافت‌کننده" value={stats.total_recipients} color="green" icon="👥" />
        <MiniStat label="به همه" value={stats.all_count} color="indigo" icon="🌐" />
        <MiniStat label="به منتخب" value={stats.specific_count} color="amber" icon="🎯" />
      </div>

      {/* فرم ارسال */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              📢 ارسال اعلان جدید
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* نوع */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">نوع اعلان</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: 'info', l: 'اطلاع', i: 'ℹ️' },
                { v: 'warning', l: 'هشدار', i: '⚠️' },
                { v: 'success', l: 'موفقیت', i: '✅' },
                { v: 'system', l: 'سیستم', i: '🔔' },
              ].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.v })}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    formData.type === t.v
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">{t.i}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${formData.type === t.v ? 'text-blue-700' : 'text-gray-600'}`}>
                    {t.l}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* عنوان */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={150}
              placeholder="مثلاً: به‌روزرسانی جدید پلتفرم"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <div className="text-[10px] text-gray-400 text-left mt-1">
              {formData.title.length}/150
            </div>
          </div>

          {/* متن */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              متن پیام <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="متن اعلان خود را بنویسید..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
            <div className="text-[10px] text-gray-400 text-left mt-1">
              {formData.message.length}/1000
            </div>
          </div>

          {/* لینک */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              لینک (اختیاری)
            </label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="مثلاً: /explore"
              dir="ltr"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* گیرندگان */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block">گیرندگان</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'all', l: 'همه', i: '🌐' },
                { v: 'active', l: 'آنلاین', i: '🟢' },
                { v: 'specific', l: 'منتخب', i: '🎯' },
              ].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setFormData({ ...formData, recipients: r.v as any })}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    formData.recipients === r.v
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">{r.i}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${formData.recipients === r.v ? 'text-blue-700' : 'text-gray-600'}`}>
                    {r.l}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* انتخاب کاربران خاص */}
          {formData.recipients === 'specific' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-gray-700 block">انتخاب کاربران</label>

              {/* کاربران انتخاب‌شده */}
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

              {/* جستجو */}
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

              {/* نتایج */}
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
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{formError}</div>
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
                  ارسال اعلان
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* تاریخچه */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            📜 تاریخچه ارسال‌ها
          </h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📢</div>
            <p className="text-gray-700 font-semibold mb-1">اعلانی ارسال نشده</p>
            <p className="text-sm text-gray-500">اولین اعلان رو بفرست!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${typeClass(b.type)}`}>
                    {b.type === 'info' ? 'ℹ️' : b.type === 'warning' ? '⚠️' : b.type === 'success' ? '✅' : '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-800 truncate">{b.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${typeClass(b.type)}`}>
                        {typeLabel(b.type)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{b.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                      <span>👥 {recipientsLabel(b.recipients, b.recipient_count)}</span>
                      <span>•</span>
                      <span>{formatDate(b.sent_at)}</span>
                      {b.admin_name && (
                        <>
                          <span>•</span>
                          <span>توسط {b.admin_name}</span>
                        </>
                      )}
                    </div>
                    {b.link && (
                      <div className="text-[10px] text-blue-600 mt-1" dir="ltr">
                        🔗 {b.link}
                      </div>
                    )}
                  </div>
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
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 px-3">{page} از {pagination.pages}</span>
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

function MiniStat({ label, value, color, icon }: {
  label: string; value: number;
  color: 'blue' | 'green' | 'indigo' | 'amber'; icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
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
          {value.toLocaleString('fa-IR')}
        </div>
        <div className="text-[10px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}