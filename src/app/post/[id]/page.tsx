'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsAPI, savedAPI, messagesAPI } from '@/app/services/api';
import { useAuth } from '@/app/hooks/useAuth';

interface Post {
  id: number;
  title: string;
  price: string;
  price_type: string;
  category: string;
  sub_category: string;
  location: string;
  description: string;
  skills: string[];
  images: string[];
  views: number;
  created_at: string;
  user_id: number;
  user_name: string;
  user_rating: number;
  user_avatar: string;
  status: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadPost();
    checkIfSaved();
  }, [params.id]);

  const loadPost = async () => {
    try {
      const data = await postsAPI.getPost(Number(params.id));
      setPost(data.post);
    } catch (error) {
      console.error('خطا در دریافت آگهی:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!token) return;
    try {
      const data = await savedAPI.getSaved();
      setIsSaved(data.posts.some((p: any) => p.id === Number(params.id)));
    } catch (error) {
      console.error('خطا در بررسی ذخیره شده:', error);
    }
  };

  const handleSave = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      if (isSaved) {
        await savedAPI.removeSaved(Number(params.id));
        setIsSaved(false);
      } else {
        await savedAPI.addSaved(Number(params.id));
        setIsSaved(true);
      }
    } catch (error) {
      console.error('خطا:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (!message.trim()) {
      alert('لطفاً پیام خود را بنویسید');
      return;
    }
    
    setSending(true);
    try {
      await messagesAPI.sendMessage(post!.user_id, message, post!.id);
      setShowContactModal(false);
      setMessage('');
      alert('پیام شما با موفقیت ارسال شد');
      router.push('/messages');
    } catch (error) {
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">❌</p>
          <p className="text-gray-600">آگهی مورد نظر یافت نشد</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-2xl">
          ←
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">جزئیات آگهی</h1>
        <button onClick={handleSave} className="text-2xl">
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* تصاویر */}
      {post.images && post.images.length > 0 && (
        <div className="bg-white border-b overflow-x-auto flex gap-2 p-4 hide-scrollbar">
          {post.images.map((img, idx) => (
            <div key={idx} className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
              <span className="text-3xl">🖼️</span>
            </div>
          ))}
        </div>
      )}

      {/* محتوای اصلی */}
      <div className="p-4 space-y-4">
        {/* عنوان و قیمت */}
        <div className="bg-white rounded-lg p-4">
          <h1 className="text-xl font-bold mb-2">{post.title}</h1>
          <div className="flex justify-between items-center">
            <span className="text-2xl text-green-700 font-bold">
              {post.price_type === 'contact' ? 'توافقی' : `${post.price} تومان`}
            </span>
            <span className="text-sm text-gray-500">
              {post.price_type === 'fixed' && 'مبلغ ثابت'}
              {post.price_type === 'hourly' && 'ساعتی'}
           
            </span>
          </div>
        </div>

        {/* اطلاعات سریع */}
        <div className="bg-white rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span>📂</span>
            <div>
              <div className="text-gray-500 text-xs">دسته‌بندی</div>
              <div className="font-semibold">{post.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>🔖</span>
            <div>
              <div className="text-gray-500 text-xs">زیردسته</div>
              <div className="font-semibold">{post.sub_category || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <div>
              <div className="text-gray-500 text-xs">موقعیت</div>
              <div className="font-semibold">{post.location || 'آنلاین'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>👁️</span>
            <div>
              <div className="text-gray-500 text-xs">بازدید</div>
              <div className="font-semibold">{post.views}</div>
            </div>
          </div>
        </div>

        {/* توضیحات */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold mb-3 text-lg">توضیحات</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* مهارت‌ها */}
        {post.skills && post.skills.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h2 className="font-bold mb-3">مهارت‌های مورد نیاز</h2>
            <div className="flex flex-wrap gap-2">
              {post.skills.map((skill, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* اطلاعات آگهی‌دهنده */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold mb-3">اطلاعات آگهی‌دهنده</h2>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-3xl text-white">
              {post.user_name?.charAt(0) || '👤'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg">{post.user_name || 'کاربر همیار'}</div>
              <div className="flex gap-3 text-sm text-gray-500 mt-1">
                <span>⭐ {post.user_rating || 0}</span>
                <span>✅ عضو همیار</span>
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های اقدام */}
        {user?.id !== post.user_id && (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg"
            >
              📩 ارتباط با آگهی‌دهنده
            </button>
          </div>
        )}
      </div>

      {/* مودال ارسال پیام */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[99]">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <h3 className="text-xl font-bold mb-4">ارسال پیام به {post.user_name}</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              rows={4}
              className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-400"
              >
                {sending ? 'در حال ارسال...' : 'ارسال پیام'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}