'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface ContractDetail {
  id: number;
  post_id: number;
  client_id: number;
  freelancer_id: number;
  status: string;
  needs_review: number;
  admin_note: string | null;
  started_at: string;
  delivered_at: string | null;
  completed_at: string | null;
  days_active: number;
  post_title: string | null;
  post_price: string | null;
  post_status: string | null;
  client_name: string | null;
  client_phone: string;
  client_rating: number;
  client_projects: number;
  freelancer_name: string | null;
  freelancer_phone: string;
  freelancer_rating: number;
  freelancer_projects: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: number;
  created_at: string;
  sender_name: string | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: number;
  reviewer_name: string | null;
  reviewee_id: number;
  reviewee_name: string | null;
}

export default function AdminContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStatusBox, setShowStatusBox] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    if (token) loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  const loadContract = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setContract(data.contract);
      setMessages(data.messages || []);
      setReviews(data.reviews || []);
      setNoteInput(data.contract.admin_note || '');
    } catch {
      router.push('/admin/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!pendingStatus) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'change-status',
          status: pendingStatus,
          note: statusNote.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setShowStatusBox(false);
      setStatusNote('');
      setPendingStatus('');
      loadContract();
    } catch {
      alert('خطا در تغییر وضعیت');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReview = async () => {
    if (!contract) return;
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'toggle-review',
          needs_review: contract.needs_review ? 0 : 1,
        }),
      });
      if (!res.ok) throw new Error();
      loadContract();
    } catch {
      alert('خطا');
    }
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'save-note', note: noteInput.trim() }),
      });
      if (!res.ok) throw new Error();
      setShowNoteBox(false);
      loadContract();
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

  const formatDateTime = (date: string) => {
    try {
      return new Date(date).toLocaleString('fa-IR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
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

  if (!contract) return null;

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
          <h1 className="text-lg font-bold text-gray-800">جزئیات قرارداد</h1>
          <p className="text-xs text-gray-500">#{contract.id}</p>
        </div>
        <button
          onClick={handleToggleReview}
          className={`px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all ${
            contract.needs_review
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {contract.needs_review ? '🚨 برداشتن علامت' : '⚠️ نیاز به بررسی'}
        </button>
      </div>

      {/* هشدار نیاز به بررسی */}
      {contract.needs_review === 1 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-700">این قرارداد نیاز به بررسی دارد</div>
            <div className="text-xs text-red-600 mt-0.5">قبلاً توسط ادمین علامت‌گذاری شده است</div>
          </div>
        </div>
      )}

      {/* کارت اصلی */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-2xl shrink-0">
            🤝
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              {contract.post_title || `آگهی #${contract.post_id}`}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusClass(contract.status)}`}>
                {statusLabel(contract.status)}
              </span>
              <span className="text-[10px] text-gray-400">
                📅 {formatDate(contract.started_at)}
              </span>
              {contract.status === 'in_progress' && (
                <span className={`text-[10px] ${contract.days_active > 14 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  ⏱ {contract.days_active} روز
                </span>
              )}
            </div>
            {contract.post_price && (
              <div className="text-xs text-emerald-700 font-bold mt-1">
                💰 {Number(contract.post_price).toLocaleString('fa-IR')} تومان
              </div>
            )}
          </div>
        </div>

        {/* تایم‌لاین */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-blue-600 mb-0.5">شروع</div>
            <div className="text-[11px] font-bold text-blue-700">{formatDate(contract.started_at)}</div>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${contract.delivered_at ? 'bg-sky-50' : 'bg-gray-50'}`}>
            <div className={`text-[10px] mb-0.5 ${contract.delivered_at ? 'text-sky-600' : 'text-gray-400'}`}>تحویل</div>
            <div className={`text-[11px] font-bold ${contract.delivered_at ? 'text-sky-700' : 'text-gray-400'}`}>
              {formatDate(contract.delivered_at)}
            </div>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${contract.completed_at ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`text-[10px] mb-0.5 ${contract.completed_at ? 'text-green-600' : 'text-gray-400'}`}>تکمیل</div>
            <div className={`text-[11px] font-bold ${contract.completed_at ? 'text-green-700' : 'text-gray-400'}`}>
              {formatDate(contract.completed_at)}
            </div>
          </div>
        </div>
      </div>

      {/* طرفین */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* کارفرما */}
        <Link
          href={`/admin/users/${contract.client_id}`}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="text-[10px] text-blue-600 font-bold mb-2">📋 کارفرما</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {contract.client_name?.charAt(0) || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {contract.client_name || 'بدون نام'}
              </div>
              <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                {contract.client_phone}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                ⭐ {Number(contract.client_rating).toFixed(1)} • {contract.client_projects} پروژه
              </div>
            </div>
          </div>
        </Link>

        {/* فریلنسر */}
        <Link
          href={`/admin/users/${contract.freelancer_id}`}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
        >
          <div className="text-[10px] text-green-600 font-bold mb-2">🔨 فریلنسر</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {contract.freelancer_name?.charAt(0) || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {contract.freelancer_name || 'بدون نام'}
              </div>
              <div className="text-[10px] text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                {contract.freelancer_phone}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                ⭐ {Number(contract.freelancer_rating).toFixed(1)} • {contract.freelancer_projects} پروژه
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* مداخله در وضعیت */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-sm mb-3">🔧 مداخله در وضعیت</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'in_progress', l: 'در جریان', c: 'amber' },
            { v: 'delivered', l: 'تحویل', c: 'sky' },
            { v: 'completed', l: 'تکمیل', c: 'green' },
            { v: 'cancelled', l: 'لغو', c: 'red' },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => {
                if (contract.status === s.v) return;
                setPendingStatus(s.v);
                setShowStatusBox(true);
              }}
              disabled={contract.status === s.v}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 ${
                contract.status === s.v
                  ? 'bg-gray-100 text-gray-400'
                  : s.c === 'green' ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : s.c === 'amber' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : s.c === 'sky' ? 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>

        {showStatusBox && pendingStatus && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl animate-fade-in">
            <div className="text-xs text-gray-600 mb-2">
              تغییر وضعیت به «{statusLabel(pendingStatus)}» — دلیل (اختیاری):
            </div>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={2}
              placeholder="مثلاً: اختلاف بین طرفین، عدم تحویل به‌موقع..."
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setShowStatusBox(false); setStatusNote(''); setPendingStatus(''); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                لغو
              </button>
              <button
                onClick={handleChangeStatus}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '...' : 'تأیید تغییر'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* یادداشت ادمین */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">📝 یادداشت ادمین</h3>
          {!showNoteBox ? (
            <button
              onClick={() => setShowNoteBox(true)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              {contract.admin_note ? 'ویرایش' : 'افزودن'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNoteBox(false); setNoteInput(contract.admin_note || ''); }}
                className="text-xs text-gray-500 hover:underline"
              >
                لغو
              </button>
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50"
              >
                {saving ? '...' : 'ذخیره'}
              </button>
            </div>
          )}
        </div>

        {showNoteBox ? (
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            rows={3}
            placeholder="یادداشت داخلی درباره این قرارداد..."
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : contract.admin_note ? (
          <div className="text-sm text-gray-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
            {contract.admin_note}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-3">یادداشتی ثبت نشده</p>
        )}
      </div>

      {/* پیام‌های طرفین */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowMessages(!showMessages)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-bold text-gray-800 text-sm">پیام‌های طرفین</h3>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
              {messages.length}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showMessages ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {showMessages && (
          <div className="border-t border-gray-100 p-4 max-h-96 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">پیامی رد و بدل نشده</p>
            ) : (
              messages.map((m) => {
                const isClient = m.sender_id === contract.client_id;
                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      isClient
                        ? 'bg-blue-50 mr-auto'
                        : 'bg-green-50 ml-auto'
                    }`}
                  >
                    <div className={`text-[10px] font-bold mb-1 ${isClient ? 'text-blue-700' : 'text-green-700'}`}>
                      {m.sender_name || 'کاربر'}
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {m.message}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {formatDateTime(m.created_at)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* نظرات */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-3">⭐ نظرات ثبت‌شده</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-gray-800">
                    {r.reviewer_name} → {r.reviewee_name}
                  </div>
                  <div className="text-xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{star <= r.rating ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <div className="text-xs text-gray-600 leading-relaxed">{r.comment}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}