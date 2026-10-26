// app/register/details/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { authAPI } from "@/app/services/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    if (
      user?.full_name &&
      String(user.full_name).trim() &&
      !showCompleteModal
    ) {
      router.push("/");
    }
  }, [user, router, showCompleteModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || firstName.trim().length < 2) {
      setError("نام باید حداقل ۲ کاراکتر باشد");
      return;
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      setError("نام خانوادگی باید حداقل ۲ کاراکتر باشد");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const data = await authAPI.completeProfile(
        firstName.trim(),
        lastName.trim(),
      );

      if (data.user) {
        updateUser(data.user);
      }

      setShowCompleteModal(true);
    } catch (err: any) {
      setError(err.message || "خطا در ذخیره اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    router.push("/profile/edit");
  };

  const handleSkipComplete = () => {
    router.push("/");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 lg:p-6 relative overflow-hidden">
      {/* 🎨 دکوراسیون پس‌زمینه — فقط دسکتاپ */}
      <div className="hidden lg:block absolute top-20 right-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden lg:block absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden lg:block absolute top-1/3 left-1/4 w-48 h-48 bg-purple-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* 🎴 کارت اصلی */}
      <div className="relative bg-white rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl max-w-md lg:max-w-lg w-full p-6 lg:p-10">
        {/* هدر */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="text-6xl lg:text-7xl mb-3 lg:mb-4">👋</div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            خوش آمدید!
          </h1>
          <p className="text-gray-500 mt-2 text-sm lg:text-base">
            برای ادامه، لطفاً نام و نام خانوادگی خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          <div>
            <label className="block text-sm lg:text-base font-semibold text-gray-700 mb-2">
              نام <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثال: علی"
              className="w-full p-3 lg:p-3.5 bg-gray-50 lg:bg-white border border-gray-300 rounded-lg lg:rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              autoFocus
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm lg:text-base font-semibold text-gray-700 mb-2">
              نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="مثال: محمدی"
              className="w-full p-3 lg:p-3.5 bg-gray-50 lg:bg-white border border-gray-300 rounded-lg lg:rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              maxLength={50}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 lg:p-3.5 rounded-lg lg:rounded-xl text-sm flex items-center gap-2 border border-red-200">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 lg:py-3.5 rounded-lg lg:rounded-xl font-semibold text-lg lg:text-base shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:shadow-none transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              "ذخیره و ادامه"
            )}
          </button>
        </form>

        <p className="text-xs lg:text-sm text-gray-400 text-center mt-6 lg:mt-8">
          شماره موبایل شما: <span className="font-semibold text-gray-600" dir="ltr">{user?.phone}</span>
        </p>
      </div>

      {/* ============================================
          مودال تکمیل پروفایل
      ============================================ */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm lg:max-w-md rounded-3xl p-6 lg:p-8 shadow-2xl animate-scale-in">
            {/* هدر مودال */}
            <div className="text-center mb-5 lg:mb-6">
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-lg opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl lg:text-5xl shadow-xl">
                  ✨
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-lg lg:text-xl mb-2">
                پروفایلت رو تکمیل کن!
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                با تکمیل پروفایل، شانس دیده شدنت توسط کارفرماها چند برابر می‌شه
              </p>
            </div>

            {/* مزایا */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 lg:mb-6 space-y-2.5 lg:space-y-3 border border-blue-100">
              <div className="flex items-start gap-2.5 lg:gap-3">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm lg:text-base shrink-0">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-semibold text-blue-900">
                    مهارت‌هات رو اضافه کن
                  </p>
                  <p className="text-[10px] lg:text-xs text-blue-700 mt-0.5 leading-relaxed">
                    با ثبت مهارت‌ها، کارفرماها سریع‌تر پیدات می‌کنن
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 lg:gap-3">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm lg:text-base shrink-0">
                  📝
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-semibold text-purple-900">
                    بیو حرفه‌ای بنویس
                  </p>
                  <p className="text-[10px] lg:text-xs text-purple-700 mt-0.5 leading-relaxed">
                    یه معرفی کوتاه از خودت، اعتماد کارفرما رو جلب می‌کنه
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 lg:gap-3">
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm lg:text-base shrink-0">
                  🏆
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-semibold text-amber-900">
                    سطح تجربه‌ات رو مشخص کن
                  </p>
                  <p className="text-[10px] lg:text-xs text-amber-700 mt-0.5 leading-relaxed">
                    پروژه‌های مناسب سطح تو بهت پیشنهاد می‌شه
                  </p>
                </div>
              </div>
            </div>

            {/* دکمه‌ها */}
            <div className="space-y-2">
              <button
                onClick={handleCompleteProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm lg:text-base shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                بله، الان تکمیل می‌کنم
              </button>
              <button
                onClick={handleSkipComplete}
                className="w-full text-gray-500 py-3 rounded-xl font-semibold text-sm lg:text-base hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                بعداً از پروفایل تکمیل می‌کنم
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}