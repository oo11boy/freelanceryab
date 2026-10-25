'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { profileAPI, postsAPI, savedAPI } from '@/app/services/api';
import PostCard from '@/app/components/PostCard';

interface UserPost {
  id: number;
  title: string;
  price: string;
  status: string;
  views: number;
  created_at: string;
}

interface SavedPost {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalViews: 0,
  });

  // بارگذاری آگهی‌های کاربر هر بار mount شد
  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  // بارگذاری ذخیره‌ها هر بار تب saved فعال شد (همیشه تازه)
  useEffect(() => {
    if (activeTab === 'saved' && token) {
      loadSavedPosts();
    }
  }, [activeTab, token]);

  const loadUserPosts = async () => {
    try {
      const data = await profileAPI.getMyPosts();
      setUserPosts(data.posts);

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

  const loadSavedPosts = async () => {
    setSavedLoading(true);
    try {
      const data = await savedAPI.getSaved();
      setSavedPosts(data.posts);
    } catch (error) {
      console.error('خطا در دریافت ذخیره‌ها:', error);
    } finally {
      setSavedLoading(false);
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

  const handleRemoveSaved = async (postId: number) => {
    try {
      await savedAPI.removeSaved(postId);
      setSavedPosts(savedPosts.filter(p => p.id !== postId));
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

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-24 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg">
            👤
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            وارد حساب خود شوید
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            برای ثبت آگهی، ارسال پیام و مدیریت پروژه‌ها وارد شوید
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
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
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

        <div className="relative px-5 pt-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold">پروفایل من</h1>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="خروج"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl text-gray-700 shadow-xl font-bold">
                {user?.full_name?.charAt(0) || '👤'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {user?.full_name || 'کاربر همیار'}
              </h2>
              <p className="text-sm opacity-80 mt-1" dir="ltr">
                {user?.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* آمار - کارت شناور */}
      <div className="-mt-12 px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-xs text-gray-500 mt-1">آگهی فعال</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500 mt-1">پروژه انجام شده</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
            <div className="text-xs text-gray-500 mt-1">بازدید کل</div>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="mt-6 mx-4 bg-white rounded-xl p-1.5 shadow-sm flex">
        {[
          { id: 'posts', label: 'آگهی‌ها', icon: '📝' },
          { id: 'info', label: 'اطلاعات', icon: '👤' },
          { id: 'saved', label: 'ذخیره‌ها', icon: '❤️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* محتوای تب‌ها */}
      <div className="p-4">
        {/* تب آگهی‌ها */}
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-9 bg-gray-100 rounded-lg flex-1" />
                      <div className="h-9 bg-gray-100 rounded-lg flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="font-semibold text-gray-800 flex-1 leading-relaxed">
                      {post.title}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      post.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {post.status === 'active' ? '● فعال' : '✓ تکمیل شده'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      💰 <span className="font-medium text-gray-700">{post.price}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.views}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/post/${post.id}`}
                      className="flex-1 text-center text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                      مشاهده
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex-1 text-sm border border-red-200 text-red-600 py-2.5 rounded-xl font-medium hover:bg-red-50 transition-colors active:scale-[0.98]"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
                  📝
                </div>
                <p className="text-gray-700 font-semibold mb-1">هنوز آگهی ندارید</p>
                <p className="text-sm text-gray-500 mb-6">اولین آگهی خود را ثبت کنید</p>
                <Link
                  href="/create-post"
                  className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  ثبت آگهی جدید
                </Link>
              </div>
            )}
          </div>
        )}

        {/* تب اطلاعات شخصی */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {[
                { label: 'نام کامل', value: user?.full_name || 'ثبت نشده', icon: '👤' },
                { label: 'شماره موبایل', value: user?.phone, icon: '📱', ltr: true },
                { label: 'ایمیل', value: user?.email || 'ثبت نشده', icon: '✉️', ltr: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                    <div
                      className="font-semibold text-gray-800 text-sm truncate"
                      dir={item.ltr ? 'ltr' : 'rtl'}
                      style={item.ltr ? { textAlign: 'right' } : undefined}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 pt-0">
              <Link
                href="/profile/edit"
                className="block w-full border-2 border-blue-600 text-blue-600 text-center py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors active:scale-[0.98]"
              >
                ویرایش پروفایل
              </Link>
            </div>
          </div>
        )}

        {/* تب ذخیره شده‌ها */}
        {activeTab === 'saved' && (
          <div>
            {savedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : savedPosts.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-3 px-1">
                  {savedPosts.length} آگهی ذخیره شده
                </p>
                <div className="space-y-3">
                  {savedPosts.map(post => (
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
                        onClick={() => handleRemoveSaved(post.id)}
                        className="absolute top-2 right-2 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md text-red-500 hover:scale-110 active:scale-95 transition-transform z-10"
                        aria-label="حذف از ذخیره‌ها"
                      >
                        ❤️
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-50 to-red-100 flex items-center justify-center text-4xl">
                  ❤️
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  هیچ آگهی ذخیره‌ای ندارید
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  آگهی‌های مورد علاقه خود را ذخیره کنید تا بعداً ببینید
                </p>
                <button
                  onClick={() => router.push('/explore')}
                  className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  جستجوی آگهی
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}