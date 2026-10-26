'use client';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: 'post' | 'user' | 'message';
  targetId: number;
  token: string | null;
  onSuccess?: () => void;
}

const REASONS = {
  post: [
    'محتوای نامناسب',
    'اطلاعات نادرست یا گمراه‌کننده',
    'تبلیغات اسپم',
    'کلاهبرداری',
    'تکراری',
    'سایر',
  ],
  user: [
    'رفتار نامناسب',
    'کلاهبرداری',
    'حساب جعلی',
    'توهین و تهدید',
    'سایر',
  ],
  message: [
    'پیام توهین‌آمیز',
    'اسپم',
    'کلاهبرداری',
    'تهدید',
    'سایر',
  ],
};

export default function ReportModal({
  open, onClose, targetType, targetId, token, onSuccess,
}: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    if (!reason) {
      setError('دلیل گزارش را انتخاب کنید');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');
      alert('✅ گزارش شما ثبت شد. متشکریم!');
      setReason('');
      setDescription('');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={() => !sending && onClose()}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            🚨 گزارش تخلف
          </h3>
          <button
            onClick={() => !sending && onClose()}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              دلیل گزارش <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {REASONS[targetType].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    reason === r ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              توضیحات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="توضیح بیشتری بدهید..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending || !reason}
              className="flex-[2] bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-xl font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                'ثبت گزارش'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}