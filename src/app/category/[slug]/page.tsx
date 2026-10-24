"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import PostCard from "@/app/components/PostCard";
import { FilterModal, FilterValues } from "@/app/components/FilterModal";
import { postsAPI } from "@/app/services/api";
import { getCategoryBySlug } from "@/app/constants/categories";

interface Post {
  id: number;
  title: string;
  price: string;
  category: string;
  sub_category?: string;
  location: string;
  created_at: string;
}

const SORT_MAP: Record<string, string> = {
  newest: "newest",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  "most-viewed": "most_viewed",
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const category = useMemo(() => getCategoryBySlug(slug), [slug]);

  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await postsAPI.getPosts({
          category: category.dbName,          // ✅ مقدار دیتابیس
          sort: SORT_MAP[sortBy] || "newest",
          page: 1,
          limit: 50,
        });
        if (!cancelled) setPosts(data.posts || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "خطا در بارگذاری آگهی‌ها");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, sortBy, category]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">❌</p>
          <p className="text-gray-600">دسته‌بندی یافت نشد</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "لحظاتی پیش";
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${Math.floor(hours / 24)} روز پیش`;
  };

  const handleApplyFilter = (values: FilterValues) => {
    // چون API هنوز فیلتر پیشرفته ندارد، فقط لاگ می‌کنیم
    // در فاز بعدی می‌توانید به API پاس بدهید
    console.log("Filter values:", values);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 text-2xl">←</button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <h1 className="text-lg font-bold">{category.name}</h1>
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="bg-gray-100 px-4 py-2 rounded-lg text-sm"
          >
            🔍 فیلتر
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
          {[
            { id: "newest", label: "جدیدترین" },
            { id: "price-asc", label: "ارزان‌ترین" },
            { id: "price-desc", label: "گران‌ترین" },
            { id: "most-viewed", label: "پربازدیدترین" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                sortBy === option.id
                  ? `bg-${category.color}-600 text-white`
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-gray-500">
          {loading ? "در حال بارگذاری..." : `${posts.length} آگهی در ${category.name}`}
        </p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 flex gap-3 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-md" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold">هنوز آگهی‌ای در این دسته ثبت نشده</p>
            <button
              onClick={() => router.push("/create")}
              className="mt-4 text-blue-600 text-sm"
            >
              + ثبت اولین آگهی
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              price={post.price}
              category={post.category}          // PostCard خودش تبدیل می‌کند
              location={post.location || "آنلاین"}
              timeAgo={formatTimeAgo(post.created_at)}
            />
          ))
        )}
      </div>

      <FilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        categorySlug={category.slug}
        onApply={handleApplyFilter}
      />
    </div>
  );
}