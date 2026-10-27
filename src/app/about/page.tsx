"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const VALUES = [
  {
    icon: "🛡️",
    title: "امنیت",
    description: "اولویت اول ما امنیت اطلاعات و تراکنش‌های کاربرانه",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
  },
  {
    icon: "🤝",
    title: "اعتماد",
    description: "شفافیت کامل در همه تعاملات و پشتیبانی همیشگی",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
  },
  {
    icon: "⚡",
    title: "سرعت",
    description: "اتصال سریع کارفرما و فریلنسر بدون واسطه‌های اضافی",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
  },
  {
    icon: "🌟",
    title: "کیفیت",
    description: "ترویج فرهنگ کار حرفه‌ای و استانداردهای بالا",
    color: "from-purple-500 to-fuchsia-600",
    bg: "bg-purple-50",
  },
];

const STATS = [
  { value: "۱٬۲۰۰+", label: "فریلنسر فعال", icon: "👥" },
  { value: "۳٬۵۰۰+", label: "پروژه موفق", icon: "✅" },
  { value: "۹۸٪", label: "رضایت کاربران", icon: "⭐" },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: "📝",
    title: "ثبت آگهی یا جستجو",
    description:
      "کارفرما پروژه رو ثبت می‌کنه، فریلنسر پروژه‌های مرتبط رو پیدا می‌کنه",
  },
  {
    step: 2,
    icon: "💬",
    title: "ارتباط و توافق",
    description: "طرفین از طریق چت پلتفرم با هم صحبت می‌کنن و به توافق می‌رسن",
  },
  {
    step: 3,
    icon: "🎯",
    title: "انجام پروژه",
    description: "فریلنسر کار رو انجام می‌ده و کارفرما نتیجه رو دریافت می‌کنه",
  },
];

