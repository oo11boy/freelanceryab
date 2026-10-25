// app/components/ContractBar.tsx
"use client";
import { useState } from "react";
import { contractsAPI } from "@/app/services/api";

interface Contract {
  id: number;
  status: "in_progress" | "delivered" | "completed" | "cancelled";
}

interface Props {
  contract: Contract | null;
  role: "client" | "freelancer" | null;
  postId: number;
  otherUserId: number;
  onRefresh: () => void;
  onRate: () => void;
  hasRated: boolean;
  otherReview: any;
}

type ActionType = "start" | "deliver" | "confirm" | "cancel";

interface ConfirmState {
  action: ActionType;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: "blue" | "green" | "red" | "emerald";
  icon: string;
}

export default function ContractBar({
  contract,
  role,
  postId,
  otherUserId,
  onRefresh,
  onRate,
  hasRated,
  otherReview,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const runAction = async (action: ActionType) => {
    if (busy) return;
    setBusy(true);
    try {
      if (action === "start") {
        await contractsAPI.start(postId, otherUserId);
      } else if (contract) {
        await contractsAPI.update(contract.id, action);
      }
      setConfirmState(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message || "خطا");
    } finally {
      setBusy(false);
    }
  };

  const openConfirm = (state: ConfirmState) => setConfirmState(state);

  const confirmColorMap = {
    blue: "from-blue-600 to-indigo-600 shadow-blue-500/30",
    green: "from-green-600 to-emerald-600 shadow-green-500/30",
    red: "from-red-500 to-rose-600 shadow-red-500/30",
    emerald: "from-emerald-600 to-teal-600 shadow-emerald-500/30",
  };

  const renderConfirmModal = () => {
    if (!confirmState) return null;
    const { title, message, confirmText, confirmColor, icon } = confirmState;
    return (
      <div
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4"
        onClick={() => !busy && setConfirmState(null)}
      >
        <div
          className="bg-white w-full max-w-sm rounded-3xl p-6 animate-zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-5">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-3xl">
              {icon}
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1.5">
              {title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmState(null)}
              disabled={busy}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              onClick={() => runAction(confirmState.action)}
              disabled={busy}
              className={`flex-[2] bg-gradient-to-r ${confirmColorMap[confirmColor]} text-white py-3 rounded-xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  لطفاً صبر کنید...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =================================================
  // حالت ۱: قراردادی وجود نداره
  // =================================================
  if (!contract) {
    if (role === null) return null;

    if (role === "freelancer") {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl shrink-0 animate-pulse">
              ⏳
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blue-900 mb-0.5">
                در انتظار شروع پروژه
              </p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                کارفرما باید پروژه رو از اینجا شروع کنه. بعد از شروع، می‌تونی
                کار رو انجام بدی و تحویل بدی.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-b-2 border-indigo-700 px-4 py-4 text-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shrink-0 shadow-lg">
            🚀
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-0.5">شروع رسمی پروژه</h3>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              با شروع پروژه، فریلنسر مطلع می‌شه و بعد از تحویل کار می‌تونید
              به هم امتیاز بدید. این کار سابقه همکاری شما رو ثبت می‌کنه.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            openConfirm({
              action: "start",
              title: "شروع پروژه با این فریلنسر؟",
              message:
                "با شروع پروژه، به فریلنسر اطلاع داده می‌شه که می‌تونه کار رو شروع کنه. پس از تحویل و تأیید شما، هر دو طرف می‌تونید به هم امتیاز بدید.",
              confirmText: "بله، شروع کن",
              confirmColor: "blue",
              icon: "🚀",
            })
          }
          disabled={busy}
          className="w-full bg-white text-indigo-700 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
          شروع پروژه
        </button>
        {renderConfirmModal()}
      </div>
    );
  }

  // =================================================
  // حالت ۲: در حال انجام
  // =================================================
  if (contract.status === "in_progress") {
    const isFreelancer = role === "freelancer";
    const isClient = role === "client";

    return (
      <div
        className={`border-b-2 px-4 py-3 ${
          isFreelancer
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
              isFreelancer ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            <span className="animate-pulse">🔄</span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-bold mb-0.5 ${
                isFreelancer ? "text-green-900" : "text-blue-900"
              }`}
            >
              {isFreelancer
                ? "پروژه در دست انجام توست"
                : "پروژه در حال انجامه"}
            </p>
            <p
              className={`text-[11px] leading-relaxed ${
                isFreelancer ? "text-green-700" : "text-blue-700"
              }`}
            >
              {isFreelancer
                ? "وقتی کار تموم شد، روی «تحویل پروژه» بزن تا کارفرما تأیید کنه"
                : "منتظر تحویل کار از فریلنسر هستی. بعد از تحویل، می‌تونی تأیید کنی"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {isFreelancer && (
            <button
              onClick={() =>
                openConfirm({
                  action: "deliver",
                  title: "پروژه رو تحویل می‌دی؟",
                  message:
                    "با زدن تحویل، به کارفرما اطلاع داده می‌شه که کار تموم شده. کارفرما باید تأیید کنه تا پروژه تکمیل بشه و امتیازدهی فعال شه.",
                  confirmText: "بله، تحویل می‌دم",
                  confirmColor: "green",
                  icon: "📦",
                })
              }
              disabled={busy}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              تحویل پروژه
            </button>
          )}
          {isClient && (
            <button
              onClick={() =>
                openConfirm({
                  action: "cancel",
                  title: "لغو قرارداد؟",
                  message:
                    "با لغو قرارداد، پروژه بسته می‌شه و امکان امتیازدهی وجود نخواهد داشت. آیا مطمئنی؟",
                  confirmText: "بله، لغو کن",
                  confirmColor: "red",
                  icon: "🚫",
                })
              }
              disabled={busy}
              className="flex-1 bg-white border-2 border-red-200 text-red-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              لغو قرارداد
            </button>
          )}
        </div>
        {renderConfirmModal()}
      </div>
    );
  }

  // =================================================
  // حالت ۳: تحویل داده شده - منتظر تأیید کارفرما
  // =================================================
  if (contract.status === "delivered") {
    const isClient = role === "client";

    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-300 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0">
            📦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900 mb-0.5">
              {isClient
                ? "پروژه تحویل داده شد — منتظر تأیید شما"
                : "پروژه تحویل داده شد — منتظر تأیید کارفرما"}
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              {isClient
                ? "کار فریلنسر تموم شده. اگه از نتیجه راضی هستی، تأیید کن تا پروژه تکمیل بشه و هر دو بتونید امتیاز بدید."
                : "کارفرما باید کار رو بررسی و تأیید کنه. بعد از تأیید، هر دو طرف می‌تونید امتیاز بدید."}
            </p>
          </div>
        </div>
        {isClient && (
          <button
            onClick={() =>
              openConfirm({
                action: "confirm",
                title: "کار رو تأیید می‌کنی؟",
                message:
                  "با تأیید شما، پروژه تکمیل می‌شه، به هر دو طرف یک «پروژه موفق» اضافه می‌شه و امکان امتیازدهی دوطرفه فعال می‌شه.",
                confirmText: "بله، تأیید می‌کنم",
                confirmColor: "emerald",
                icon: "✅",
              })
            }
            disabled={busy}
            className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            تأیید دریافت کار
          </button>
        )}
        {renderConfirmModal()}
      </div>
    );
  }

  // =================================================
  // حالت ۴: تکمیل شده
  // =================================================
  if (contract.status === "completed") {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-300 px-4 py-3">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl shrink-0">
            🎉
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-900 mb-0.5">
              تبریک! پروژه با موفقیت انجام شد
            </p>
            <p className="text-[11px] text-green-700 leading-relaxed">
              {!hasRated
                ? "تجربه‌ات از این همکاری چطور بود؟ با ثبت امتیاز، به دیگران کمک می‌کنی"
                : otherReview
                ? "نظر شما و طرف مقابل ثبت شده. ممنون که به شفافیت پلتفرم کمک کردی!"
                : "امتیاز شما ثبت شد. بعد از ثبت امتیاز طرف مقابل، نتیجه نمایش داده می‌شه"}
            </p>
          </div>
        </div>

        {/* امتیاز طرف مقابل (اگه هست) */}
        {otherReview && hasRated && (
          <div className="bg-white/70 rounded-xl p-2.5 mb-2 flex items-center justify-between">
            <span className="text-[11px] text-green-800 font-medium">
              امتیاز طرف مقابل:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm">
                {"⭐".repeat(otherReview.rating)}
              </span>
              <span className="text-[10px] text-green-700 font-bold">
                ({otherReview.rating}/۵)
              </span>
            </div>
          </div>
        )}

        {!hasRated && (
          <button
            onClick={onRate}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>⭐</span>
            ثبت امتیاز و نظر
          </button>
        )}
        {hasRated && (
          <div className="bg-green-100 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs text-green-800 font-bold">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            شما امتیاز دادید
          </div>
        )}
      </div>
    );
  }

  // =================================================
  // حالت ۵: لغو شده
  // =================================================
  if (contract.status === "cancelled") {
    return (
      <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl shrink-0">
            🚫
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-700 mb-0.5">
              این قرارداد لغو شده
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              پروژه توسط کارفرما لغو شد. برای شروع دوباره با این فریلنسر،
              می‌تونید از آگهی دوباره پیام بدید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}