'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [report, setReport] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [previousReports, setPreviousReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (token) loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data.report);
      setTarget(data.target);
      setPreviousReports(data.previousReports || []);
      setNote(data.report.admin_note || '');
    } catch {
      router.push('/admin/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (['delete-target', 'block-user'].includes(action)) {
      if (!confirm(`آیا از انجام این عملیات مطمئنید؟`)) return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      loadReport();
    } catch {
      alert('خطا');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return '—'; }
  };

  const statusLabel = (s: string) =>
    s === 'pending' ? 'در انتظار'
    : s === 'reviewed' ? 'بررسی شد'
    : s === 'resolved' ? 'حل شد'
    : s === 'dismissed' ? 'رد شد'
    : s;

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">بررسی گزارش</h1>
          <p className="text-xs text-gray-500">#{report.id}</p>
        </div>
      </div>

      {/* اطلاعات گزارش */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="text-sm font-bold text-gray-800">{report.reason}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {report.target_type === 'post' ? '📝 آگهی'
                : report.target_type === 'user' ? '👤 کاربر'
                : '💬 پیام'}
            </div>
          </div>
        </div>

        {report.description && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <div className="text-[10px] text-gray-500 mb-1">توضیحات گزارش‌دهنده:</div>
            <div className="text-sm text-gray-700 leading-relaxed">{report.description}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-[10px] text-blue-600">گزارش‌دهنده</div>
            <div className="font-semibold text-blue-800 truncate">{report.reporter_name}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-[10px] text-gray-500">تاریخ</div>
            <div className="font-semibold text-gray-700">{formatDate(report.created_at)}</div>
          </div>
        </div>
      </div>

      {/* محتوای گزارش‌شده */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-3">📋 محتوای گزارش‌شده</h3>

        {!target ? (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
            محتوا حذف شده یا یافت نشد
          </div>
        ) : report.target_type === 'post' ? (
          <Link
            href={`/admin/posts/${target.id}`}
            className="block bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="font-semibold text-gray-800 text-sm mb-1">{target.title}</div>
            <div className="text-[11px] text-gray-500">
              {target.user_name} • {formatDate(target.created_at)}
            </div>
            <div className="text-xs text-gray-600 line-clamp-2 mt-2">{target.description}</div>
          </Link>
        ) : report.target_type === 'user' ? (
          <Link
            href={`/admin/users/${target.id}`}
            className="block bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="font-semibold text-gray-800 text-sm">{target.full_name}</div>
            <div className="text-[11px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
              {target.phone}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              ⭐ {Number(target.rating).toFixed(1)} • {target.completed_projects} پروژه
              {target.is_active === 0 && ' • 🚫 مسدود'}
            </div>
          </Link>
        ) : (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-500 mb-1">
              از {target.sender_name} به {target.receiver_name}
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{target.message}</div>
            <div className="text-[10px] text-gray-400 mt-1">{formatDate(target.created_at)}</div>
          </div>
        )}
      </div>

      {/* گزارش‌های قبلی */}
      {previousReports.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-3">📊 گزارش‌های قبلی برای این هدف</h3>
          <div className="space-y-1.5">
            {previousReports.map((pr) => (
              <Link
                key={pr.id}
                href={`/admin/reports/${pr.id}`}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs"
              >
                <span className="truncate">{pr.reason}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-2 ${
                  pr.status === 'resolved' ? 'bg-green-50 text-green-700' :
                  pr.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {statusLabel(pr.status)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* یادداشت ادمین */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-2">📝 یادداشت ادمین</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="یادداشت یا دلیل اقدام..."
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* دکمه‌های اقدام */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
        <h3 className="font-bold text-gray-800 text-sm mb-1">⚡ اقدام</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction('mark-reviewed')}
            disabled={saving || report.status === 'reviewed'}
            className="py-2.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95 disabled:opacity-40"
          >
            👁️ علامت بررسی شد
          </button>
          <button
            onClick={() => handleAction('dismiss')}
            disabled={saving || report.status === 'dismissed'}
            className="py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 disabled:opacity-40"
          >
            ❌ رد گزارش
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction('warn-user')}
            disabled={saving}
            className="py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 disabled:opacity-40"
          >
            ⚠️ ارسال اخطار
          </button>
          <button
            onClick={() => handleAction('delete-target')}
            disabled={saving}
            className="py-2.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 active:scale-95 disabled:opacity-40"
          >
            🗑️ حذف محتوا
          </button>
        </div>

        <button
          onClick={() => handleAction('block-user')}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 active:scale-95 disabled:opacity-40"
        >
          🚫 مسدودسازی کاربر
        </button>

        <button
          onClick={() => handleAction('resolve')}
          disabled={saving || report.status === 'resolved'}
          className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md active:scale-95 disabled:opacity-50"
        >
          ✅ حل گزارش
        </button>
      </div>

      {/* وضعیت فعلی */}
      <div className="text-center text-[11px] text-gray-500">
        وضعیت فعلی: <span className="font-bold">
          {statusLabel(report.status)}
        </span>
        {report.admin_name && ` • بررسی‌کننده: ${report.admin_name}`}
      </div>
    </div>
  );
}