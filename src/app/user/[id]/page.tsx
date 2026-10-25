// app/user/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usersAPI } from "@/app/services/api";

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

export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadUser = async () => {
    try {
      const data = await usersAPI.getPublicProfile(Number(params.id));
      setUser(data.user);
      setRecentPosts(data.recentPosts || []);
    } catch (error) {
      console.error("خطا در دریافت کاربر:", error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-lg font-bold text-gray-800 mb-2">کاربر یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20 px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center">پروفایل کاربر</h1>
        <div className="w-10" />
      </div>

      {/* کارت پروفایل */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

        <div className="relative px-5 pt-8 pb-16 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl text-gray-700 shadow-xl font-bold mx-auto">
              {user.full_name?.charAt(0) || "👤"}
            </div>
            {user.online_status === 1 && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow" />
            )}
          </div>
          <h2 className="text-xl font-bold mt-3">{user.full_name || "کاربر همیار"}</h2>
          <p className="text-xs opacity-80 mt-1">
            عضو از {memberSince(user.created_at)}
          </p>
        </div>
      </div>

      {/* آمار شناور */}
      <div className="-mt-12 px-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
          <div className="text-center px-2">
            <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
              <span>⭐</span>
              {user.rating || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">امتیاز</div>
          </div>
          <div className="text-center px-2">
            <div className="text-xl font-bold text-green-600">
              {user.completed_projects || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">پروژه موفق</div>
          </div>
          <div className="text-center px-2">
            <div className="text-xl font-bold text-blue-600">
              {user.active_posts_count || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">آگهی فعال</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* سطح تجربه */}
        {user.experience && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl shrink-0">
              🏆
            </div>
            <div>
              <div className="text-xs text-gray-500">سطح تجربه</div>
              <div className="font-bold text-gray-800 text-sm">
                {experienceLabel[user.experience] || user.experience}
              </div>
            </div>
          </div>
        )}

        {/* بیو */}
        {user.bio && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
              <span>📝</span> درباره من
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {user.bio}
            </p>
          </div>
        )}

        {/* مهارت‌ها */}
        {user.skills && user.skills.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
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

        {/* آگهی‌های اخیر */}
        {recentPosts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
              <span>📋</span> آگهی‌های فعال ({recentPosts.length})
            </h3>
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors"
                >
                  <div className="font-semibold text-sm text-gray-800 mb-1 truncate">
                    {post.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
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
      </div>
    </div>
  );
}