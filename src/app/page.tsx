"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "./components/PostCard";
import { postsAPI } from "./services/api";
import { CATEGORIES } from "./constants/categories";

interface Post {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  created_at: string;
  views: number;
  user_name: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postsAPI.getPosts({ page: 1 });
      setPosts(data.posts);
    } catch (error) {
      console.error("خطا در بارگذاری آگهی‌ها:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "لحظاتی پیش";
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${Math.floor(hours / 24)} روز پیش`;
  };

  return (
    <div className="pb-2">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">فریلنسرکار</h1>
        <p className="text-xs text-gray-500">بازار کارهای آنلاین</p>
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="px-4 py-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`flex flex-col items-center p-3 rounded-xl bg-${cat.color}-50 min-w-[70px] hover:shadow-md transition`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* لیست آگهی‌ها */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">آخرین آگهی‌ها</h2>
          <Link href="/explore" className="text-sm text-blue-600">
            مشاهده همه
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-4 flex gap-3 animate-pulse"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>هیچ آگهی یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
