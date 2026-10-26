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

  // اگر کاربر لاگین نیست، به login برود
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // اگر کاربر از قبل نام دارد، به خانه برود (فقط وقتی مودال نمایش داده نمی‌شه)
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

    // اعتبارسنجی
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

      // به‌روزرسانی اطلاعات کاربر در context
      if (data.user) {
        updateUser(data.user);
      }

      // 🔑 به‌جای redirect، مودال نشون بده
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* هدر */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-800">خوش آمدید!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            برای ادامه، لطفاً نام و نام خانوادگی خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              نام <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثال: علی"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="مثال: محمدی"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg disabled:bg-blue-400 transition-all hover:bg-blue-700"
          >
            {loading ? "در حال ذخیره..." : "ذخیره و ادامه"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          شماره موبایل شما: {user?.phone}
        </p>
      </div>

      {/* ============================================
          مودال تکمیل پروفایل
      ============================================ */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in">
            {/* هدر مودال */}
            <div className="text-center mb-5">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-lg opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl shadow-xl">
                  ✨
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">
                پروفایلت رو تکمیل کن!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                با تکمیل پروفایل، شانس دیده شدنت توسط کارفرماها چند برابر می‌شه
              </p>
            </div>

            {/* مزایا */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 space-y-2.5 border border-blue-100">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm shrink-0">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900">
                    مهارت‌هات رو اضافه کن
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5 leading-relaxed">
                    با ثبت مهارت‌ها، کارفرماها سریع‌تر پیدات می‌کنن
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-sm shrink-0">
                  📝
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-900">
                    بیو حرفه‌ای بنویس
                  </p>
                  <p className="text-[10px] text-purple-700 mt-0.5 leading-relaxed">
                    یه معرفی کوتاه از خودت، اعتماد کارفرما رو جلب می‌کنه
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm shrink-0">
                  🏆
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-900">
                    سطح تجربه‌ات رو مشخص کن
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                    پروژه‌های مناسب سطح تو بهت پیشنهاد می‌شه
                  </p>
                </div>
              </div>
            </div>

            {/* دکمه‌ها */}
            <div className="space-y-2">
              <button
                onClick={handleCompleteProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                بله، الان تکمیل می‌کنم
              </button>
              <button
                onClick={handleSkipComplete}
                className="w-full text-gray-500 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                بعداً از پروفایل تکمیل می‌کنم
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
