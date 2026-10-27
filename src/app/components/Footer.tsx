import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const quickLinks = [
    { href: "/about", icon: "📖", label: "درباره ما" },
    { href: "/rules", icon: "📜", label: "قوانین" },

    { href: "/explore", icon: "🔍", label: "جستجو" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-800 to-gray-900 text-white mt-12 pb-24 lg:pb-0">
      {/* ===== موبایل ===== */}
      <div className="lg:hidden max-w-md mx-auto px-4 pt-8 pb-4">
        {/* لوگو و توضیح */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                          <Image src="/icons/iconapp.png" className=" rounded-lg" alt="لوگو" width={100} height={50} />
                 
            </div>
            <div className="text-right">
              <div className="font-bold text-base">فریلنسریاب</div>
              <div className="text-[10px] text-gray-400">
                بازار کارهای آنلاین
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            پل ارتباطی متخصصان و کارفرمایان آنلاین — جایی که مهارت‌ها به فرصت
            تبدیل می‌شوند
          </p>
        </div>

        {/* لینک‌های سریع */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors active:scale-[0.98] flex items-center gap-2"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* خط جداکننده */}
        <div className="border-t border-white/10 pt-4 space-y-1.5 text-center">
          <p className="text-[11px] text-gray-400">
            © ۱۴۰۳ فریلنسریاب — تمامی حقوق محفوظ است
          </p>
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
            ساخته شده با
            <span className="text-red-400 animate-pulse">❤️</span>
            برای فریلنسرهای ایران
          </p>
        </div>
      </div>

      {/* ===== دسکتاپ ===== */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
          {/* بالای فوتر: ۴ ستونه */}
          <div className="grid grid-cols-12 gap-8 mb-10">
            {/* ستون ۱: لوگو و توضیح (۴ ستون) */}
            <div className="col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                             <Image src="/icons/iconapp.png" className=" rounded-lg" alt="لوگو" width={100} height={50} />
                    
                </div>
                <div>
                  <div className="font-bold text-lg">فریلنسریاب</div>
                  <div className="text-xs text-gray-400">
                    بازار کارهای آنلاین
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                پل ارتباطی متخصصان و کارفرمایان آنلاین — جایی که مهارت‌ها به
                فرصت تبدیل می‌شوند.
              </p>
            </div>

            {/* ستون ۲: دسترسی سریع (۳ ستون) */}
            <div className="col-span-3">
              <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full" />
                دسترسی سریع
              </h4>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ستون ۴: تماس و شبکه‌های اجتماعی (۲ ستون) */}
            <div className="col-span-2">
              <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                ارتباط
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>📞</span>
                    تماس با ما
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rules"
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>📜</span>
                    قوانین
                  </Link>
                </li>

                <li>
                  <a
                    href="https://instagram.com/unicodewebdesign"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>📷</span>
                    اینستاگرام
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* پایین فوتر: کپی‌رایت */}
          <div className="border-t border-white/10 pt-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs text-gray-400">
              © ۱۴۰۳ فریلنسریاب — تمامی حقوق محفوظ است
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              ساخته شده با
              <span className="text-red-400 animate-pulse">❤️</span>
              برای فریلنسرهای ایران
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
