// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./hooks/useAuth";
import { UIProvider } from "./hooks/useUILayout";
import ClientLayout from "./components/ClientLayout";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://freelancerkar.com";
const SITE_NAME = "فریلنسریاب";

// ===================================================
// 📱 Viewport
// ===================================================
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4f46e5",
};

// ===================================================
// 📝 Metadata — سئو شده
// ===================================================
export const metadata: Metadata = {
  // 🔑 metadataBase برای لینک‌های نسبی در OG و Twitter
  metadataBase: new URL(BASE_URL),

  // 🎯 Title Template — صفحات داخلی عنوان خودشان را می‌گذارند
  // مثال: در category/[slug]: title = «پروژه‌های طراحی»
  // نتیجه نهایی: «پروژه‌های طراحی | فریلنسریاب»
  title: {
    default: "فریلنسریاب | بازار پروژه‌های آنلاین و خدمات فریلنسری",
    template: "%s | فریلنسریاب",
  },

  // 📝 Description — CTA + کلمات کلیدی اصلی
  description:
    "فریلنسریاب، بازار آنلاین پروژه‌ها و خدمات فریلنسری در ایران. ثبت پروژه رایگان، دریافت پیشنهاد از فریلنسرهای حرفه‌ای، و شروع همکاری در چند دقیقه. برنامه‌نویسی، طراحی، ترجمه، تولید محتوا و خدمات دانشجویی.",

  // 🎯 کلمات کلیدی اصلی (بدون stuffing)
  keywords: [
    "فریلنسریاب",
    "پروژه آنلاین",
    "فریلنسر",
    "کار آنلاین",
    "استخدام فریلنسر",
    "پروژه برنامه نویسی",
    "پروژه طراحی",
    "پروژه ترجمه",
    "خدمات دانشجویی",
    "دیوار خدمات آنلاین",
    "بازار کار مجازی",
    "پروژه Remote",
    "دورکاری",
    "کارفرما",
    "فریلنسر ایرانی",
  ],

  // 🏢 اطلاعات سایت
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  generator: "Next.js",

  // 🎨 Manifest و PWA
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },

  // 🖼️ Icons
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
  },

  // 🌐 Canonical (پیش‌فرض — صفحات داخلی override می‌کنند)
  alternates: {
    canonical: "/",
    languages: {
      "fa-IR": "/",
    },
  },

  // 📱 Open Graph — اشتراک‌گذاری در شبکه‌های اجتماعی
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: "فریلنسریاب | بازار پروژه‌های آنلاین و خدمات فریلنسری",
    description:
      "بازار آنلاین پروژه‌ها و خدمات فریلنسری. ثبت پروژه رایگان، دریافت پیشنهاد از فریلنسرهای حرفه‌ای.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "فریلنسریاب — بازار پروژه‌های آنلاین",
        type: "image/png",
      },
    ],
  },

  // 🐦 Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@freelancerkar",
    creator: "@freelancerkar",
    title: "فریلنسریاب | بازار پروژه‌های آنلاین",
    description:
      "بازار آنلاین پروژه‌ها و خدمات فریلنسری. ثبت پروژه رایگان، دریافت پیشنهاد از فریلنسرهای حرفه‌ای.",
    images: ["/og-image.png"],
  },

  // 🤖 Robots — همه چیز ایندکس شود (صفحات خصوصی خودشان noindex می‌گذارند)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // 🚫 از ایندکس شدن صفحات خاص جلوگیری
  // (اگر می‌خواهی به‌طور کلی جلوگیری کنی، این را استفاده کن)

  // 📊 Verification (اگر در Google Search Console / Bing / Yandex ثبت کردی)
  verification: {
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
    // yandex: "YOUR_YANDEX_CODE",
    // bing: "YOUR_BING_CODE",
  },

  // 📁 دسته‌بندی محتوا
  category: "business",
  classification: "Business, Freelancing, Jobs",

  // 📋 فرمت‌های مرتبط
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // 🔄 کنونیکال برای نسخه‌های قدیمی (اختیاری)
  // alternates: {
  //   canonical: "/",
  //   types: {
  //     "application/rss+xml": "/rss.xml",
  //   },
  // },
};

// ===================================================
// 🧩 JSON-LD (WebSite + Organization + SearchAction)
// ===================================================
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}#website`,
  url: BASE_URL,
  name: SITE_NAME,
  description:
    "بازار آنلاین پروژه‌ها و خدمات فریلنسری در ایران — ثبت پروژه رایگان و دریافت پیشنهاد از فریلنسرهای حرفه‌ای",
  inLanguage: "fa-IR",
  publisher: {
    "@id": `${BASE_URL}#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/explore?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}#organization`,
  name: SITE_NAME,
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/icons/icon-192.png`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/og-image.png`,
  description:
    "بازار آنلاین پروژه‌ها و خدمات فریلنسری در ایران — جایی که مهارت‌ها به فرصت تبدیل می‌شوند",
  sameAs: [
    // 🔑 اگر شبکه‌های اجتماعی داری، اینجا اضافه کن
    // "https://t.me/freelancerkar",
    "https://instagram.com/freelanceryaab",
    // "https://twitter.com/freelancerkar",
    // "https://linkedin.com/company/freelancerkar",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    url: `${BASE_URL}/contact`,
    availableLanguage: ["Persian", "fa"],
  },
};

// ===================================================
// 🏠 RootLayout
// ===================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="I-fNtr6rkwsbcswEE_9Fdy9kXnsSbIiSZ-DK9SeHiMs"
        />
        {/* 🎯 JSON-LD — WebSite + Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        {/* 🎨 Preconnect برای performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <UIProvider>
            <ClientLayout>{children}</ClientLayout>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
