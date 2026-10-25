import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-800 to-gray-900 text-white mt-12 pb-24">
      <div className="max-w-md mx-auto px-4 pt-8 pb-4">
        {/* لوگو و توضیح */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🚀
            </div>
            <div className="text-right">
              <div className="font-bold text-base">فریلنسرکار</div>
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
          <Link
            href="/about"
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors active:scale-[0.98] flex items-center gap-2"
          >
            <span className="text-lg">📖</span>
            <span className="text-xs font-medium">درباره ما</span>
          </Link>
          <Link
            href="/rules"
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors active:scale-[0.98] flex items-center gap-2"
          >
            <span className="text-lg">📜</span>
            <span className="text-xs font-medium">قوانین</span>
          </Link>
          <Link
            href="/contact"
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors active:scale-[0.98] flex items-center gap-2"
          >
            <span className="text-lg">📞</span>
            <span className="text-xs font-medium">تماس با ما</span>
          </Link>
          <Link
            href="/explore"
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-colors active:scale-[0.98] flex items-center gap-2"
          >
            <span className="text-lg">🔍</span>
            <span className="text-xs font-medium">جستجو</span>
          </Link>
        </div>

        {/* هشدار امنیتی کوتاه */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6 flex items-start gap-2">
          <span className="text-base shrink-0">🛡️</span>
          <p className="text-[11px] text-amber-200 leading-relaxed">
            برای امنیت خود، پرداخت‌ها را فقط از طریق پلتفرم انجام دهید و به
            درخواست‌های واریز شخصی اعتماد نکنید.
          </p>
        </div>

        {/* خط جداکننده */}
        <div className="border-t border-white/10 pt-4 space-y-1.5 text-center">
          <p className="text-[11px] text-gray-400">
            © ۱۴۰۳ فریلنسرکار — تمامی حقوق محفوظ است
          </p>
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
            ساخته شده با
            <span className="text-red-400 animate-pulse">❤️</span>
            برای فریلنسرهای ایران
          </p>
        </div>
      </div>
    </footer>
  );
}