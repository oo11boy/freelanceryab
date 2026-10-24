"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PostCard from "@/app/components/PostCard";
import { postsAPI } from "@/app/services/api";
import { CATEGORIES } from "@/app/constants/categories";

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

/**
 * کامپوننت داخلی که از useSearchParams استفاده می‌کند.
 * باید حتماً داخل <Suspense> رندر شود تا build تولید شکست نخورد.
 */
function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(""); // dbName
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = { sort: SORT_MAP[sortBy] || "newest" };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory; // ✅ dbName
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
    loadPosts();
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "لحظاتی پیش";
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${Math.floor(hours / 24)} روز پیش`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در آگهی‌ها..."
              className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-3 text-gray-400">🔍</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 bg-gray-100 rounded-lg text-xl"
          >
            ⚙️
          </button>
        </form>

        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              selectedCategory === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            همه
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.dbName}
              onClick={() => setSelectedCategory(cat.dbName)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                selectedCategory === cat.dbName
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold mb-3">فیلترهای پیشرفته</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">محدوده قیمت (تومان)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="حداقل"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, min: e.target.value })
                    }
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <span>تا</span>
                  <input
                    type="number"
                    placeholder="حداکثر"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, max: e.target.value })
                    }
                    className="flex-1 p-2 border rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">مرتب‌سازی</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="price_asc">ارزان‌ترین</option>
                  <option value="price_desc">گران‌ترین</option>
                  <option value="most_viewed">پربازدیدترین</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setPriceRange({ min: "", max: "" });
                  setSelectedCategory("");
                  setSortBy("newest");
                }}
                className="w-full text-blue-600 text-sm py-2"
              >
                حذف همه فیلترها
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-3">
        <p className="text-sm text-gray-500 mb-3">
          {loading ? "در حال جستجو..." : `${posts.length} آگهی یافت شد`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-4 flex gap-3 animate-pulse"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-md" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              price={post.price}
              category={post.category}
              location={post.location || "آنلاین"}
              timeAgo={formatTimeAgo(post.created_at)}
            />
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-semibold mb-2">نتیجه‌ای یافت نشد</p>
            <p className="text-sm">سعی کنید با کلمات دیگری جستجو کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Fallback هنگام بارگذاری (Suspense boundary).
 * می‌توانید اسکلتون دلخواه بگذارید.
 */
function ExploreFallback() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-3" />
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-200 rounded-full animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
      <div className="px-4 mt-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-4 flex gap-3 animate-pulse"
          >
            <div className="w-20 h-20 bg-gray-200 rounded-md" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * کامپوننت پوسته — این همان چیزی است که Next.js به عنوان page می‌شناسد.
 * نکته کلیدی: useSearchParams فقط داخل <Suspense> استفاده می‌شود.
 */
export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <ExploreContent />
    </Suspense>
  );
}