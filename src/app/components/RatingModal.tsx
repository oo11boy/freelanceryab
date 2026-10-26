// src/app/components/RatingModal.tsx
"use client";
import { useState } from "react";

interface Props {
  open: boolean;
  targetName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
}

export default function RatingModal({
  open,
  targetName,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const labels = ["خیلی بد", "بد", "متوسط", "خوب", "عالی"];

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("لطفاً امتیاز بدهید");
      return;
    }
    setSending(true);
    try {
      await onSubmit(rating, comment.trim() || undefined);
      setRating(0);
      setComment("");
      onClose();
    } catch (e: any) {
      alert(e.message || "خطا در ثبت امتیاز");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
      onClick={() => !sending && onClose()}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl p-6 animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-3xl">
            ⭐
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">
            تجربه‌ات چطور بود؟
          </h3>
          <p className="text-xs text-gray-500">
            به {targetName} امتیاز بده
          </p>
        </div>

        {/* ستاره‌ها */}
        <div className="flex justify-center gap-2 mb-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              disabled={sending}
              className="transition-transform active:scale-90 disabled:opacity-50"
            >
              <svg
                className={`w-10 h-10 transition-colors ${
                  star <= (hover || rating)
                    ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                    : "text-gray-300"
                }`}
                fill={star <= (hover || rating) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-amber-600 font-semibold mb-4">
            {labels[rating - 1]}
          </p>
        )}

        {/* نظر */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="نظر خود را بنویسید (اختیاری)..."
          rows={3}
          disabled={sending}
          maxLength={500}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none mb-1"
        />
        <div className="flex justify-end mb-4">
          <span className="text-[10px] text-gray-400">
            {comment.length}/500
          </span>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || rating === 0}
            className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال ارسال...
              </>
            ) : (
              "ثبت امتیاز"
            )}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
          امتیاز شما بعد از ثبت امتیاز طرف مقابل نمایش داده می‌شود
        </p>
      </div>

      <style>{`
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-zoom-in {
          animation: zoom-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}