// app/top-freelancers/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usersAPI } from "@/app/services/api";

interface TopUser {
  id: number;
  full_name: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
  rating: number;
  completed_projects: number;
  online_status: number;
  created_at: string;
  reviews_count: number;
}

const SORT_OPTIONS = [
  { value: "rating", label: "بالاترین امتیاز", icon: "⭐" },
  { value: "projects", label: "بیشترین پروژه", icon: "✅" },
] as const;

const RATING_OPTIONS = [
  { value: 0, label: "همه" },
  { value: 3, label: "۳ به بالا" },
  { value: 4, label: "۴ به بالا" },
  { value: 4.5, label: "۴.۵ به بالا" },
];

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "تازه‌کار",
  intermediate: "متوسط",
  advanced: "پیشرفته",
  expert: "حرفه‌ای",
};

export default function TopFreelancersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"rating" | "projects">("rating");
  const [minRating, setMinRating] = useState(0);
  const [minProjects, setMinProjects] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, minRating, minProjects]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getTop({
        limit: 50,
        minRating,
        minProjects,
        sort,
      });
      setUsers(data.users || []);
    } catch (error) {
      console.error("خطا در دریافت کاربران:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSort("rating");
    setMinRating(0);
    setMinProjects(0);
  };

  const activeFiltersCount =
    (sort !== "rating" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minProjects > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
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
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-800 text-center">
              بهترین فریلنسرها
            </h1>
            <p className="text-[10px] text-gray-500 text-center">
              بر اساس امتیاز و پروژه‌های موفق
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              showFilters || activeFiltersCount > 0
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            aria-label="فیلترها"
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            {activeFiltersCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* پنل فیلترها */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <span>⚙️</span> فیلترها
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 font-medium hover:underline"
                >
                  حذف همه
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* مرتب‌سازی */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  مرتب‌سازی بر اساس
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = sort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSort(opt.value)}
                        className={`p-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                          isActive
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* حداقل امتیاز */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  حداقل امتیاز
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {RATING_OPTIONS.map((opt) => {
                    const isActive = minRating === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setMinRating(opt.value)}
                        className={`p-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          isActive
                            ? "bg-amber-50 border-2 border-amber-500 text-amber-700"
                            : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* حداقل پروژه */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  حداقل پروژه موفق
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 3, 5].map((num) => {
                    const isActive = minProjects === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setMinProjects(num)}
                        className={`p-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                          isActive
                            ? "bg-green-50 border-2 border-green-500 text-green-700"
                            : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {num === 0 ? "همه" : `${num}+`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نتایج */}
      <div className="p-4">
        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              <span className="font-bold text-gray-800">{users.length}</span>{" "}
              فریلنسر یافت شد
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                <svg
                  className="w-3 h-3"
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
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-2.5">
            {users.map((u, index) => (
              <Link
                key={u.id}
                href={`/user/${u.id}`}
                className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all block"
              >
                <div className="flex items-start gap-3">
                  {/* رتبه + آواتار */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl text-white font-bold shadow-md">
                      {u.full_name?.charAt(0) || "👤"}
                    </div>
                    {u.online_status === 1 && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow" />
                    )}
                    {index < 3 && (
                      <div
                        className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow border-2 border-white ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                            : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400"
                              : "bg-gradient-to-br from-orange-400 to-amber-600"
                        }`}
                      >
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                    )}
                  </div>

                  {/* اطلاعات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm text-gray-800 truncate">
                        {u.full_name || "کاربر همیار"}
                      </h3>
                      {u.experience && (
                        <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                          {EXPERIENCE_LABELS[u.experience] || u.experience}
                        </span>
                      )}
                    </div>

                    {/* امتیاز */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-[10px]">
                            {star <= Math.round(u.rating || 0) ? "⭐" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-600">
                        {Number(u.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({u.reviews_count} نظر)
                      </span>
                    </div>

                    {/* آمار */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="text-green-500">✓</span>
                        {u.completed_projects || 0} پروژه موفق
                      </span>
                    </div>

                    {/* مهارت‌ها */}
                    {u.skills && u.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {u.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {u.skills.length > 3 && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            +{u.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mt-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center text-4xl">
              👥
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              فریلنسری یافت نشد
            </p>
            <p className="text-sm text-gray-500 mb-5">
              {activeFiltersCount > 0
                ? "با این فیلترها کسی پیدا نشد، فیلترها را تغییر دهید"
                : "هنوز فریلنسری ثبت‌نام نکرده"}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
