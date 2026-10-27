"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useUILayout } from "@/app/hooks/useUILayout";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useUnreadMessages } from "@/app/hooks/useUnreadMessages";
import Image from "next/image";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { hideHeader } = useUILayout();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  if (hideHeader) return null;

  const displayName =
    user?.full_name || (user as any)?.fullName || user?.phone || "کاربر";

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const navLinks = [
    { href: "/", label: "خانه", exact: true },
    { href: "/explore", label: "جستجوی پروژه" },
    { href: "/top-freelancers", label: "فریلنسرها" },
    { href: "/blog", label: "مقالات" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isMessagesActive = pathname.startsWith("/messages");
  const isNotificationsActive = pathname.startsWith("/notifications");

  // 🔑 مجموع badge ها (برای موبایل)
  const totalBadges = unreadCount + unreadMessages;

  return (
    <header
      className={`bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-40 ${className}`}
    >
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4 max-w-md lg:max-w-7xl mx-auto">
        {/* ===== لوگو ===== */}
        <Link
          href="/"
          className="flex items-center gap-2 active:scale-95 transition-transform shrink-0"
        >
         <Image src="/icons/iconapp.png" className=" rounded-lg" alt="لوگو" width={50} height={50} />
     
          <div>
            <div className="text-sm lg:text-base font-bold text-gray-800 leading-tight">
              فریلنسریاب
            </div>
            <div className="text-[9px] lg:text-[10px] text-gray-500 leading-tight">
              بازار کارهای آنلاین
            </div>
          </div>
        </Link>

        {/* ===== ناوبری دسکتاپ ===== */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ===== اکشن‌ها ===== */}
        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          {token ? (
            <>
              {/* ثبت آگهی (فقط دسکتاپ) */}
              <Link
                href="/create-post"
                className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/30 hover:shadow-lg active:scale-95 transition-all"
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
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                ثبت آگهی
              </Link>

              {/* 🔑 دکمه پیام‌ها (فقط دسکتاپ) + badge */}
              <Link
                href="/messages"
                className={`relative hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  isMessagesActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={`پیام‌ها${unreadMessages > 0 ? ` (${unreadMessages} خوانده نشده)` : ""}`}
              >
                <div className="relative">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
                پیام‌ها
              </Link>

              {/* اعلانات (آیکون + badge) */}
              <Link
                href="/notifications"
                className={`relative w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isNotificationsActive
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                aria-label={`اعلانات${unreadCount > 0 ? ` (${unreadCount} خوانده نشده)` : ""}`}
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse-slow">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* منوی کاربر */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 lg:pl-2 lg:pr-3 py-1 hover:bg-gray-100 active:scale-95 transition-all"
                  aria-label="منوی کاربر"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <div className="relative w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {displayName.charAt(0)}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {displayName}
                  </span>
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
                    className="absolute left-0 lg:right-0 lg:left-auto top-full mt-2 w-64 lg:w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden origin-top-left lg:origin-top-right animate-dropdown"
                  >
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

                    <div className="py-1">
                      <div className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        حساب من
                      </div>

                      {/* پیام‌ها (فقط موبایل) + badge */}
                      <Link
                        href="/messages"
                        onClick={() => setMenuOpen(false)}
                        className="lg:hidden flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        role="menuitem"
                      >
                        <span className="text-base w-5 text-center">💬</span>
                        <span className="text-sm text-gray-700 flex-1">
                          پیام‌ها
                        </span>
                      </Link>

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
                          badge: unreadCount,
                        },
                      ].map((item: any) => (
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
                          <span className="text-sm text-gray-700 flex-1">
                            {item.label}
                          </span>
                          {item.badge > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-95 transition-all"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown { animation: dropdownFade 0.18s ease-out; }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulseSlow 2s ease-in-out infinite; }
      `}</style>
    </header>
  );
}
