'use client';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import Header from './Header';
import Footer from './Footer';
import { useUILayout } from '@/app/hooks/useUILayout';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hideHeader } = useUILayout();

  // 🔑 صفحه /admin نباید wrapper، Header، Footer و BottomNav داشته باشه
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* ===== موبایل و تبلت کوچک: تجربه اپ‌مانند (بدون Header سراسری) ===== */}
      <div className="lg:hidden max-w-md mx-auto bg-gray-100 relative pb-20 min-h-screen">
        {children}
        <BottomNav />
      </div>

      {/* ===== دسکتاپ (lg+): Header + Footer همیشگی ===== */}
      <div className="hidden lg:flex lg:flex-col bg-gray-50 min-h-screen">
        {!hideHeader && <Header />}

        {/* main با flex-1 → فضای بین Header و Footer را پر می‌کند */}
        <main className="flex-1">
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
}