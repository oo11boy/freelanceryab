// app/user/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usersAPI, messagesAPI } from "@/app/services/api";
import { useAuth } from "@/app/hooks/useAuth";

interface PublicUser {
  id: number;
  full_name: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
  rating: number;
  completed_projects: number;
  created_at: string;
  online_status: number;
  active_posts_count: number;
}

interface RecentPost {
  id: number;
  title: string;
  category: string;
  price: string | null;
  price_type: string;
  location: string | null;
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

interface RatingStats {
  total: number;
  average: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, token } = useAuth();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    total: 0,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadUser = async () => {
    try {
      const data = await usersAPI.getPublicProfile(Number(params.id));
      setUser(data.user);
      setRecentPosts(data.recentPosts || []);
      setReviews(data.reviews || []);
      setRatingStats(
        data.ratingStats || {
          total: 0,
          average: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      );
    } catch (error) {
      console.error("خطا در دریافت کاربر:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!message.trim() || !user) return;

    setSending(true);
    try {
      await messagesAPI.sendMessage(user.id, message.trim());
      setShowContactModal(false);
      setMessage("");
      router.push(`/messages?user=${user.id}`);
    } catch (error: any) {
      alert(error.message || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleOpenContact = () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setShowContactModal(true);
  };

  const experienceLabel: Record<string, string> = {
    beginner: "تازه‌کار",
    intermediate: "متوسط",
    advanced: "پیشرفته",
    expert: "حرفه‌ای",
  };

  const memberSince = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  };

  const formatTimeAgo = (date: string) => {
    try {
      const diff = Date.now() - new Date(date).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return "لحظاتی پیش";
      if (hours < 24) return `${hours} ساعت پیش`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} روز پیش`;
      return `${Math.floor(days / 30)} ماه پیش`;
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
        <div className="lg:hidden bg-white shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto p-4 lg:px-6 lg:mt-6">
          <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6">
            <div className="bg-white rounded-2xl p-6 animate-pulse mb-4 lg:mb-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mx-auto" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-4xl">
            ❌
          </div>
          <p className="text-lg font-bold text-gray-800 mb-2">کاربر یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // 🔑 کارت اطلاعات پروفایل (استفاده در موبایل + Sidebar دسکتاپ)
  const ProfileCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden p-6 text-center">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
        <div className="relative">
          <div className="relative inline-block">
            <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white rounded-3xl flex items-center justify-center text-5xl lg:text-6xl text-gray-700 shadow-xl font-bold mx-auto">
              {user.full_name?.charAt(0) || "👤"}
            </div>
            {user.online_status === 1 && (
              <div className="absolute bottom-1 right-1 w-6 h-6 lg:w-7 lg:h-7 bg-green-500 rounded-full border-4 border-white shadow" />
            )}
          </div>
          <h2 className="text-xl lg:text-2xl font-bold mt-3">
            {user.full_name || "کاربر همیار"}
          </h2>
          <p className="text-xs lg:text-sm opacity-80 mt-1">
            عضو از {memberSince(user.created_at)}
          </p>

          {ratingStats.total > 0 && (
            <div className="inline-flex items-center gap-2 mt-3 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-xs">
                    {star <= Math.round(ratingStats.average) ? "⭐" : "☆"}
                  </span>
                ))}
              </div>
              <span className="text-sm font-bold">
                {ratingStats.average.toFixed(1)}
              </span>
              <span className="text-[10px] opacity-80">
                ({ratingStats.total} نظر)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* آمار */}
      <div className="p-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
        <div className="text-center px-2">
          <div className="text-xl lg:text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
            <span>⭐</span>
            {ratingStats.average > 0
              ? ratingStats.average.toFixed(1)
              : user.rating || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">امتیاز</div>
        </div>
        <div className="text-center px-2">
          <div className="text-xl lg:text-2xl font-bold text-green-600">
            {user.completed_projects || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">پروژه موفق</div>
        </div>
        <div className="text-center px-2">
          <div className="text-xl lg:text-2xl font-bold text-blue-600">
            {user.active_posts_count || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">آگهی فعال</div>
        </div>
      </div>

      {/* دکمه ارتباط */}
      {!isOwnProfile && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleOpenContact}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
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
            ارسال پیام
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-12">
      {/* ===== نوار بالا موبایل ===== */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20 px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95"
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
          پروفایل کاربر
        </h1>
        <div className="w-10" />
      </div>

      {/* ===== Breadcrumb دسکتاپ ===== */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              خانه
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href="/top-freelancers"
              className="hover:text-blue-600 transition-colors"
            >
              فریلنسرها
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium truncate max-w-xs">
              {user.full_name || "کاربر همیار"}
            </span>
          </nav>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <svg
              className="w-5 h-5 rotate-180"
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
            بازگشت
          </button>
        </div>
      </div>

      {/* ===== محتوا ===== */}
      <div className="max-w-7xl mx-auto lg:px-6 lg:mt-2">
        <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6">

          {/* ===== Sidebar (موبایل: بالای صفحه، دسکتاپ: sticky) ===== */}
          <aside>
            {/* موبایل */}
            <div className="lg:hidden">
              <ProfileCard />
            </div>

            {/* دسکتاپ sticky */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <ProfileCard />
              </div>
            </div>
          </aside>

          {/* ===== ستون محتوا ===== */}
          <main className="p-4 lg:p-0 space-y-4 lg:space-y-5">

            {/* سطح تجربه */}
            {user.experience && (
              <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-purple-50 flex items-center justify-center text-2xl lg:text-3xl shrink-0">
                  🏆
                </div>
                <div>
                  <div className="text-xs lg:text-sm text-gray-500">سطح تجربه</div>
                  <div className="font-bold text-gray-800 text-sm lg:text-base">
                    {experienceLabel[user.experience] || user.experience}
                  </div>
                </div>
              </div>
            )}

            {/* بیو */}
            {user.bio && (
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2 lg:text-lg">
                  <span>📝</span> درباره من
                </h3>
                <p className="text-sm lg:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {user.bio}
                </p>
              </div>
            )}

            {/* مهارت‌ها */}
            {user.skills && user.skills.length > 0 && (
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2 lg:text-lg">
                  <span>🎯</span> مهارت‌ها
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, idx) => (
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

            {/* آمار امتیازها */}
            {ratingStats.total > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 lg:p-6 shadow-sm">
                <h3 className="font-bold mb-3 lg:mb-4 text-amber-900 text-sm lg:text-lg flex items-center gap-2">
                  <span>⭐</span> امتیازها و نظرات
                </h3>
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-center shrink-0">
                    <div className="text-3xl lg:text-5xl font-bold text-amber-600">
                      {ratingStats.average.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-[10px] lg:text-base">
                          {star <= Math.round(ratingStats.average) ? "⭐" : "☆"}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] lg:text-sm text-amber-700 mt-0.5">
                      {ratingStats.total} نظر
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 lg:space-y-1.5">
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
                          <span className="text-[10px] lg:text-xs text-amber-700 font-medium w-3">
                            {star}
                          </span>
                          <span className="text-[10px] lg:text-xs">⭐</span>
                          <div className="flex-1 bg-white/60 rounded-full h-1.5 lg:h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] lg:text-xs text-amber-700 font-medium w-4 text-left">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* لیست نظرات */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 lg:text-lg">
                    <span>💬</span> نظرات کاربران
                  </h3>
                  {reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-xs lg:text-sm text-blue-600 font-medium hover:underline"
                    >
                      {showAllReviews
                        ? "کمتر"
                        : `مشاهده همه (${reviews.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {displayedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-xl p-3 lg:p-4 border border-gray-100"
                    >
                      <div className="flex items-start gap-2.5 lg:gap-3">
                        <Link
                          href={`/user/${review.reviewer_id}`}
                          className="shrink-0"
                        >
                          <div className="w-9 h-9 lg:w-11 lg:h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs lg:text-sm font-bold">
                            {review.reviewer_name?.charAt(0) || "👤"}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Link
                              href={`/user/${review.reviewer_id}`}
                              className="font-semibold text-xs lg:text-sm text-gray-800 truncate hover:text-blue-600"
                            >
                              {review.reviewer_name}
                            </Link>
                            <span className="text-[10px] lg:text-xs text-gray-400 whitespace-nowrap shrink-0">
                              {formatTimeAgo(review.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-[10px] lg:text-sm">
                                {star <= review.rating ? "⭐" : "☆"}
                              </span>
                            ))}
                            <span className="text-[10px] lg:text-xs text-amber-700 font-bold mr-1">
                              {review.rating}/۵
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                          {review.post_title && (
                            <Link
                              href={`/post/${review.post_id}`}
                              className="inline-flex items-center gap-1 mt-2 text-[10px] lg:text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              📋 {review.post_title}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* آگهی‌های اخیر */}
            {recentPosts.length > 0 && (
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2 lg:text-lg">
                  <span>📋</span> آگهی‌های فعال ({recentPosts.length})
                </h3>
                <div className="space-y-2 lg:space-y-3">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-3 lg:p-4 transition-colors"
                    >
                      <div className="font-semibold text-sm lg:text-base text-gray-800 mb-1 truncate">
                        {post.title}
                      </div>
                      <div className="flex items-center justify-between text-xs lg:text-sm text-gray-500">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                        <span dir="ltr">
                          {post.price_type === "contact"
                            ? "توافقی"
                            : `${post.price} تومان`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

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
                  {user.full_name?.charAt(0) || "👤"}
                </div>
                <div>
                  <div className="text-xs text-gray-500">ارسال پیام به</div>
                  <div className="font-bold text-gray-800 text-sm">
                    {user.full_name || "کاربر همیار"}
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

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
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

      <style>{`
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
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .lg:animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}