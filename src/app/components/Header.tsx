"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useUILayout } from "@/app/hooks/useUILayout";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { hideBottomNav } = useUILayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // بستن منو هنگام کلیک بیرون
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // بستن منو هنگام تغییر مسیر
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // بستن منو با کلید Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // پنهان کردن هدر در صفحه چت (مثل BottomNav)
  if (hideBottomNav) return null;

  const displayName =
    user?.full_name || (user as any)?.fullName || user?.phone || "کاربر";

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between max-w-md mx-auto">
        {/* لوگو */}
        <Link
          href="/"
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-blue-500/30">
            🚀
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800 leading-tight">
              فریلنسرکار
            </div>
            <div className="text-[9px] text-gray-500 leading-tight">
              بازار کارهای آنلاین
            </div>
          </div>
        </Link>

        {/* اقدامات */}
        <div className="flex items-center gap-1.5">
          {token ? (
            <>
              {/* اعلانات */}
              <Link
                href="/notifications"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
                aria-label="اعلانات"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </Link>

              {/* منوی کاربر */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 active:scale-95 transition-all"
                  aria-label="منوی کاربر"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {displayName.charAt(0)}
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform hidden sm:block ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* منوی کشویی */}
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 animate-dropdown z-50 overflow-hidden"
                  >
                    {/* اطلاعات کاربر */}
                    <div className="px-4 py-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-md ring-2 ring-white">
                          {displayName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-800 truncate">
                            {displayName}
                          </div>
                          {user?.phone && (
                            <div
                              className="text-[10px] text-gray-500 truncate"
                              dir="ltr"
                              style={{ textAlign: "right" }}
                            >
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* بخش اصلی */}
                    <div className="py-1">
                      <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        حساب من
                      </div>
                      {[
                        { href: "/profile", icon: "👤", label: "پروفایل من" },
                        {
                          href: "/profile?tab=posts",
                          icon: "📝",
                          label: "آگهی‌های من",
                        },
                        {
                          href: "/profile?tab=saved",
                          icon: "❤️",
                          label: "ذخیره‌شده‌ها",
                        },
                        {
                          href: "/notifications",
                          icon: "🔔",
                          label: "اعلانات",
                        },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          role="menuitem"
                        >
                          <span className="text-base w-5 text-center">
                            {item.icon}
                          </span>
                          <span className="text-sm text-gray-700">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* بخش پشتیبانی و اطلاعات */}
                    <div className="py-1 border-t border-gray-100">
                      <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        بیشتر
                      </div>
                      {[
                        {
                          href: "/rules",
                          icon: "📜",
                          label: "قوانین و مقررات",
                        },
                        { href: "/about", icon: "📖", label: "درباره ما" },
                        { href: "/contact", icon: "📞", label: "تماس با ما" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          role="menuitem"
                        >
                          <span className="text-base w-5 text-center">
                            {item.icon}
                          </span>
                          <span className="text-sm text-gray-700">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* دکمه خروج */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 active:bg-red-100 transition-colors text-right"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">🚪</span>
                        <span className="text-sm text-red-600 font-medium">
                          خروج از حساب
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-95 transition-all"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes dropdown {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-dropdown {
          animation: dropdown 0.18s ease-out;
          transform-origin: top left;
        }
      `}</style>
    </header>
  );
}