import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import { AuthProvider } from "./hooks/useAuth";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "فریلنسرکار | دیوار خدمات آنلاین",
  description: "بازار کارهای مجازی مثل برنامه‌نویسی، تحقیق، ترجمه",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "فریلنسرکار" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="max-w-md mx-auto bg-gray-100 relative pb-20"
      >
        <AuthProvider>
          <div className="min-h-screen">{children}</div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}