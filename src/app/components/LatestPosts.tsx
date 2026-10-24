// این دیتا بعداً از دیتابیس می‌آید – فعلاً استاتیک
const samplePosts = [
  {
    id: 1,
    title: "نیاز به برنامه‌نویس ری‌اکت برای پروژه فروشگاهی",
    price: "توافقی",
    category: "برنامه‌نویسی",
    city: "تهران",
    date: "۲ ساعت پیش",
  },
  {
    id: 2,
    title: "تحقیق درس اقتصاد مهندسی – فوریت دارد",
    price: "۱۵۰ هزار تومان",
    category: "تحقیق درسی",
    city: "مشهد",
    date: "۵ ساعت پیش",
  },
  {
    id: 3,
    title: "ترجمه مقاله تخصصی پزشکی از انگلیسی به فارسی",
    price: "۲۵۰ هزار تومان",
    category: "ترجمه",
    city: "اصفهان",
    date: "دیروز",
  },
];

export default function LatestPosts() {
  return (
    <section className="container mx-auto px-4 py-12 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">آخرین آگهی‌ها</h2>
        <button className="text-blue-600 hover:underline">مشاهده همه</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {samplePosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
              <span>{post.category}</span>
              <span>{post.city}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-bold">{post.price}</span>
              <span className="text-xs text-gray-400">{post.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}