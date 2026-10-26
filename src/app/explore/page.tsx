'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PostCard from "@/app/components/PostCard";
import { postsAPI } from "@/app/services/api";
import { useCategories, categoryLabel, categoryIcon } from "@/app/hooks/useCategories";

interface Post {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  created_at: string;
}

const SORT_MAP: Record<string, string> = {
  newest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
  most_viewed: "most_viewed",
};

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین", icon: "🕐" },
  { value: "price_asc", label: "ارزان‌ترین", icon: "📈" },
  { value: "price_desc", label: "گران‌ترین", icon: "📉" },
  { value: "most_viewed", label: "پربازدیدترین", icon: "👁️" },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, search]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = { sort: SORT_MAP[sortBy] || "newest" };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      const data = await postsAPI.getPosts(params);
      setPosts(data.posts || []);
    } catch (error) {
      console.error("خطا:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setSelectedCategory("");
    setSortBy("newest");
    setSearch("");
    setSearchInput("");
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0) +
    (search ? 1 : 0);

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "لحظاتی پیش";
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} روز پیش`;
    return `${Math.floor(days / 30)} ماه پیش`;
  };

  // 🔑 محتوای مشترک بین موبایل و دسکتاپ: فیلترها
  const FiltersContent = ({ embedded = false }: { embedded?: boolean }) => (
    <>
      <div className={`flex items-center justify-between mb-3 ${embedded ? "" : ""}`}>
        <h3 className="font-bold text-sm lg:text-base text-gray-800 flex items-center gap-1.5">
          <span>⚙️</span> فیلترهای پیشرفته
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-red-500 font-medium hover:underline"
          >
            حذف همه
          </button>
        )}
      </div>

      <div className="space-y-5">
   <div>
  <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">
    💰 محدوده قیمت (تومان)
  </label>
  <div className="flex flex-col items-center gap-2">
    <input
      type="text"
      inputMode="numeric"
      placeholder="حداقل"
      value={priceRange.min}
      onChange={(e) =>
        setPriceRange({
          ...priceRange,
          min: e.target.value.replace(/\D/g, ""),
        })
      }
      className="flex-1 p-2.5 lg:p-3 bg-white border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      dir="ltr"
    />
    <span className="text-xs lg:text-sm text-gray-500 shrink-0">تا</span>
    <input
      type="text"
      inputMode="numeric"
      placeholder="حداکثر"
      value={priceRange.max}
      onChange={(e) =>
        setPriceRange({
          ...priceRange,
          max: e.target.value.replace(/\D/g, ""),
        })
      }
      className="flex-1 p-2.5 lg:p-3 bg-white border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      dir="ltr"
    />
  </div>
</div>

        <div>
          <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">
            مرتب‌سازی
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`p-2.5 lg:p-3 rounded-xl text-xs lg:text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                      : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* دسته‌بندی‌ها در Sidebar دسکتاپ */}
        <div className="lg:block hidden">
          <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">
            دسته‌بندی
          </label>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedCategory("")}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === ""
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              همه دسته‌ها
            </button>
            {categoriesLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.db_name)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      selectedCategory === cat.db_name
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      {/* ===== هدر جستجو ===== */}
  <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-20 lg:top-[64px]">
      <div className="px-4 lg:px-6 pt-3 lg:pt-4 pb-2 lg:pb-3 max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2 lg:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در آگهی‌ها..."
                className="w-full bg-gray-100 border-0 rounded-xl py-3 lg:py-3.5 pr-10 lg:pr-12 pl-10 lg:pl-12 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setSearch(""); }}
                  className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* دکمه فیلتر — فقط موبایل (در دسکتاپ Sidebar همیشه هست) */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative lg:hidden w-[46px] h-[46px] rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                showFilters || activeFiltersCount > 0
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {activeFiltersCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* دکمه جستجو — فقط دسکتاپ */}
            <button
              type="submit"
              className="hidden lg:inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg active:scale-95 transition-all shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              جستجو
            </button>
          </form>

          {/* چیپ‌های دسته‌بندی — فقط موبایل */}
          <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                selectedCategory === ""
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              همه
            </button>

            {categoriesLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-20 bg-gray-100 rounded-full animate-pulse shrink-0"
                  />
                ))}
              </>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.db_name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 flex items-center gap-1 ${
                    selectedCategory === cat.db_name
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* پنل فیلتر موبایل */}
        {showFilters && (
          <div className="lg:hidden border-t border-gray-100 bg-gray-50 px-4 py-4 animate-fade-in">
            <FiltersContent />
          </div>
        )}
      </div>

      {/* ===== محتوا: چیدمان ریسپانسیو ===== */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-3 lg:mt-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">

          {/* ===== Sidebar فیلتر دسکتاپ ===== */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <FiltersContent embedded />
            </div>
          </aside>

          {/* ===== ستون اصلی ===== */}
          <main>
            {!loading && (
              <div className="flex items-center justify-between mb-3 lg:mb-5">
                <p className="text-xs lg:text-sm text-gray-500">
                  <span className="font-bold text-gray-800 text-sm lg:text-base">
                    {posts.length}
                  </span>{" "}
                  آگهی یافت شد
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs lg:text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    پاک کردن فیلترها
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 lg:space-y-0">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 lg:space-y-0">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    price={post.price}
                    category={post.category}
                    location={post.location || "آنلاین"}
                    timeAgo={formatTimeAgo(post.created_at)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 lg:p-16 text-center shadow-sm mt-4">
                <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center text-4xl lg:text-5xl">
                  🔍
                </div>
                <p className="text-gray-700 font-semibold mb-1 lg:text-lg">نتیجه‌ای یافت نشد</p>
                <p className="text-sm lg:text-base text-gray-500 mb-5">
                  {search ? `هیچ آگهی‌ای برای «${search}» پیدا نشد` : "با کلمات کلیدی دیگری جستجو کنید"}
                </p>
                {activeFiltersCount > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg"
                  >
                    پاک کردن فیلترها
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/create-post")}
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg"
                  >
                    ثبت آگهی جدید
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function ExploreFallback() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-20 px-4 lg:px-6 pt-3 lg:pt-4 pb-2 lg:pb-3">
        <div className="max-w-7xl mx-auto">
          <div className="h-[46px] bg-gray-100 rounded-xl animate-pulse mb-3" />
          <div className="lg:hidden flex gap-2 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-20 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-3 lg:mt-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
          <div className="hidden lg:block">
            <div className="h-96 bg-white rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 lg:space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreContent />
    </Suspense>
  );
}