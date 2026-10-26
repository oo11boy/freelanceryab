// app/components/TopFreelancers.tsx
"use client";
import { useState, useEffect } from "react";
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

const EXPERIENCE_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: "تازه‌کار", color: "text-slate-600 bg-slate-100" },
  intermediate: { label: "متوسط", color: "text-blue-700 bg-blue-100" },
  advanced: { label: "پیشرفته", color: "text-purple-700 bg-purple-100" },
  expert: { label: "حرفه‌ای", color: "text-amber-700 bg-amber-100" },
};

const RANK_STYLES = [
  {
    ring: "ring-amber-400",
    avatar: "from-amber-400 to-orange-500",
    medal: "🥇",
  },
  {
    ring: "ring-slate-400",
    avatar: "from-slate-400 to-slate-600",
    medal: "🥈",
  },
  {
    ring: "ring-orange-400",
    avatar: "from-orange-400 to-red-500",
    medal: "🥉",
  },
];

export default function TopFreelancers() {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopUsers();
  }, []);

  const loadTopUsers = async () => {
    try {
      const data = await usersAPI.getTop({ limit: 6, minRating: 0 });
      setUsers(data.users || []);
    } catch (error) {
      console.error("خطا در دریافت کاربران برتر:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && users.length === 0) return null;

  return (
    <div className="mt-5">
      {/* هدر */}
      <div className="flex items-center justify-between px-4 mb-2.5">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <span>🏆</span> بهترین فریلنسرها
        </h2>
        <Link
          href="/top-freelancers"
          className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5"
        >
          مشاهده همه
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
      </div>

      {/* اسکرول افقی */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 px-4 pb-1 pt-2">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[120px] bg-white rounded-xl p-2.5 shadow-sm animate-pulse shrink-0"
                >
                  <div className="w-11 h-11 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="h-2.5 bg-gray-200 rounded w-3/4 mx-auto mb-1.5" />
                  <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
                </div>
              ))
            : users.map((u, index) => {
                const rank = index < 3 ? RANK_STYLES[index] : null;
                const exp = u.experience
                  ? EXPERIENCE_CONFIG[u.experience]
                  : null;
                const rating = Number(u.rating || 0);
                const rounded = Math.round(rating);

                return (
                  <Link
                    key={u.id}
                    href={`/user/${u.id}`}
                    className="relative min-w-[120px] max-w-[120px] bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.97] transition-all shrink-0 flex flex-col items-center"
                  >
                    {/* مدال رتبه - گوشه */}
                    {rank && (
                      <span className="absolute -top-1.5 -right-1.5 text-base drop-shadow">
                        {rank.medal}
                      </span>
                    )}

                    {/* آواتار */}
                    <div className="relative mb-1.5">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-base text-white font-bold shadow-md bg-gradient-to-br ${
                          rank ? rank.avatar : "from-blue-500 to-purple-600"
                        } ${rank ? `ring-2 ring-offset-1 ${rank.ring}` : ""}`}
                      >
                        {u.full_name?.charAt(0) || "👤"}
                      </div>
                      {u.online_status === 1 && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* نام */}
                    <h3 className="font-bold text-[11px] text-gray-800 truncate w-full text-center leading-tight">
                      {u.full_name || "کاربر"}
                    </h3>

                    {/* امتیاز */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-[9px] text-amber-400">
                        {"⭐".repeat(rounded)}
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold">
                        {rating.toFixed(1)}
                      </span>
                    </div>

                    {/* آمار کوتاه */}
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <span className="text-green-500">✓</span>
                        {u.completed_projects || 0}
                      </span>
                      {u.reviews_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <span>💬</span>
                          {u.reviews_count}
                        </span>
                      )}
                    </div>

                    {/* سطح تجربه */}
                    {exp && (
                      <span
                        className={`mt-1.5 text-[8px] ${exp.color} px-1.5 py-0.5 rounded-full font-medium`}
                      >
                        {exp.label}
                      </span>
                    )}
                  </Link>
                );
              })}
        </div>
      </div>

      <style>{`
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