const TEAM_FEATURES = [
  { icon: "🔒", title: "احراز هویت امن", desc: "ورود با OTP و شماره موبایل" },
  { icon: "💬", title: "چت اختصاصی", desc: "ارتباط مستقیم بدون افشای شماره" },
  { icon: "❤️", title: "ذخیره آگهی", desc: "نشان‌کردن پروژه‌های موردعلاقه" },
  { icon: "🔔", title: "اعلان لحظه‌ای", desc: "اطلاع از پیام‌ها و پیشنهادها" },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      {/* ===== نوار بالا موبایل ===== */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center">
            درباره ما
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* ===== هدر دسکتاپ ===== */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📖 درباره ما
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              داستان، ارزش‌ها و آنچه فریلنسریاب را متفاوت می‌کند
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <svg
              className="w-5 h-5 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            بازگشت
          </button>
        </div>
      </div>

      {/* ===== محتوا ===== */}
      <div className="max-w-6xl mx-auto lg:px-6">
        <div className="lg:grid lg:grid-cols-[400px_1fr] lg:gap-8">
          {/* ===== Sidebar (هیرو + آمار + CTA) ===== */}
          <aside className="lg:block">
            {/* موبایل: هیرو بالای صفحه */}
            <div className="lg:hidden p-4">
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white overflow-hidden shadow-xl shadow-blue-500/20 text-center">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-20 -translate-x-20" />

                <div className="relative">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mb-4 shadow-lg">
                        <Image src="/icons/iconapp.png" className=" rounded-lg" alt="لوگو" width={100} height={50} />
      
                  </div>
                  <h2 className="text-xl font-bold mb-1">فریلنسریاب</h2>
                  <p className="text-xs opacity-90">
                    پل ارتباطی متخصصان و کارفرمایان آنلاین
                  </p>
                </div>
              </div>
            </div>

            {/* دسکتاپ: Sidebar sticky */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {/* هیرو */}
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white overflow-hidden shadow-xl shadow-blue-500/20 text-center">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />

                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mb-4 shadow-lg">
                                   <Image src="/icons/iconapp.png" className=" rounded-lg" alt="لوگو" width={100} height={50} />
      
                    </div>
                    <h2 className="text-xl font-bold mb-1">فریلنسریاب</h2>
                    <p className="text-xs opacity-90 mb-4">
                      پل ارتباطی متخصصان و کارفرمایان آنلاین
                    </p>

                    {/* آمار در دسکتاپ
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {STATS.map((stat, i) => (
                        <div
                          key={i}
                          className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center"
                        >
                          <div className="text-sm mb-0.5">{stat.icon}</div>
                          <div className="text-xs font-bold leading-tight">
                            {stat.value}
                          </div>
                          <div className="text-[9px] opacity-80 mt-0.5 leading-tight">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div> */}
                  </div>
                </div>

                {/* CTA در دسکتاپ */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16" />
                  <div className="relative text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="font-bold text-sm mb-1">
                      آماده‌ای شروع کنی؟
                    </h3>
                    <p className="text-xs opacity-90 mb-4">
                      همین حالا به جمع فریلنسرها و کارفرمایان ما بپیوند
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/create-post"
                        className="bg-white text-emerald-700 py-2.5 rounded-xl font-semibold text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-center"
                      >
                        ثبت آگهی
                      </Link>
                      <Link
                        href="/explore"
                        className="bg-white/20 backdrop-blur-sm border border-white/30 text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-white/30 active:scale-[0.98] transition-all text-center"
                      >
                        جستجوی پروژه
                      </Link>
                    </div>
                  </div>
                </div>

                {/* لینک‌های مرتبط در دسکتاپ */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-3">
                    صفحات مرتبط
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/rules"
                      className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
                    >
                      <span className="text-base">📜</span>
                      <span className="text-xs font-medium text-gray-700">
                        قوانین و مقررات
                      </span>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
                    >
                      <span className="text-base">📞</span>
                      <span className="text-xs font-medium text-gray-700">
                        تماس با ما
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ===== ستون محتوا ===== */}
          <main className="p-4 lg:p-0 space-y-4 lg:space-y-5">
            {/* داستان ما */}
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
                <span>📖</span> داستان ما
              </h2>
              <div className="space-y-3 lg:space-y-4 text-sm lg:text-base text-gray-700 leading-relaxed">
                <p>
                  فریلنسریاب در سال ۱۴۰۳ با یک هدف ساده اما بزرگ متولد شد:{" "}
                  <span className="font-semibold text-blue-700">
                    هر کسی بتواند با تخصص خود کسب درآمد کند.
                  </span>
                </p>
                <p>
                  ما دیدیم که بسیاری از متخصصان ایرانی استعداد و مهارت بالایی
                  دارن اما راهی برای رسوندن خودشون به کارفرمایان مناسب پیدا
                  نمی‌کنن. از طرف دیگه، خیلی از کارفرماها نمی‌دونن چطور بهترین
                  فریلنسر رو پیدا کنن.
                </p>
                <p className="bg-blue-50 border-r-4 border-blue-500 p-3 lg:p-4 rounded-l-lg text-blue-900 text-xs lg:text-sm">
                  فریلنسریاب این فاصله رو پر می‌کنه — با بستری امن، سریع و شفاف
                  که هر دو طرف رو به هم می‌رسونه.
                </p>
              </div>
            </div>

            {/* ارزش‌های ما */}
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
                <span>💎</span> ارزش‌های ما
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {VALUES.map((value, i) => (
                  <div
                    key={i}
                    className={`${value.bg} rounded-xl p-3 lg:p-4 border border-gray-100`}
                  >
                    <div
                      className={`w-9 h-9 lg:w-11 lg:h-11 rounded-lg bg-gradient-to-br ${value.color} flex items-center justify-center text-white text-base lg:text-lg mb-2 shadow-md`}
                    >
                      {value.icon}
                    </div>
                    <h3 className="font-bold text-xs lg:text-sm text-gray-800 mb-0.5 lg:mb-1">
                      {value.title}
                    </h3>
                    <p className="text-[10px] lg:text-xs text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* چطور کار می‌کنه */}
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
                <span>⚙️</span> فریلنسریاب چطور کار می‌کنه؟
              </h2>

              {/* موبایل: عمودی */}
              <div className="lg:hidden space-y-3">
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
                        {step.icon}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="font-bold text-xs text-gray-800 mb-0.5">
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* دسکتاپ: افقی */}
              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5">
                {HOW_IT_WORKS.map((step, i) => (
                  <div
                    key={i}
                    className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md">
                          {step.icon}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-gray-800 leading-tight">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* پیکان بین مراحل */}
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -left-3 -translate-y-1/2 text-blue-400 text-2xl font-bold pointer-events-none">
                        ←
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* امکانات پلتفرم */}
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm lg:text-lg mb-3 lg:mb-4 flex items-center gap-2">
                <span>✨</span> چی برات فراهم کردیم؟
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
                {TEAM_FEATURES.map((feat, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 rounded-xl p-3 lg:p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="text-xl lg:text-2xl mb-1.5 lg:mb-2">
                      {feat.icon}
                    </div>
                    <h3 className="font-bold text-[11px] lg:text-sm text-gray-800 mb-0.5 lg:mb-1">
                      {feat.title}
                    </h3>
                    <p className="text-[10px] lg:text-xs text-gray-500 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA و لینک‌های مرتبط — فقط موبایل (در دسکتاپ در Sidebar هستند) */}
            <div className="lg:hidden space-y-4">
              {/* CTA */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16" />
                <div className="relative text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-sm mb-1">آماده‌ای شروع کنی؟</h3>
                  <p className="text-xs opacity-90 mb-4">
                    همین حالا به جمع فریلنسرها و کارفرمایان ما بپیوند
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/create-post"
                      className="flex-1 bg-white text-emerald-700 py-2.5 rounded-xl font-semibold text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-center"
                    >
                      ثبت آگهی
                    </Link>
                    <Link
                      href="/explore"
                      className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-white/30 active:scale-[0.98] transition-all text-center"
                    >
                      جستجوی پروژه
                    </Link>
                  </div>
                </div>
              </div>

              {/* لینک‌های مرتبط */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-3">
                  صفحات مرتبط
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/rules"
                    className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    <span className="text-base">📜</span>
                    <span className="text-xs font-medium text-gray-700">
                      قوانین
                    </span>
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    <span className="text-base">📞</span>
                    <span className="text-xs font-medium text-gray-700">
                      تماس با ما
                    </span>
                  </Link>
                </div>
              </div>

              {/* پیام پایانی */}
              <div className="text-center py-2">
                <p className="text-[10px] text-gray-400 leading-relaxed flex items-center justify-center gap-1">
                  ساخته شده با{" "}
                  <span className="text-red-400 animate-pulse">❤️</span> برای
                  فریلنسرهای ایران
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
