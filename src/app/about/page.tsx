export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">درباره ما</h1>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold mb-2">فریلنسرکار</h2>
          <p className="opacity-90">پل ارتباطی متخصصان و کارفرمایان آنلاین</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 leading-relaxed mb-4">
            فریلنسرکار در سال ۱۴۰۳ با هدف ایجاد بستری امن و کارآمد برای انجام
            پروژه‌های آنلاین تأسیس شد.
          </p>
          <p className="text-gray-600 leading-relaxed">
            ما معتقدیم هر کسی می‌تواند با تخصص خود کسب درآمد کند و هر کارفرمایی
            می‌تواند بهترین متخصص را پیدا کند.
          </p>
        </div>
      </div>
    </div>
  );
}
