'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Report {
  id: number;
  reporter_id: number;
  target_type: string;
  target_id: number;
  reason: string;
  description: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
  reporter_name: string | null;
  reporter_phone: string;
  admin_name: string | null;
  target_title: string | null;
}

interface Stats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    if (token) loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterStatus, filterType, page]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', filterStatus);
      params.set('type', filterType);
      params.set('page', String(page));

      const res = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setReports(data.reports || []);
      setStats(data.stats || { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 });
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
    s === 'pending' ? 'در انتظار'
    : s === 'reviewed' ? 'بررسی شد'
    : s === 'resolved' ? 'حل شد'
    : s === 'dismissed' ? 'رد شد'
    : s;

  const statusClass = (s: string) =>
    s === 'pending' ? 'bg-amber-50 text-amber-700'
    : s === 'reviewed' ? 'bg-sky-50 text-sky-700'
    : s === 'resolved' ? 'bg-green-50 text-green-700'
    : 'bg-gray-100 text-gray-600';

  const typeLabel = (t: string) =>
    t === 'post' ? '📝 آگهی'
    : t === 'user' ? '👤 کاربر'
    : t === 'message' ? '💬 پیام'
    : t;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">گزارش‌های تخلف</h1>
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          {pagination.total.toLocaleString('fa-IR')} گزارش
        </p>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat label="کل" value={stats.total} color="blue" icon="📋" />
        <MiniStat label="در انتظار" value={stats.pending} color="amber" icon="⏳" />
        <MiniStat label="بررسی شد" value={stats.reviewed} color="sky" icon="👁️" />
        <MiniStat label="حل شد" value={stats.resolved} color="green" icon="✅" />
        <MiniStat label="رد شد" value={stats.dismissed} color="gray" icon="❌" />
      </div>

      {/* فیلتر */}
      <div className="bg-white rounded-2xl p-3 lg:p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'pending', l: '⏳ در انتظار' },
            { v: 'all', l: 'همه' },
            { v: 'reviewed', l: 'بررسی شد' },
            { v: 'resolved', l: 'حل شد' },
            { v: 'dismissed', l: 'رد شد' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => { setFilterStatus(f.v); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === f.v
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              {f.l}
            </button>
          ))}

          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="mr-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه انواع</option>
            <option value="post">📝 آگهی</option>
            <option value="user">👤 کاربر</option>
            <option value="message">💬 پیام</option>
          </select>
        </div>
      </div>

      {/* لیست */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-gray-700 font-semibold mb-1">گزارشی وجود ندارد</p>
            <p className="text-sm text-gray-500">اوضاع عالیه!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/admin/reports/${r.id}`}
                className="p-4  items-start gap-3 hover:bg-gray-50 transition-colors block"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-xl shrink-0">
                  🚨
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${statusClass(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {typeLabel(r.target_type)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 truncate mb-0.5">
                    {r.reason}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {r.target_title ? `هدف: ${r.target_title}` : `ID: ${r.target_id}`}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    گزارش‌دهنده: {r.reporter_name || 'ناشناس'} • {formatDate(r.created_at)}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

function MiniStat({ label, value, color, icon }: {
  label: string; value: number;
  color: 'blue' | 'amber' | 'sky' | 'green' | 'gray'; icon: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
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