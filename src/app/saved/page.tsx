'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { savedAPI } from '@/app/services/api';
import PostCard from '@/app/components/PostCard';

interface SavedPost {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  created_at: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadSavedPosts();
  }, [token]);

  const loadSavedPosts = async () => {
    try {
      const data = await savedAPI.getSaved();
      setPosts(data.posts);
    } catch (error) {
      console.error('خطا:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (postId: number) => {
    try {
      await savedAPI.removeSaved(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      alert('خطا در حذف از علاقه‌مندی‌ها');
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'لحظاتی پیش';
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${Math.floor(hours / 24)} روز پیش`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-2xl">
          ←
        </button>
        <h1 className="text-xl font-bold flex-1 text-center">ذخیره شده‌ها</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-10">در حال بارگذاری...</div>
        ) : posts.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-3">{posts.length} آگهی ذخیره شده</p>
            {posts.map(post => (
              <div key={post.id} className="relative">
                <PostCard
                  id={post.id}
                  title={post.title}
                  price={post.price}
                  category={post.category}
                  location={post.location || 'آنلاین'}
                  timeAgo={formatTimeAgo(post.created_at)}
                />
                <button
                  onClick={() => handleRemove(post.id)}
                  className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md text-red-500"
                >
                  ❤️
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center text-gray-500 py-20">
            <div className="text-6xl mb-4">❤️</div>
            <p className="text-lg font-semibold mb-2">هیچ آگهی ذخیره‌ای ندارید</p>
            <p className="text-sm">آگهی‌های مورد علاقه خود را ذخیره کنید تا بعداً ببینید</p>
            <button
              onClick={() => router.push('/explore')}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              جستجوی آگهی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}