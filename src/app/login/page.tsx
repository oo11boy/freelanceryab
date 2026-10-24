// app/login/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

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

  // تایمر برای ارسال مجدد کد
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // فوکوس خودکار روی فیلد اول OTP
  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // ارسال کد تأیید
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
      if (data.debug_code) {
        console.log("کد تست:", data.debug_code);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // تأیید کد
  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 5) {
      setError("کد تأیید ۵ رقمی را کامل وارد کنید");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authAPI.verifyOTP(phone, otpCode);

      // ذخیره توکن و اطلاعات کاربر
      login(data.token, data.user);

      // ✅ بررسی نیاز به تکمیل پروفایل
      if (data.needsProfileCompletion || data.isNewUser) {
        router.push("/register/details");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // اگر همه فیلدها پر شد، خودکار تأیید کن
    if (value && index === 4 && newOtp.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOTP(), 500);
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
    await handleSendOTP();
  };

  const handleEditPhone = () => {
    setStep("phone");
    setOtp(["", "", "", "", ""]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendOTP()}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
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
              <p className="font-bold text-blue-600 text-lg mt-1">
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
              <div className="flex justify-center flex-row-reverse gap-2 md:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 md:w-14 md:h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
              onClick={handleVerifyOTP}
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
                {timer > 0
                  ? `ارسال مجدد کد پس از ${timer} ثانیه`
                  : "ارسال مجدد کد"}
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
  );
}
