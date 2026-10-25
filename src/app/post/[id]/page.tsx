// app/post/[id]/page.tsx
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
  deadline: string | null;
  user_id: number;
  status: string;
}

interface PostOwner {
  id: number;
  full_name: string;
  avatar: string | null;
  rating: number;
  completed_projects: number;
  joined_at: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [owner, setOwner] = useState<PostOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    loadPost();
    checkIfSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadPost = async () => {
    try {
      const data = await postsAPI.getPost(Number(params.id));
      setPost(data.post);
      setOwner(data.owner || null);
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
    if (savedLoading) return;
    setSavedLoading(true);
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
    } finally {
      setSavedLoading(false);
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
      router.push('/messages');
    } catch (error) {
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const formatRelativeDate = (date: string) => {
    try {
      const diff = Date.now() - new Date(date).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'لحظاتی پیش';
      if (hours < 24) return `${hours} ساعت پیش`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} روز پیش`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} ماه پیش`;
      return `${Math.floor(months / 12)} سال پیش`;
    } catch {
      return '';
    }
  };

  const formatDeadline = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getDeadlineStatus = (date: string) => {
    try {
      const days = Math.ceil(
        (new Date(date).getTime() - Date.now()) / 86400000
      );
      if (days > 0) {
        return {
          label: `${days} روز باقی‌مانده`,
          color: 'text-green-600',
        };
      }
      if (days === 0) {
        return { label: 'امروز آخرین مهلت است', color: 'text-amber-600' };
      }
      return { label: 'مهلت به پایان رسیده', color: 'text-red-500' };
    } catch {
      return { label: '', color: 'text-gray-500' };
    }
  };

  const experienceLabel: Record<string, string> = {
    beginner: 'تازه‌کار',
    intermediate: 'متوسط',
    advanced: 'پیشرفته',
    expert: 'حرفه‌ای',
  };

  const memberSince = (date: string | null) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  // -------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20 px-3 py-3 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-4xl">
            ❌
          </div>
          <p className="text-lg font-bold text-gray-800 mb-2">آگهی یافت نشد</p>
          <p className="text-sm text-gray-500 mb-6">
            ممکن است حذف شده یا در دسترس نباشد
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;
  const priceLabel =
    post.price_type === 'contact' ? 'توافقی' : `${post.price} تومان`;
  const priceTypeLabel =
    post.price_type === 'fixed'
      ? 'مبلغ ثابت'
      : post.price_type === 'hourly'
      ? 'ساعتی'
      : '';
  const deadlineStatus = post.deadline
    ? getDeadlineStatus(post.deadline)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* هدر */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center">
            جزئیات آگهی
          </h1>
          <button
            onClick={handleSave}
            disabled={savedLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isSaved ? 'bg-red-50' : 'hover:bg-gray-100'
            }`}
            aria-label={isSaved ? 'حذف از ذخیره‌ها' : 'ذخیره آگهی'}
          >
            <svg
              className={`w-6 h-6 transition-all ${
                isSaved
                  ? 'text-red-500 fill-red-500 scale-110'
                  : 'text-gray-700'
              }`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* تصاویر */}
      {post.images && post.images.length > 0 && (
        <div className="bg-white border-b border-gray-100">
          <div className="flex gap-2 p-4 overflow-x-auto hide-scrollbar">
            {post.images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`تصویر ${idx + 1}`}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-3xl">🖼️</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* کارت اصلی: عنوان + قیمت */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-lg font-bold text-gray-800 leading-relaxed flex-1">
              {post.title}
            </h1>
            {post.status === 'active' && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700 shrink-0">
                ● فعال
              </span>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">قیمت</div>
              <div
                className="text-2xl font-bold text-green-700"
                dir="ltr"
              >
                {priceLabel}
              </div>
            </div>
            {priceTypeLabel && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {priceTypeLabel}
              </span>
            )}
          </div>

          {/* زمان و بازدید */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatRelativeDate(post.created_at)}
            </span>
            <span className="flex items-center gap-1">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {post.views} بازدید
            </span>
          </div>
        </div>

        {/* اطلاعات سریع */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📂', label: 'دسته‌بندی', value: post.category },
              {
                icon: '🔖',
                label: 'زیردسته',
                value: post.sub_category || '—',
              },
              {
                icon: '📍',
                label: 'موقعیت',
                value: post.location || 'آنلاین',
              },
              {
                icon: '👁️',
                label: 'بازدید',
                value: String(post.views),
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <div className="font-semibold text-gray-800 text-sm truncate">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* مهلت انجام */}
        {post.deadline && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-2xl shrink-0">
                ⏳
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">مهلت انجام</div>
                <div className="font-bold text-gray-800 text-sm">
                  {formatDeadline(post.deadline)}
                </div>
                {deadlineStatus && (
                  <div
                    className={`text-xs mt-0.5 font-medium ${deadlineStatus.color}`}
                  >
                    {deadlineStatus.label}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* توضیحات */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <span>📝</span> توضیحات
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
            {post.description}
          </p>
        </div>

        {/* مهارت‌ها */}
        {post.skills && post.skills.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
              <span>🎯</span> مهارت‌های مورد نیاز
            </h2>
            <div className="flex flex-wrap gap-2">
              {post.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* اطلاعات آگهی‌دهنده */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span>👤</span> آگهی‌دهنده
          </h2>

          <div className="flex items-center gap-3 mb-3">
            <div className="relative shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white font-bold shadow-md">
                {owner?.full_name?.charAt(0) || '👤'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800 text-base truncate">
                {owner?.full_name || 'کاربر همیار'}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>⭐</span>
                  {owner?.rating || 0}
                </span>
                {owner && owner.completed_projects > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                    <span>✓</span> {owner.completed_projects} پروژه موفق
                  </span>
                )}
                {owner?.joined_at && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                    عضو از {memberSince(owner.joined_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* سطح تجربه */}
          {owner?.experience && (
            <div className="bg-purple-50 rounded-xl p-2.5 mb-3 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="text-xs text-purple-700 font-medium">
                سطح تجربه: {experienceLabel[owner.experience] || owner.experience}
              </span>
            </div>
          )}

          {/* بیو */}
          {owner?.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
              {owner.bio}
            </p>
          )}

          {/* مهارت‌های کاربر */}
          {owner?.skills && owner.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {owner.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {owner.skills.length > 4 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                  +{owner.skills.length - 4}
                </span>
              )}
            </div>
          )}

          <Link
            href={`/user/${owner?.id || post.user_id}`}
            className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors active:scale-[0.98]"
          >
            مشاهده پروفایل کامل
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
        </div>

        {/* ⚠️ هشدار کلاهبرداری */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
              🛡️
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1">
                هشدار امنیتی
              </h3>
              <ul className="space-y-1.5 text-xs text-amber-800 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>
                    هرگز قبل از انجام و تحویل کار، مبلغی پرداخت نکنید.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>
                    برای ارتباط و پرداخت، فقط از طریق همین پلتفرم اقدام کنید.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>
                    به درخواست‌های واریز به حساب‌های شخصی یا لینک‌های خارجی
                    اعتماد نکنید.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>
                    در صورت مشاهده هرگونه تخلف، از طریق پشتیبانی گزارش دهید.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* لینک قوانین */}
        <div className="text-center">
          <Link
            href="/rules"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <span>📜</span>
            مشاهده قوانین و مقررات کامل
          </Link>
        </div>
      </div>

      {/* دکمه اقدام ثابت */}
      {!isOwner && (
        <div className="fixed bottom-18 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 max-w-md mx-auto shadow-lg z-30 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={savedLoading}
              className={`w-14 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                isSaved
                  ? 'bg-red-50 border-2 border-red-200'
                  : 'bg-gray-100 border-2 border-gray-200'
              }`}
              aria-label={isSaved ? 'حذف از ذخیره‌ها' : 'ذخیره آگهی'}
            >
              <svg
                className={`w-6 h-6 ${
                  isSaved ? 'text-red-500' : 'text-gray-600'
                }`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white h-12 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              ارتباط با آگهی‌دهنده
            </button>
          </div>
        </div>
      )}

      {/* مودال ارسال پیام */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => !sending && setShowContactModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg text-white font-bold">
                  {owner?.full_name?.charAt(0) || post.user_id}
                </div>
                <div>
                  <div className="text-xs text-gray-500">ارسال پیام به</div>
                  <div className="font-bold text-gray-800 text-sm">
                    {owner?.full_name || 'کاربر همیار'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => !sending && setShowContactModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="بستن"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* اطلاعات آگهی */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-blue-600 mb-0.5">
                در پاسخ به آگهی
              </div>
              <div className="text-sm font-semibold text-blue-900 line-clamp-1">
                {post.title}
              </div>
            </div>

            {/* ورودی */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید... (مثلاً: سلام، برای این پروژه علاقه‌مندم. نمونه کارهای من...)"
              rows={5}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none text-sm"
              disabled={sending}
              maxLength={1000}
            />
            <div className="flex justify-end mb-4">
              <span className="text-xs text-gray-400">
                {message.length}/1000
              </span>
            </div>

            {/* دکمه‌ها */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowContactModal(false)}
                disabled={sending}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 rotate-180"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    ارسال پیام
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0.5;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
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