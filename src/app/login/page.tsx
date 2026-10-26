// app/login/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

// تبدیل ارقام فارسی/عربی به لاتین و حذف غیررقم
const normalizeDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleSendOTP = async () => {
    if (phone.length !== 11 || !phone.startsWith("09")) {
      setError("شماره موبایل معتبر وارد کنید (۱۱ رقم و با ۰۹ شروع شود)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authAPI.sendOTP(phone);
      setStep("otp");
      setTimer(120);
      hasSubmittedRef.current = false;
      if (data.debug_code) {
        console.log("کد تست:", data.debug_code);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code ?? otp.join("");
    if (otpCode.length !== 5) {
      setError("کد تأیید ۵ رقمی را کامل وارد کنید");
      return;
    }
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await authAPI.verifyOTP(phone, otpCode);
      login(data.token, data.user);

      if (data.needsProfileCompletion || data.isNewUser) {
        router.push("/register/details");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
      hasSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = otp.join("");
    if (
      step === "otp" &&
      code.length === 5 &&
      !hasSubmittedRef.current &&
      !loading
    ) {
      hasSubmittedRef.current = true;
      handleVerifyOTP(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  const handleOtpChange = (index: number, value: string) => {
    const clean = normalizeDigits(value).slice(-1);
    if (value && !clean) return;

    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);
    setError("");

    if (clean && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    hasSubmittedRef.current = false;
    await handleSendOTP();
  };

  const handleEditPhone = () => {
    setStep("phone");
    setOtp(["", "", "", "", ""]);
    setError("");
    hasSubmittedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-gray-50">
      {/* ===== موبایل: کارت وسط ===== */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* لوگو */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">🚀</div>
            <h1 className="text-2xl font-bold text-gray-800">فریلنسرکار</h1>
            <p className="text-gray-500 mt-2">بازار کارهای آنلاین</p>
          </div>

          {/* مرحله شماره موبایل */}
          {step === "phone" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  شماره موبایل
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-gray-400 text-xl">
                    📱
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={(e) => setPhone(normalizeDigits(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    placeholder="09123456789"
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-center"
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  با ورود، با{" "}
                  <Link href="/rules" className="text-blue-600">
                    قوانین و مقررات
                  </Link>{" "}
                  موافقت می‌کنید
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg disabled:bg-blue-400 transition-all hover:bg-blue-700"
              >
                {loading ? "در حال ارسال..." : "ادامه"}
              </button>

              <div className="text-center text-sm text-gray-400">
                <p>ورود برای همه کاربران آزاد است</p>
              </div>
            </div>
          )}

          {/* مرحله کد تأیید */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-2">📨</div>
                <p className="text-gray-700">کد تأیید به شماره</p>
                <p
                  dir="ltr"
                  className="font-bold text-blue-600 text-lg mt-1 text-center"
                >
                  {phone.slice(0, 4)}***{phone.slice(7)}
                </p>
                <button
                  onClick={handleEditPhone}
                  className="text-sm text-blue-600 mt-2 hover:underline"
                >
                  ویرایش شماره
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  کد ۵ رقمی را وارد کنید
                </label>
                <div dir="ltr" className="flex justify-center gap-2 md:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading}
                      className="w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                      dir="ltr"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handleVerifyOTP()}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg disabled:bg-green-400 transition-all hover:bg-green-700"
              >
                {loading ? "در حال تأیید..." : "ورود به فریلنسرکار"}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={timer > 0}
                  className={`text-sm ${
                    timer > 0 ? "text-gray-400" : "text-blue-600 hover:underline"
                  }`}
                >
                  {timer > 0 ? (
                    <>
                      ارسال مجدد کد پس از <bdi dir="ltr">{timer}</bdi> ثانیه
                    </>
                  ) : (
                    "ارسال مجدد کد"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* لینک‌های کمکی */}
          <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
            <Link href="/about" className="mx-2 hover:text-gray-600">
              درباره ما
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/rules" className="mx-2 hover:text-gray-600">
              قوانین
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/contact" className="mx-2 hover:text-gray-600">
              تماس با ما
            </Link>
          </div>
        </div>
      </div>

      {/* ===== دسکتاپ: چیدمان دو ستونه ===== */}
      <div className="hidden lg:flex min-h-screen">
        {/* ستون چپ: پنل برند (تبلیغاتی) */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden p-12 flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-40 -translate-x-40" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
                🚀
              </div>
              <div>
                <div className="text-white font-bold text-xl">فریلنسرکار</div>
                <div className="text-white/70 text-sm">بازار کارهای آنلاین</div>
              </div>
            </Link>

            <h2 className="text-4xl font-bold text-white leading-tight mb-6">
              پروژه بعدی‌ات
              <br />
              اینجاست! 🎯
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-md">
              به هزاران فریلنسر و کارفرمای فعال بپیوند و کار حرفه‌ای‌ات را شروع
              کن.
            </p>

            <div className="space-y-4 max-w-md">
              {[
                { icon: "🛡️", text: "امنیت بالا و پرداخت مطمئن" },
                { icon: "⚡", text: "ارتباط سریع بدون واسطه" },
                { icon: "⭐", text: "امتیازدهی شفاف و نظرات واقعی" },
                { icon: "💬", text: "چت اختصاصی و اعلان لحظه‌ای" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl shrink-0">
                    {f.icon}
                  </div>
                  <span className="text-sm font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-white/70 text-sm">
            © ۱۴۰۳ فریلنسرکار — تمامی حقوق محفوظ است
          </div>
        </div>

        {/* ستون راست: فرم ورود */}
        <div className="w-1/2 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            {/* لوگو (فقط دسکتاپ) */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                خوش آمدی 👋
              </h1>
              <p className="text-gray-500 mt-2">
                برای ادامه، شماره موبایلت را وارد کن
              </p>
            </div>

            {/* فرم */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* مرحله شماره موبایل */}
              {step === "phone" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={phone}
                        onChange={(e) =>
                          setPhone(normalizeDigits(e.target.value))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                        placeholder="09123456789"
                        className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
                        dir="ltr"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      با ورود، با{" "}
                      <Link href="/rules" className="text-blue-600 hover:underline">
                        قوانین و مقررات
                      </Link>{" "}
                      موافقت می‌کنید
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-red-100">
                      <span className="text-lg shrink-0">⚠️</span>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        دریافت کد تأیید
                        <svg
                          className="w-5 h-5 rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>

                  <div className="text-center text-sm text-gray-400">
                    <p>ورود برای همه کاربران آزاد است</p>
                  </div>
                </div>
              )}

              {/* مرحله کد تأیید */}
              {step === "otp" && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📨</div>
                    <p className="text-gray-700">کد تأیید به شماره</p>
                    <p
                      dir="ltr"
                      className="font-bold text-blue-600 text-lg mt-1 text-center"
                    >
                      {phone.slice(0, 4)}***{phone.slice(7)}
                    </p>
                    <button
                      onClick={handleEditPhone}
                      className="text-sm text-blue-600 mt-2 hover:underline"
                    >
                      ویرایش شماره
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      کد ۵ رقمی را وارد کنید
                    </label>
                    <div dir="ltr" className="flex justify-center gap-2.5">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={loading}
                          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                          dir="ltr"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-red-100">
                      <span className="text-lg shrink-0">⚠️</span>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleVerifyOTP()}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-green-500/30 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        در حال تأیید...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
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
                        ورود به فریلنسرکار
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={timer > 0}
                      className={`text-sm ${
                        timer > 0
                          ? "text-gray-400"
                          : "text-blue-600 hover:underline"
                      }`}
                    >
                      {timer > 0 ? (
                        <>
                          ارسال مجدد کد پس از{" "}
                          <bdi dir="ltr">{timer}</bdi> ثانیه
                        </>
                      ) : (
                        "ارسال مجدد کد"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* لینک‌های کمکی */}
            <div className="mt-6 text-center text-xs text-gray-400">
              <Link href="/about" className="mx-2 hover:text-gray-600">
                درباره ما
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/rules" className="mx-2 hover:text-gray-600">
                قوانین
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/contact" className="mx-2 hover:text-gray-600">
                تماس با ما
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}