// app/post/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { postsAPI, savedAPI, messagesAPI } from "@/app/services/api";
import { useAuth } from "@/app/hooks/useAuth";
import {
  useCategories,
  categoryLabel,
  categoryIcon,
} from "@/app/hooks/useCategories";
import ReportModal from "@/app/components/ReportModal";

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
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { categories } = useCategories();
  const [post, setPost] = useState<Post | null>(null);
  const [owner, setOwner] = useState<PostOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [message, setMessage] = useState("");
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
      console.error("خطا در دریافت آگهی:", error);
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
      console.error("خطا در بررسی ذخیره شده:", error);
    }
  };

  const handleSave = async () => {
    if (!token) {
      router.push("/login");
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
      console.error("خطا:", error);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleReport = () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setShowReportModal(true);
  };

  const handleSendMessage = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!message.trim()) {
      alert("لطفاً پیام خود را بنویسید");
      return;
    }

    setSending(true);
    try {
      await messagesAPI.sendMessage(post!.user_id, message, post!.id);
      setShowContactModal(false);
      setMessage("");
      router.push(`/messages?user=${post!.user_id}&post=${post!.id}`);
    } catch (error) {
      alert("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const formatRelativeDate = (date: string) => {
    try {
      const diff = Date.now() - new Date(date).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return "لحظاتی پیش";
      if (hours < 24) return `${hours} ساعت پیش`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} روز پیش`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} ماه پیش`;
      return `${Math.floor(months / 12)} سال پیش`;
    } catch {
      return "";
    }
  };

  const formatDeadline = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("fa-IR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getDeadlineStatus = (date: string) => {
    try {
      const days = Math.ceil(
        (new Date(date).getTime() - Date.now()) / 86400000,
      );
      if (days > 0) {
        return {
          label: `${days} روز باقی‌مانده`,
          color: "text-green-600",
        };
      }
      if (days === 0) {
        return { label: "امروز آخرین مهلت است", color: "text-amber-600" };
      }
      return { label: "مهلت به پایان رسیده", color: "text-red-500" };
    } catch {
      return { label: "", color: "text-gray-500" };
    }
  };

  // ==================== لودینگ ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
        {/* نوار بالا موبایل */}
        <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20 px-3 py-3 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto p-4 lg:px-6 lg:mt-6">
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 lg:p-6 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
            <div className="hidden lg:block">
              <div className="h-96 bg-white rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== پیدا نشد ====================
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
  const ownerName = owner?.full_name || "کاربر فریلنسریاب";
  const priceLabel =
    post.price_type === "contact" ? "توافقی" : `${post.price} تومان`;
  const priceTypeLabel =
    post.price_type === "fixed"
      ? "مبلغ ثابت"
      : post.price_type === "hourly"
        ? "ساعتی"
        : "";
  const deadlineStatus = post.deadline
    ? getDeadlineStatus(post.deadline)
    : null;
  const displayCategory = categoryLabel(categories, post.category);
  const displayIcon = categoryIcon(categories, post.category);

  // 🔑 وضعیت آگهی (برای استفاده در Sidebar و Footer)
  const statusMessages: Record<string, { text: string; cls: string }> = {
    locked: {
      text: "🔒 این آگهی قفل شده و در حال انجامه — امکان ارسال درخواست جدید وجود ندارد",
      cls: "bg-purple-50 border-purple-200 text-purple-800",
    },
    in_progress: {
      text: "🔄 این پروژه در حال انجامه — امکان ارسال درخواست جدید وجود ندارد",
      cls: "bg-amber-50 border-amber-200 text-amber-800",
    },
    delivered: {
      text: "📦 این پروژه تحویل داده شده و منتظر تأیید کارفرماست",
      cls: "bg-orange-50 border-orange-200 text-orange-800",
    },
    completed: {
      text: "✅ این پروژه تکمیل شده",
      cls: "bg-blue-50 border-blue-200 text-blue-800",
    },
    removed: {
      text: "🗑 این آگهی حذف شده",
      cls: "bg-gray-50 border-gray-200 text-gray-600",
    },
  };
  const statusInfo =
    post.status !== "active" ? statusMessages[post.status] : null;

  // 🔑 دکمه‌های اقدام (برای موبایل footer و دسکتاپ sidebar)
  const ActionButtons = ({
    variant = "mobile",
  }: {
    variant?: "mobile" | "desktop";
  }) => (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        disabled={savedLoading}
        className={`${
          variant === "desktop" ? "w-14 h-12" : "w-14 h-12"
        } rounded-xl flex items-center justify-center transition-all active:scale-95 ${
          isSaved
            ? "bg-red-50 border-2 border-red-200"
            : "bg-gray-100 border-2 border-gray-200"
        }`}
        aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره آگهی"}
      >
        <svg
          className={`w-6 h-6 ${isSaved ? "text-red-500" : "text-gray-600"}`}
          fill={isSaved ? "currentColor" : "none"}
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
  );

  // 🔑 کارت قیمت (برای استفاده در صفحه اصلی + Sidebar)
  const PriceCard = () => (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3.5 lg:p-4 border border-emerald-100 flex items-center justify-between">
      <div>
        <div className="text-[10px] lg:text-xs text-emerald-700 mb-0.5">
          قیمت
        </div>
        <div
          className="text-xl lg:text-2xl font-bold text-emerald-700"
          dir="ltr"
        >
          {priceLabel}
        </div>
      </div>
      {priceTypeLabel && (
        <span className="text-[10px] lg:text-xs bg-white text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
          {priceTypeLabel}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-12">
      {/* ===== نوار بالا موبایل (در دسکتاپ Header سراسری هست) ===== */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 py-3 flex items-center gap-1">
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

          {!isOwner && (
            <button
              onClick={handleReport}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 active:scale-90 transition-all group"
              aria-label="گزارش تخلف"
              title="گزارش تخلف"
            >
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={savedLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isSaved ? "bg-red-50" : "hover:bg-gray-100"
            }`}
            aria-label={isSaved ? "حذف از ذخیره‌ها" : "ذخیره آگهی"}
          >
            <svg
              className={`w-6 h-6 transition-all ${
                isSaved
                  ? "text-red-500 fill-red-500 scale-110"
                  : "text-gray-700"
              }`}
              fill={isSaved ? "currentColor" : "none"}
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

      {/* ===== Breadcrumb دسکتاپ ===== */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 pt-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            خانه
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href="/explore"
            className="hover:text-blue-600 transition-colors"
          >
            جستجوی پروژه
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/explore?category=${encodeURIComponent(post.category)}`}
            className="hover:text-blue-600 transition-colors"
          >
            {displayCategory}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">
            {post.title}
          </span>
        </nav>
      </div>

      {/* ===== تصاویر ===== */}
      {post.images && post.images.length > 0 && (
        <div className="bg-white border-b border-gray-100 lg:border-0 lg:bg-transparent lg:max-w-7xl lg:mx-auto lg:px-6 lg:pt-6">
          {/* موبایل: اسکرول افقی */}
          <div className="lg:hidden flex gap-2 p-4 overflow-x-auto hide-scrollbar">
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
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-3xl">🖼️</span>
              </div>
            ))}
          </div>

          {/* دسکتاپ: گرید */}
          <div className="hidden lg:grid grid-cols-3 gap-3">
            {post.images.map((img, idx) => (
              <div
                key={idx}
                className={`relative ${
                  idx === 0 ? "col-span-2 row-span-2 h-[420px]" : "h-[204px]"
                } bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`تصویر ${idx + 1}`}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-5xl absolute inset-0 flex items-center justify-center">
                  🖼️
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== محتوا ===== */}
      <div className="max-w-7xl mx-auto lg:px-6 lg:mt-6">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
          {/* ===== ستون اصلی ===== */}
          <div className="p-4 lg:p-0 space-y-4 lg:space-y-5">
            {/* کارت اصلی */}
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <Link
                href={`/explore?category=${encodeURIComponent(post.category)}`}
                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-3 hover:bg-blue-100 transition-colors"
              >
                <span>{displayIcon}</span>
                {displayCategory}
                {post.sub_category && (
                  <>
                    <span className="text-blue-400">•</span>
                    <span>{post.sub_category}</span>
                  </>
                )}
              </Link>

              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-lg lg:text-2xl font-bold text-gray-800 leading-relaxed flex-1">
                  {post.title}
                </h1>
                {post.status === "active" && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700 shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    فعال
                  </span>
                )}
                {post.status === "locked" && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 shrink-0">
                    🔒 قفل شده
                  </span>
                )}
              </div>

              {/* قیمت — در دسکتاپ در Sidebar نمایش داده می‌شود، این نسخه فقط موبایل */}
              <div className="lg:hidden">
                <PriceCard />
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs lg:text-sm text-gray-500 flex-wrap">
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
                {post.location && (
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {post.location}
                  </span>
                )}
              </div>
            </div>

            {/* مهلت */}
            {post.deadline && (
              <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-2xl shrink-0">
                    ⏳
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      مهلت انجام
                    </div>
                    <div className="font-bold text-gray-800 text-sm lg:text-base">
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
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2 lg:text-lg">
                <span>📝</span> توضیحات
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm lg:text-base">
                {post.description}
              </p>
            </div>

            {/* مهارت‌ها */}
            {post.skills && post.skills.length > 0 && (
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2 lg:text-lg">
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

            {/* آگهی‌دهنده — موبایل */}
            <div className="lg:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg text-white font-bold shadow-md shrink-0">
                  {ownerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">آگهی‌دهنده</div>
                  <div className="font-bold text-gray-800 text-sm truncate">
                    {ownerName}
                  </div>
                </div>
                <Link
                  href={`/user/${owner?.id || post.user_id}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 active:scale-90 transition-all shrink-0"
                  aria-label="مشاهده پروفایل"
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
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* دکمه گزارش زیرین */}
            {!isOwner && (
              <button
                onClick={handleReport}
                className="w-full flex items-center justify-center gap-2 text-xs text-red-600 font-semibold py-3 rounded-xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 active:scale-[0.98] transition-all"
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
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                گزارش این آگهی
              </button>
            )}

            {/* هشدار امنیتی */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 lg:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                  🛡️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1">
                    هشدار امنیتی
                  </h3>
                  <ul className="space-y-1.5 text-xs lg:text-sm text-amber-800 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 shrink-0">•</span>
                      <span>
                        هرگز قبل از انجام و تحویل کار، مبلغی پرداخت نکنید.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-500 shrink-0">•</span>
                      <span>
                        برای ارتباط و پرداخت، فقط از طریق همین پلتفرم اقدام
                        کنید.
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

            <div className="text-center pb-2">
              <Link
                href="/rules"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>📜</span>
                مشاهده قوانین و مقررات کامل
              </Link>
            </div>
          </div>

          {/* ===== Sidebar دسکتاپ ===== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* کارت قیمت + اقدام */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <PriceCard />

                <div className="mt-4">
                  {!isOwner && post.status === "active" && (
                    <ActionButtons variant="desktop" />
                  )}
                  {!isOwner && statusInfo && (
                    <div
                      className={`rounded-xl p-3 text-center border-2 ${statusInfo.cls}`}
                    >
                      <p className="text-xs font-semibold">{statusInfo.text}</p>
                    </div>
                  )}
                  {isOwner && (
                    <Link
                      href={`/edit-post/${post.id}`}
                      className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
                    >
                      ✏️ ویرایش آگهی
                    </Link>
                  )}
                </div>
              </div>

              {/* کارت آگهی‌دهنده */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  آگهی‌دهنده
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl text-white font-bold shadow-md shrink-0">
                    {ownerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate">
                      {ownerName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeDate(post.created_at)} عضو شده
                    </div>
                  </div>
                </div>
                <Link
                  href={`/user/${owner?.id || post.user_id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  مشاهده پروفایل
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

              {/* کارت اطلاعات سریع */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  اطلاعات آگهی
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">تعداد بازدید</span>
                    <span className="font-semibold text-gray-800">
                      {post.views}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">تاریخ ثبت</span>
                    <span className="font-semibold text-gray-800">
                      {formatRelativeDate(post.created_at)}
                    </span>
                  </div>
                  {post.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">موقعیت</span>
                      <span className="font-semibold text-gray-800">
                        {post.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">وضعیت</span>
                    <span
                      className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                        post.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {post.status === "active"
                        ? "فعال"
                        : post.status === "locked"
                          ? "قفل شده"
                          : post.status === "completed"
                            ? "تکمیل شده"
                            : post.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== دکمه اقدام ثابت موبایل ===== */}
      {!isOwner && post.status === "active" && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 max-w-md mx-auto shadow-lg z-30 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ActionButtons variant="mobile" />
        </div>
      )}

      {/* ===== پیام وضعیت موبایل ===== */}
      {!isOwner && statusInfo && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 max-w-md mx-auto shadow-lg z-30 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div
            className={`rounded-xl p-3 text-center border-2 ${statusInfo.cls}`}
          >
            <p className="text-xs font-semibold">{statusInfo.text}</p>
          </div>
        </div>
      )}

      {/* ===== مودال ارسال پیام ===== */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center"
          onClick={() => !sending && setShowContactModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl lg:rounded-3xl p-5 animate-slide-up lg:animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg text-white font-bold">
                  {ownerName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-gray-500">ارسال پیام به</div>
                  <div className="font-bold text-gray-800 text-sm">
                    {ownerName}
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

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <div className="text-xs text-blue-600 mb-0.5">
                در پاسخ به آگهی
              </div>
              <div className="text-sm font-semibold text-blue-900 line-clamp-1">
                {post.title}
              </div>
            </div>

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

      {/* مودال گزارش تخلف */}
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
        token={token}
      />

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .lg\\:animate-fade-in { animation: fade-in 0.2s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
