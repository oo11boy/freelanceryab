'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Settings {
  site_name: string;
  site_description: string;
  contact_phone: string;
  contact_email: string;
  about_text: string;
  rules_text: string;
  post_approval_mode: 'auto' | 'manual';
  max_posts_per_user: string;
  banned_words: string;
  token_expiry_days: string;
}

const DEFAULT_SETTINGS: Settings = {
  site_name: 'فریلنسرکار',
  site_description: '',
  contact_phone: '',
  contact_email: '',
  about_text: '',
  rules_text: '',
  post_approval_mode: 'manual',
  max_posts_per_user: '10',
  banned_words: '',
  token_expiry_days: '30',
};

export default function AdminSettingsPage() {
  const { token, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'عمومی', icon: '⚙️' },
    { id: 'posts', label: 'آگهی‌ها', icon: '📝' },
    { id: 'security', label: 'امنیت', icon: '🛡️' },
    { id: 'content', label: 'محتوا', icon: '📄' },
    { id: 'logs', label: 'لاگ‌ها', icon: '📋' },
  ];

  if (authLoading || loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">تنظیمات سیستم</h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">پیکربندی پلتفرم</p>
        </div>
        {activeTab !== 'logs' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ذخیره...
              </>
            ) : saved ? (
              <>✅ ذخیره شد</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                ذخیره تغییرات
              </>
            )}
          </button>
        )}
      </div>

      {/* تب‌ها */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* تب عمومی */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <SectionTitle icon="🌐" title="اطلاعات سایت" />

          <Field label="نام سایت">
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => update('site_name', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </Field>

          <Field label="توضیح کوتاه سایت">
            <textarea
              value={settings.site_description}
              onChange={(e) => update('site_description', e.target.value)}
              rows={2}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </Field>

          <SectionTitle icon="📞" title="اطلاعات تماس" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="شماره تماس">
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
                placeholder="0912..."
                dir="ltr"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </Field>
            <Field label="ایمیل">
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
                placeholder="info@example.com"
                dir="ltr"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </Field>
          </div>
        </div>
      )}

      {/* تب آگهی‌ها */}
      {activeTab === 'posts' && (
        <>
          {/* 🔑 حالت تأیید آگهی */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">حالت تأیید آگهی</h3>
                <p className="text-[11px] text-gray-500">نحوه برخورد با آگهی‌های جدید</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update('post_approval_mode', 'auto')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  settings.post_approval_mode === 'auto'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">⚡</div>
                <div className={`text-sm font-bold ${settings.post_approval_mode === 'auto' ? 'text-green-700' : 'text-gray-700'}`}>
                  خودکار
                </div>
                <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  آگهی بلافاصله منتشر می‌شه
                </div>
              </button>

              <button
                onClick={() => update('post_approval_mode', 'manual')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  settings.post_approval_mode === 'manual'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">👨‍💼</div>
                <div className={`text-sm font-bold ${settings.post_approval_mode === 'manual' ? 'text-amber-700' : 'text-gray-700'}`}>
                  دستی (توسط ادمین)
                </div>
                <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  آگهی منتظر تأیید ادمین می‌مونه
                </div>
              </button>
            </div>

            <div className={`text-xs p-3 rounded-xl ${
              settings.post_approval_mode === 'auto'
                ? 'bg-green-50 text-green-800'
                : 'bg-amber-50 text-amber-800'
            }`}>
              {settings.post_approval_mode === 'auto'
                ? '⚡ در این حالت، هر آگهی جدید بلافاصله در اپ نمایش داده می‌شه.'
                : '👨‍💼 در این حالت، هر آگهی جدید ابتدا در صف «در انتظار تأیید» قرار می‌گیره و فقط پس از تأیید ادمین نمایش داده می‌شه.'}
            </div>
          </div>

          {/* محدودیت‌ها */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <SectionTitle icon="📊" title="محدودیت‌ها" />

            <Field label="حداکثر آگهی هر کاربر">
              <input
                type="number"
                min={1}
                max={1000}
                value={settings.max_posts_per_user}
                onChange={(e) => update('max_posts_per_user', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                dir="ltr"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                هر کاربر حداکثر می‌تونه این تعداد آگهی فعال داشته باشه
              </p>
            </Field>

            <Field label="کلمات ممنوعه">
              <textarea
                value={settings.banned_words}
                onChange={(e) => update('banned_words', e.target.value)}
                rows={3}
                placeholder="کلمات رو با کاما جدا کن: کلمه۱, کلمه۲, کلمه۳"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                آگهی‌هایی که شامل این کلمات باشن، خودکار رد می‌شن
              </p>
            </Field>
          </div>
        </>
      )}

      {/* تب امنیت */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <SectionTitle icon="🛡️" title="امنیت" />

          <Field label="مدت اعتبار توکن (روز)">
            <input
              type="number"
              min={1}
              max={365}
              value={settings.token_expiry_days}
              onChange={(e) => update('token_expiry_days', e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              dir="ltr"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              کاربران پس از این مدت باید دوباره وارد بشن
            </p>
          </Field>
        </div>
      )}

      {/* تب محتوا */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <SectionTitle icon="📄" title="متن قوانین و درباره ما" />

          <Field label="متن «درباره ما»">
            <textarea
              value={settings.about_text}
              onChange={(e) => update('about_text', e.target.value)}
              rows={5}
              placeholder="متن درباره ما..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </Field>

          <Field label="متن «قوانین و مقررات»">
            <textarea
              value={settings.rules_text}
              onChange={(e) => update('rules_text', e.target.value)}
              rows={10}
              placeholder="متن قوانین..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </Field>
        </div>
      )}

      {/* تب لاگ‌ها */}
      {activeTab === 'logs' && <AdminLogs token={token!} />}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      <span className="text-xl">{icon}</span>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function AdminLogs({ token }: { token: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      block_user: '🚫 مسدودسازی کاربر',
      unblock_user: '✅ فعال‌سازی کاربر',
      delete_user: '🗑️ حذف کاربر',
      update_user: '✏️ ویرایش کاربر',
      approve_post: '✅ تأیید آگهی',
      reject_post: '❌ رد آگهی',
      delete_post: '🗑️ حذف آگهی',
      update_post: '✏️ ویرایش آگهی',
      change_post_status: '🔄 تغییر وضعیت آگهی',
      change_contract_status: '🔄 تغییر وضعیت قرارداد',
      toggle_contract_review: '🚨 علامت بررسی قرارداد',
      save_contract_note: '📝 یادداشت قرارداد',
      report_resolve: '✅ حل گزارش',
      report_dismiss: '❌ رد گزارش',
      report_delete_target: '🗑️ حذف محتوای گزارش',
      report_block_user: '🚫 مسدودسازی از گزارش',
      report_warn_user: '⚠️ ارسال اخطار',
      send_broadcast: '📢 ارسال اعلان',
      update_settings: '⚙️ تغییر تنظیمات',
    };
    return map[action] || action;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm">
          📋 لاگ فعالیت‌های ادمین ({pagination.total.toLocaleString('fa-IR')})
        </h3>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-sm">
          لاگی ثبت نشده
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800">
                    {actionLabel(log.action)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    👤 {log.admin_name || `ادمین #${log.admin_id}`}
                    {log.target_type && ` • 🎯 ${log.target_type} #${log.target_id}`}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 whitespace-nowrap">
                  {formatDate(log.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <span className="text-xs text-gray-600">{page} از {pagination.pages}</span>
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
  );
}