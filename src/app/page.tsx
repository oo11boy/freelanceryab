"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "./components/PostCard";
import { postsAPI } from "./services/api";
import { CATEGORIES } from "./constants/categories";
import Header from "./components/Header";
import TopFreelancers from "./components/TopFreelancers";

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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "لحظاتی پیش";
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} روز پیش`;
    return `${Math.floor(days / 30)} ماه پیش`;
  };

  return (
    <div className="pb-2 min-h-screen bg-gray-50">
      {/* هدر */}
      <Header />

      {/* هیرو کارت */}
      <div className="px-4 pt-4">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-5 text-white overflow-hidden shadow-xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs mb-3">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>پلتفرم فعال</span>
            </div>
            <h2 className="text-xl font-bold mb-1.5 leading-tight">
              پروژه بعدی‌ات را پیدا کن! 🎯
            </h2>
            <p className="text-xs opacity-90 leading-relaxed mb-4">
              هزاران فرصت شغلی آنلاین در انتظار توست
            </p>

            <div className="flex gap-2">
              <Link
                href="/explore"
                className="flex-1 bg-white text-indigo-700 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                جستجوی پروژه
              </Link>
              <Link
                href="/create-post"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-white/30 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                ثبت آگهی
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* بهترین فریلنسرها */}
      <TopFreelancers />

      {/* دسته‌بندی‌ها */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span>🗂️</span> دسته‌بندی‌ها
          </h2>
          <Link
            href="/explore"
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            همه
          </Link>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-2.5 px-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 min-w-[76px] hover:shadow-md hover:border-blue-200 active:scale-95 transition-all shrink-0"
              >
                <span className="text-2xl mb-1.5">{cat.icon}</span>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* بنر CTA ثبت آگهی */}
      <div className="px-4 mt-5">
        <Link
          href="/create-post"
          className="group block bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.99] transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 -translate-x-12" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm mb-0.5">
                آگهی رایگان ثبت کن
              </div>
              <div className="text-[11px] text-white/85">
                در چند ثانیه پروژه‌ات را منتشر کن
              </div>
            </div>
            <svg
              className="w-5 h-5 text-white shrink-0 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* لیست آگهی‌ها */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span>🔥</span> آخرین آگهی‌ها
          </h2>
          <Link
            href="/explore"
            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-0.5"
          >
            مشاهده همه
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                      <div className="h-5 bg-gray-100 rounded-full w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
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
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
              📭
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              هنوز آگهی‌ای ثبت نشده
            </p>
            <p className="text-sm text-gray-500 mb-5">
              اولین نفری باش که پروژه ثبت می‌کنی!
            </p>
            <Link
              href="/create-post"
              className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
            >
              ثبت آگهی جدید
            </Link>
          </div>
        )}

        {/* دکمه مشاهده همه در پایین */}
        {posts.length > 0 && (
          <Link
            href="/explore"
            className="mt-4 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-all active:scale-[0.98]"
          >
            مشاهده همه آگهی‌ها
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}
      </div>

      {/* 🔑 استایل معمولی (بدون jsx) برای hide-scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}