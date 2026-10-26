'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/app/components/PostCard';
import { postsAPI } from '@/app/services/api';
import { useCategories } from '@/app/hooks/useCategories';

interface Post {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  created_at: string;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [subCategory, setSubCategory] = useState('');

  const slug = params.slug as string;
  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    if (categoriesLoading) return;
    if (!category) {
      router.push('/explore');
      return;
    }
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesLoading, category?.db_name, subCategory]);

  const loadPosts = async () => {
    if (!category) return;
    setLoading(true);
    try {
      const data = await postsAPI.getPosts({
        category: category.db_name,
        search: subCategory || undefined,
      });
      setPosts(data.posts || []);
    } catch (error) {
      console.error('خطا:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'لحظاتی پیش';
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} روز پیش`;
    return `${Math.floor(days / 30)} ماه پیش`;
  };

  if (categoriesLoading || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <h1 className="text-base font-bold text-gray-800 truncate">{category.name}</h1>
            </div>
            {category.description && (
              <p className="text-[11px] text-gray-500 truncate">{category.description}</p>
            )}
          </div>
        </div>

        {/* زیردسته‌ها */}
        {category.sub.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setSubCategory('')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                  subCategory === ''
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                همه
              </button>
              {category.sub.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(sub === subCategory ? '' : sub)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                    subCategory === sub
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* لیست آگهی‌ها */}
      <div className="p-4">
        {!loading && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-bold text-gray-800">{posts.length}</span> آگهی یافت شد
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
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
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                price={post.price}
                category={post.category}
                location={post.location || 'آنلاین'}
                timeAgo={formatTimeAgo(post.created_at)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mt-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center text-4xl">
              📭
            </div>
            <p className="text-gray-700 font-semibold mb-1">آگهی‌ای در این دسته وجود ندارد</p>
            <p className="text-sm text-gray-500 mb-5">
              {subCategory ? `در «${subCategory}» آگهی‌ای یافت نشد` : 'اولین آگهی را ثبت کنید!'}
            </p>
            <Link
              href="/create-post"
              className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg"
            >
              ثبت آگهی جدید
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}