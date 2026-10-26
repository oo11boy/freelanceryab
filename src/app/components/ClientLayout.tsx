'use client';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🔑 صفحه /admin نباید wrapper موبایلی و BottomNav داشته باشه
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-md mx-auto bg-gray-100 relative pb-20 min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}