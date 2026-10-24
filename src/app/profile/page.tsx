'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { profileAPI, postsAPI } from '@/app/services/api';

interface UserPost {
  id: number;
  title: string;
  price: string;
  status: string;
  views: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalViews: 0,
  });

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    try {
      const data = await profileAPI.getMyPosts();
      setUserPosts(data.posts);
      
      // محاسبه آمار
      const active = data.posts.filter((p: UserPost) => p.status === 'active').length;
      const completed = data.posts.filter((p: UserPost) => p.status === 'completed').length;
      const totalViews = data.posts.reduce((sum: number, p: UserPost) => sum + p.views, 0);
      
      setStats({ active, completed, totalViews });
    } catch (error) {
      console.error('خطا در دریافت آگهی‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('آیا از حذف این آگهی مطمئن هستید؟')) return;
    
    try {
      await postsAPI.deletePost(id);
      setUserPosts(userPosts.filter(p => p.id !== id));
    } catch (error) {
      alert('خطا در حذف آگهی');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow-sm px-4 py-3">
          <h1 className="text-xl font-bold text-center">پروفایل</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-[70vh] px-4">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-bold mb-2">وارد حساب خود شوید</h2>
          <p className="text-gray-500 text-center mb-6">
            برای ثبت آگهی، ارسال پیام و مدیریت پروژه‌ها وارد شوید
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold w-full max-w-xs"
          >
            ورود / ثبت‌نام
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر پروفایل */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl text-gray-600">
            {user?.full_name?.charAt(0) || '👤'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.full_name || 'کاربر همیار'}</h2>
            <p className="text-sm opacity-90">{user?.phone}</p>
          
          </div>
          <button onClick={logout} className="text-white text-2xl">
            🚪
          </button>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white shadow-sm">
        <div className="text-center">
          <div className="font-bold text-xl">{stats.active}</div>
          <div className="text-xs text-gray-500">آگهی فعال</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-xl">{stats.completed}</div>
          <div className="text-xs text-gray-500">پروژه انجام شده</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-xl">{stats.totalViews}</div>
          <div className="text-xs text-gray-500">بازدید کل</div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b bg-white mt-2">
        {[
          { id: 'posts', label: 'آگهی‌های من' },
          { id: 'info', label: 'اطلاعات شخصی' },
          { id: 'saved', label: 'ذخیره شده‌ها' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-center ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوای تب‌ها */}
      <div className="p-4">
        {/* تب آگهی‌ها */}
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10">در حال بارگذاری...</div>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold flex-1">{post.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      post.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status === 'active' ? 'فعال' : 'تکمیل شده'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>💰 {post.price}</span>
                    <span>👁️ {post.views} بازدید</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/post/${post.id}`}
                      className="flex-1 text-center text-sm bg-blue-600 text-white py-1 rounded"
                    >
                      مشاهده
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex-1 text-sm border border-red-300 text-red-600 py-1 rounded"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>📝 شما هنوز آگهی ثبت نکرده‌اید</p>
                <Link
                  href="/create-post"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  ثبت آگهی جدید
                </Link>
              </div>
            )}
          </div>
        )}

        {/* تب اطلاعات شخصی */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">نام کامل</span>
              <span className="font-semibold">{user?.full_name || 'ثبت نشده'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">شماره موبایل</span>
              <span className="font-semibold">{user?.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">ایمیل</span>
              <span className="font-semibold">{user?.email || 'ثبت نشده'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">نقش</span>
            
            </div>
            <Link
              href="/profile/edit"
              className="block w-full mt-4 border border-blue-600 text-blue-600 text-center py-2 rounded-lg"
            >
              ویرایش پروفایل
            </Link>
          </div>
        )}

        {/* تب ذخیره شده‌ها */}
        {activeTab === 'saved' && (
          <div className="text-center text-gray-500 py-10">
            <p>❤️ آگهی‌های ذخیره شده شما</p>
            <Link
              href="/saved"
              className="inline-block mt-4 text-blue-600"
            >
              مشاهده ذخیره شده‌ها
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}