export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          به همیار مجازی خوش آمدید
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          جایگاه امن برای یافتن متخصص و انجام پروژه‌های آنلاین
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <input
            type="text"
            placeholder="مثلاً: برنامه‌نویسی پایتون، تحقیق درسی، ترجمه..."
            className="px-6 py-3 rounded-lg text-gray-800 w-full md:w-96 focus:outline-none"
          />
          <button className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400">
            جستجوی پروژه
          </button>
        </div>
      </div>
    </section>
  );
}