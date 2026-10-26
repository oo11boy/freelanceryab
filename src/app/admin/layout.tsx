'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  disabled?: boolean;
}

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'داشبورد', icon: '📊', exact: true },
  { href: '/admin/users', label: 'کاربران', icon: '👥' },
  { href: '/admin/posts', label: 'آگهی‌ها', icon: '📝' },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: '🗂️' },
  { href: '/admin/contracts', label: 'قراردادها', icon: '💼' },
  { href: '/admin/reports', label: 'گزارش‌ها', icon: '🚨' },
  { href: '/admin/notifications', label: 'اعلانات', icon: '🔔' },
  { href: '/admin/settings', label: 'تنظیمات', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    if (user && (user as any).role !== 'admin') {
      router.push('/');
    }
  }, [user, token, loading, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user || (user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const isActive = (item: MenuItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay موبایل */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}
      >
        {/* لوگو */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
              🚀
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 leading-tight">
                پنل مدیریت
              </div>
              <div className="text-[10px] text-gray-500">
                فریلنسرکار
              </div>
            </div>
          </Link>
        </div>

        {/* منو */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-180px)]">
          {menuItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.disabled && (
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    بعداً
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* دکمه خروج */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
            خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:mr-64">
        {/* هدر موبایل */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="منو"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-gray-800">پنل مدیریت</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user.full_name?.charAt(0) || '👤'}
          </div>
        </header>

        {/* محتوا */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}