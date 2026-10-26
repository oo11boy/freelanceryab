// app/profile/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";
import {
  profileAPI,
  postsAPI,
  savedAPI,
  profileReviewsAPI,
} from "@/app/services/api";
import PostCard from "@/app/components/PostCard";

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

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar: string | null;
  post_id: number;
  post_title: string | null;
}

interface CompletedContract {
  contract_id: number;
  completed_at: string;
  post_id: number;
  post_title: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string | null;
  my_role: "client" | "freelancer";
}

interface RatingStats {
  total: number;
  average: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

type ProjectFilter = "freelancer" | "client";
type ModalType = "saved" | "info" | null;

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedContracts, setCompletedContracts] = useState<
    CompletedContract[]
  >([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    total: 0,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalViews: 0,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [projectFilter, setProjectFilter] =
    useState<ProjectFilter>("freelancer");

  // 🔑 مودال
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  useEffect(() => {
    if (token && !reviewsLoaded) {
      loadReviews();
    }
  }, [token, reviewsLoaded]);

  // لود ذخیره‌ها وقتی مودال باز می‌شه
  useEffect(() => {
    if (activeModal === "saved" && token) {
      loadSavedPosts();
    }
  }, [activeModal, token]);

  const loadUserPosts = async () => {
    try {
      const data = await profileAPI.getMyPosts();
      setUserPosts(data.posts);

      const active = data.posts.filter(
        (p: UserPost) => p.status === "active",
      ).length;
      const totalViews = data.posts
        .filter((p: UserPost) => p.status !== "expired")
        .reduce((sum: number, p: UserPost) => sum + p.views, 0);

      setStats((prev) => ({
        ...prev,
        active,
        totalViews,
      }));
    } catch (error) {
      console.error("خطا در دریافت آگهی‌ها:", error);
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
      console.error("خطا در دریافت ذخیره‌ها:", error);
    } finally {
      setSavedLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await profileReviewsAPI.get();
      setReviews(data.reviews || []);
      const contracts = data.completedContracts || [];
      setCompletedContracts(contracts);
      setRatingStats(
        data.stats || {
          total: 0,
          average: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      );

      setStats((prev) => ({
        ...prev,
        completed: contracts.length,
      }));

      setReviewsLoaded(true);
    } catch (error) {
      console.error("خطا در دریافت نظرات:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("آیا از حذف این آگهی مطمئن هستید؟")) return;

    setDeletingId(id);
    try {
      await postsAPI.deletePost(id);
      setUserPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "expired" } : p)),
      );
      setStats((prev) => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
      }));
    } catch (error: any) {
      alert(error.message || "خطا در حذف آگهی");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveSaved = async (postId: number) => {
    try {
      await savedAPI.removeSaved(postId);
      setSavedPosts(savedPosts.filter((p) => p.id !== postId));
    } catch (error) {
      alert("خطا در حذف از علاقه‌مندی‌ها");
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

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return {
        label: "● فعال",
        classes: "bg-green-50 text-green-700 border border-green-200",
      };
    }
    if (status === "locked") {
      return {
        label: "🔒 قفل شده",
        classes: "bg-purple-50 text-purple-700 border border-purple-200",
      };
    }
    if (status === "in_progress") {
      return {
        label: "🔄 در حال انجام",
        classes: "bg-amber-50 text-amber-700 border border-amber-200",
      };
    }
    if (status === "delivered") {
      return {
        label: "📦 منتظر تأیید",
        classes: "bg-orange-50 text-orange-700 border border-orange-200",
      };
    }
    if (status === "completed") {
      return {
        label: "✅ تکمیل شده",
        classes: "bg-blue-50 text-blue-700 border border-blue-200",
      };
    }
    if (status === "expired") {
      return {
        label: "🗑 حذف شده",
        classes: "bg-red-50 text-red-600 border border-red-200",
      };
    }
    return { label: status, classes: "bg-gray-100 text-gray-600" };
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
            onClick={() => router.push("/login")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
          >
            ورود / ثبت‌نام
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "posts", label: "آگهی‌ها", icon: "📝" },
    { id: "projects", label: "پروژه‌ها", icon: "💼" },
    { id: "reviews", label: "نظرات", icon: "⭐" },
  ];

  const sortedPosts = [...userPosts].sort((a, b) => {
    const order: Record<string, number> = {
      active: 0,
      locked: 1,
      in_progress: 2,
      delivered: 3,
      completed: 4,
      expired: 5,
    };
    return (order[a.status] ?? 6) - (order[b.status] ?? 6);
  });

  const freelancerProjects = completedContracts.filter(
    (c) => c.my_role === "freelancer",
  );
  const clientProjects = completedContracts.filter(
    (c) => c.my_role === "client",
  );
  const filteredProjects =
    projectFilter === "freelancer" ? freelancerProjects : clientProjects;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر پروفایل */}
      {/* هدر پروفایل */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

        <div className="relative px-5 pt-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold">پروفایل من</h1>
            <div className="flex items-center gap-2">
              {/* دکمه ذخیره‌ها */}
              <button
                onClick={() => setActiveModal("saved")}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 active:scale-95 transition-all relative"
                aria-label="ذخیره شده‌ها"
              >
                <div className="relative">
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {savedPosts.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                      {savedPosts.length > 9 ? "9+" : savedPosts.length}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium whitespace-nowrap">
                  ذخیره‌ها
                </span>
              </button>

              {/* دکمه ویرایش */}
              <Link
                href="/profile/edit"
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 active:scale-95 transition-all"
                aria-label="ویرایش پروفایل"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-[9px] font-medium whitespace-nowrap">
                  ویرایش
                </span>
              </Link>

              {/* دکمه خروج */}
              <button
                onClick={logout}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 active:scale-95 transition-all"
                aria-label="خروج"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-[9px] font-medium whitespace-nowrap">
                  خروج
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl text-gray-700 shadow-xl font-bold">
                {user?.full_name?.charAt(0) || "👤"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {user?.full_name || "کاربر همیار"}
              </h2>
              <p className="text-sm opacity-80 mt-1" dir="ltr">
                {user?.phone}
              </p>
              {reviewsLoaded && ratingStats.total > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-sm">
                        {star <= Math.round(ratingStats.average) ? "⭐" : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-bold">
                    {ratingStats.average.toFixed(1)}
                  </span>
                  <span className="text-[10px] opacity-80">
                    ({ratingStats.total} نظر)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* آمار */}
      <div className="-mt-12 px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-blue-600">
              {stats.active}
            </div>
            <div className="text-xs text-gray-500 mt-1">آگهی فعال</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-xs text-gray-500 mt-1">پروژه انجام شده</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalViews}
            </div>
            <div className="text-xs text-gray-500 mt-1">بازدید کل</div>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="mt-6 mx-4 bg-white rounded-xl p-1.5 shadow-sm flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
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
{activeTab === "posts" && (
  <div className="space-y-3">
    {loading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-5 bg-gray-100 rounded-full w-16 shrink-0" />
            </div>
            <div className="flex justify-between mb-4">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-100 rounded-xl flex-1" />
              <div className="h-10 bg-gray-100 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    ) : sortedPosts.length > 0 ? (
      sortedPosts.map((post) => {
        const isExpired = post.status === "expired";
        const isDeleting = deletingId === post.id;
        const badge = getStatusBadge(post.status);

        return (
          <div
            key={post.id}
            className={`rounded-2xl shadow-sm border transition-all overflow-hidden ${
              isExpired
                ? "border-red-100 bg-red-50/40 opacity-75"
                : "bg-white border-gray-100 hover:shadow-md"
            }`}
          >
            {/* هدر کارت: عنوان + بج */}
            <div className="p-4 pb-3">
              <div className="flex justify-between items-start gap-3 mb-3">
                <h3
                  className={`font-bold flex-1 leading-relaxed text-sm line-clamp-2 ${
                    isExpired
                      ? "text-gray-500 line-through"
                      : "text-gray-800"
                  }`}
                >
                  {post.title}
                </h3>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 flex items-center gap-1 ${badge.classes}`}
                >
                  {badge.label}
                </span>
              </div>

              {/* اطلاعات: قیمت + بازدید */}
              <div className="flex items-center gap-3 text-xs">
                {/* قیمت */}
                <span
                  className={`flex items-center gap-1 font-medium ${
                    isExpired ? "text-gray-400" : "text-emerald-700"
                  }`}
                >
                  <span className="text-sm">💰</span>
                  {post.price && post.price !== "0" && post.price !== "null" ? (
                    <span className="font-bold">
                      {Number(post.price).toLocaleString("fa-IR")}{" "}
                      <span className="text-[10px] font-medium">تومان</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">توافقی</span>
                  )}
                </span>

                <span className="w-px h-3 bg-gray-200" />

                {/* بازدید */}
                <span className="flex items-center gap-1 text-gray-500">
                  <svg
                    className="w-3.5 h-3.5"
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
                  <span className="font-medium">
                    {post.views.toLocaleString("fa-IR")}
                  </span>
                </span>
              </div>
            </div>

            {/* دکمه‌های اقدام */}
            <div className="px-4 pb-4">
              {post.status === "locked" ? (
                <div className="flex gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="flex-1 text-center text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-md shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    مشاهده پروژه
                  </Link>
                  <div className="flex-1 text-xs bg-purple-50 border border-purple-200 text-purple-700 py-2.5 rounded-xl font-bold text-center flex items-center justify-center gap-1">
                    🔒 قفل شده
                  </div>
                </div>
              ) : post.status === "in_progress" ? (
                <div className="flex gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="flex-1 text-center text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    مشاهده پروژه
                  </Link>
                  <div className="flex-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl font-bold text-center flex items-center justify-center gap-1">
                    🔄 در حال انجام
                  </div>
                </div>
              ) : post.status === "delivered" ? (
                <div className="flex gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="flex-1 text-center text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold shadow-md shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    مشاهده پروژه
                  </Link>
                  <div className="flex-1 text-xs bg-orange-50 border border-orange-200 text-orange-700 py-2.5 rounded-xl font-bold text-center flex items-center justify-center gap-1">
                    📦 منتظر تأیید
                  </div>
                </div>
              ) : isExpired ? (
                <div className="w-full bg-gray-100 border border-gray-200 text-gray-500 py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  حذف شده
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="flex-1 text-center text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/30 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    مشاهده
                  </Link>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={isDeleting}
                    className="flex-1 text-xs border-2 border-red-200 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-50 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        در حال حذف...
                      </>
                    ) : (
                      <>
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        حذف
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
          📝
        </div>
        <p className="text-gray-700 font-bold mb-1">هنوز آگهی ندارید</p>
        <p className="text-sm text-gray-500 mb-6">
          اولین آگهی خود را ثبت کنید
        </p>
        <Link
          href="/create-post"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          ثبت آگهی جدید
        </Link>
      </div>
    )}
  </div>
)}

        {/* تب پروژه‌ها */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-1.5 shadow-sm flex">
              <button
                onClick={() => setProjectFilter("freelancer")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  projectFilter === "freelancer"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-base">🔨</span>
                <span>فریلنسر</span>
                {freelancerProjects.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      projectFilter === "freelancer"
                        ? "bg-white/20"
                        : "bg-gray-100"
                    }`}
                  >
                    {freelancerProjects.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setProjectFilter("client")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  projectFilter === "client"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-base">📋</span>
                <span>کارفرما</span>
                {clientProjects.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      projectFilter === "client" ? "bg-white/20" : "bg-gray-100"
                    }`}
                  >
                    {clientProjects.length}
                  </span>
                )}
              </button>
            </div>

            <div
              className={`rounded-xl p-3 border-2 ${
                projectFilter === "freelancer"
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <p
                className={`text-xs leading-relaxed ${
                  projectFilter === "freelancer"
                    ? "text-green-800"
                    : "text-blue-800"
                }`}
              >
                {projectFilter === "freelancer"
                  ? "🔨 پروژه‌هایی که شما به عنوان فریلنسر انجام دادید و کارفرما تأیید کرده است."
                  : "📋 پروژه‌هایی که شما به عنوان کارفرما سفارش دادید و فریلنسر تحویل داده است."}
              </p>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="space-y-2.5">
                {filteredProjects.map((contract) => (
                  <div
                    key={contract.contract_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md bg-gradient-to-br ${
                          projectFilter === "freelancer"
                            ? "from-green-500 to-emerald-600"
                            : "from-blue-500 to-indigo-600"
                        }`}
                      >
                        {projectFilter === "freelancer" ? "🔨" : "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/post/${contract.post_id}`}
                          className="font-semibold text-sm text-gray-800 truncate block hover:text-blue-600 mb-1"
                        >
                          {contract.post_title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <span>
                              {projectFilter === "freelancer"
                                ? "کارفرما:"
                                : "فریلنسر:"}
                            </span>
                            <Link
                              href={`/user/${contract.other_user_id}`}
                              className="text-blue-600 font-medium hover:underline"
                            >
                              {contract.other_user_name}
                            </Link>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            {formatTimeAgo(contract.completed_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">
                            ✅ تکمیل شده
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/post/${contract.post_id}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 active:scale-90 transition-all shrink-0"
                        aria-label="مشاهده"
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
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${
                    projectFilter === "freelancer"
                      ? "bg-gradient-to-br from-green-50 to-emerald-100"
                      : "bg-gradient-to-br from-blue-50 to-indigo-100"
                  }`}
                >
                  {projectFilter === "freelancer" ? "🔨" : "📋"}
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  {projectFilter === "freelancer"
                    ? "هنوز پروژه‌ای به عنوان فریلنسر انجام ندادید"
                    : "هنوز پروژه‌ای به عنوان کارفرما سفارش ندادید"}
                </p>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {projectFilter === "freelancer"
                    ? "پروژه‌هایی که با موفقیت تحویل می‌دید و کارفرما تأیید می‌کنه اینجا نمایش داده می‌شه"
                    : "پروژه‌هایی که ثبت می‌کنید و فریلنسر تحویل می‌ده اینجا نمایش داده می‌شه"}
                </p>
                {projectFilter === "freelancer" ? (
                  <Link
                    href="/explore"
                    className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-green-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
                  >
                    جستجوی پروژه
                  </Link>
                ) : (
                  <Link
                    href="/create-post"
                    className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
                  >
                    ثبت آگهی جدید
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* تب نظرات */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {ratingStats.total > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="text-center shrink-0">
                        <div className="text-3xl font-bold text-amber-600">
                          {ratingStats.average.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-xs">
                              {star <= Math.round(ratingStats.average)
                                ? "⭐"
                                : "☆"}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-amber-700 mt-0.5">
                          {ratingStats.total} نظر
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            ratingStats.distribution[
                              star as keyof typeof ratingStats.distribution
                            ] || 0;
                          const percent =
                            ratingStats.total > 0
                              ? (count / ratingStats.total) * 100
                              : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-700 font-medium w-3">
                                {star}
                              </span>
                              <span className="text-[10px]">⭐</span>
                              <div className="flex-1 bg-white/60 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-amber-700 font-medium w-4 text-left">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/user/${review.reviewer_id}`}
                            className="shrink-0"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {review.reviewer_name?.charAt(0) || "👤"}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Link
                                href={`/user/${review.reviewer_id}`}
                                className="font-semibold text-sm text-gray-800 truncate hover:text-blue-600"
                              >
                                {review.reviewer_name}
                              </Link>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                                {formatTimeAgo(review.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-xs">
                                  {star <= review.rating ? "⭐" : "☆"}
                                </span>
                              ))}
                              <span className="text-[10px] text-amber-700 font-bold mr-1">
                                {review.rating}/۵
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {review.comment}
                              </p>
                            )}
                            {review.post_title && (
                              <Link
                                href={`/post/${review.post_id}`}
                                className="inline-flex items-center gap-1 mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                              >
                                📋 {review.post_title}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-4xl">
                      ⭐
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">
                      هنوز نظری ندارید
                    </p>
                    <p className="text-sm text-gray-500">
                      بعد از تکمیل پروژه‌ها، نظرات کاربران اینجا نمایش داده
                      می‌شود
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          مودال ذخیره شده‌ها
      ===================================================== */}
      {activeModal === "saved" && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl animate-slide-up flex flex-col"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>❤️</span> ذخیره شده‌ها
                </h2>
                {savedPosts.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {savedPosts.length} آگهی
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
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

            {/* محتوا */}
            <div className="overflow-y-auto flex-1 p-4">
              {savedLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-2xl p-4 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : savedPosts.length > 0 ? (
                <div className="space-y-3">
                  {savedPosts.map((post) => (
                    <div key={post.id} className="relative">
                      <PostCard
                        id={post.id}
                        title={post.title}
                        price={post.price}
                        category={post.category}
                        location={post.location || "آنلاین"}
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
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-50 to-red-100 flex items-center justify-center text-4xl">
                    ❤️
                  </div>
                  <p className="text-gray-700 font-semibold mb-1">
                    هیچ آگهی ذخیره‌ای ندارید
                  </p>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed px-4">
                    آگهی‌های مورد علاقه خود را ذخیره کنید تا بعداً ببینید
                  </p>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      router.push("/explore");
                    }}
                    className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    جستجوی آگهی
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

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
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
