"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "./components/PostCard";
import { postsAPI } from "./services/api";
import Header from "./components/Header";
import TopFreelancers from "./components/TopFreelancers";
import { useCategories } from "@/app/hooks/useCategories";

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
  const { categories, loading: categoriesLoading } = useCategories();

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
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} روز پیش`;
    return `${Math.floor(days / 30)} ماه پیش`;
  };

  return (
    <div className="pb-8 min-h-screen bg-gray-50">
       <div className="lg:hidden">
    <Header />
  </div>

      {/* ==== کانتینر اصلی ==== */}
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">

        {/* ==== هیرو ==== */}
        <div className="pt-4 lg:pt-8">
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20 
                          lg:rounded-[2rem] lg:p-10 p-5">
            <div className="absolute top-0 right-0 w-40 h-40 lg:w-72 lg:h-72 bg-white/10 rounded-full -translate-y-20 translate-x-20 lg:-translate-y-32 lg:translate-x-32" />
            <div className="absolute bottom-0 left-0 w-32 h-32 lg:w-56 lg:h-56 bg-white/10 rounded-full translate-y-16 -translate-x-16 lg:translate-y-24 lg:-translate-x-24" />

            <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-10">
              {/* متن هیرو */}
              <div className="lg:flex-1 lg:max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs mb-3 lg:mb-4 lg:text-sm lg:px-4">
                  <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>پلتفرم فعال</span>
                </div>
                <h2 className="text-xl lg:text-4xl font-bold mb-1.5 lg:mb-3 leading-tight lg:leading-tight text-white">
                  پروژه بعدی‌ات را پیدا کن! 🎯
                </h2>
                <p className="text-xs text-white lg:text-base opacity-90 leading-relaxed mb-4 lg:mb-6 lg:max-w-lg">
                  هزاران فرصت شغلی آنلاین در انتظار توست.
                </p>

                {/* دکمه‌ها */}
                <div className="flex gap-2 lg:gap-3 lg:max-w-md">
                  <Link
                    href="/explore"
                    className="flex-1 bg-white text-indigo-700 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1 lg:gap-2"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    جستجوی پروژه
                  </Link>
                  <Link
                    href="/create-post"
                    className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold hover:bg-white/30 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1 lg:gap-2"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    ثبت آگهی
                  </Link>
                </div>
              </div>

              {/* دکوراسیون دسکتاپ */}
              <div className="hidden lg:flex flex-1 justify-center items-center">
                <div className="relative">
                  <div className="w-52 h-52 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[6rem] shadow-2xl rotate-6">
                    💼
                  </div>
                  <div className="absolute -bottom-4 -right-6 w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl -rotate-12">
                    🚀
                  </div>
                  <div className="absolute -top-4 -left-6 w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl rotate-12">
                    ⭐
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==== بهترین فریلنسرها ==== */}
        <TopFreelancers />

        {/* ==== دسته‌بندی‌ها ==== */}
        <div className="mt-5 lg:mt-10">
          <div className="flex items-center justify-between px-1 lg:px-0 mb-3 lg:mb-5">
            <h2 className="text-sm lg:text-lg font-bold text-gray-800 flex items-center gap-1.5">
              <span>🗂️</span> دسته‌بندی‌ها
            </h2>
            <Link href="/explore" className="text-xs lg:text-sm text-blue-600 font-medium hover:underline">
              مشاهده همه
            </Link>
          </div>

          {/* موبایل: اسکرول افقی */}
          <div className="lg:hidden overflow-x-auto hide-scrollbar">
            <div className="flex gap-2.5 px-1">
              {categoriesLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 min-w-[76px] shrink-0 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mb-1.5" />
                      <div className="h-3 w-12 bg-gray-200 rounded" />
                    </div>
                  ))}
                </>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex flex-col items-center p-3 rounded-2xl bg-white border border-gray-100 min-w-[76px] hover:shadow-md hover:border-blue-200 active:scale-95 transition-all shrink-0"
                  >
                    <span className="text-2xl mb-1.5">{cat.icon}</span>
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* دسکتاپ: گرید */}
          <div className="hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-3">
            {categoriesLoading
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white border border-gray-100 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-2" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                ))
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex flex-col items-center p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-3xl mb-2">{cat.icon}</span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                  </Link>
                ))}
          </div>
        </div>

        {/* ==== CTA ثبت آگهی ==== */}
        <div className="mt-5 lg:mt-10">
          <Link
            href="/create-post"
            className="group block bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.99] transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-24 h-24 lg:w-40 lg:h-40 bg-white/10 rounded-full -translate-y-12 -translate-x-12 lg:-translate-y-20 lg:-translate-x-20" />
            <div className="relative flex items-center gap-3 lg:gap-5">
              <div className="w-11 h-11 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl lg:text-4xl shrink-0">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm lg:text-lg mb-0.5 lg:mb-1">آگهی رایگان ثبت کن</div>
                <div className="text-[11px] lg:text-sm text-white/85">در چند ثانیه پروژه‌ات را منتشر کن و هزاران فریلنسر ببینند</div>
              </div>
              <svg className="w-5 h-5 lg:w-7 lg:h-7 text-white shrink-0 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* ==== لیست آگهی‌ها ==== */}
        <div className="mt-5 lg:mt-10">
          <div className="flex justify-between items-center mb-3 lg:mb-5 px-1 lg:px-0">
            <h2 className="text-sm lg:text-lg font-bold text-gray-800 flex items-center gap-1.5">
              <span>🔥</span> آخرین آگهی‌ها
            </h2>
            <Link href="/explore" className="text-xs lg:text-sm text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              مشاهده همه
              <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 lg:space-y-0">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
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
            <div className="bg-white rounded-2xl p-10 lg:p-16 text-center shadow-sm">
              <div className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl lg:text-5xl">
                📭
              </div>
              <p className="text-gray-700 font-semibold mb-1 lg:text-lg">هنوز آگهی‌ای ثبت نشده</p>
              <p className="text-sm lg:text-base text-gray-500 mb-5 lg:mb-6">اولین نفری باش که پروژه ثبت می‌کنی!</p>
              <Link
                href="/create-post"
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                ثبت آگهی جدید
              </Link>
            </div>
          )}

          {posts.length > 0 && (
            <Link
              href="/explore"
              className="mt-4 lg:mt-8 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 lg:py-4 rounded-xl font-semibold text-sm lg:text-base hover:border-blue-300 hover:text-blue-600 transition-all active:scale-[0.98]"
            >
              مشاهده همه آگهی‌ها
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}