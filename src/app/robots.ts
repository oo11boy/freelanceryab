// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freelanceryaab.ir';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // صفحات محافظت‌شده
          '/admin',
          '/admin/',
          '/admin/*',
          '/profile',
          '/profile/',
          '/profile/*',
          '/messages',
          '/messages/',
          '/messages/*',
          '/notifications',
          '/notifications/',
          '/create-post',
          '/register',
          '/register/',
          '/register/*',
          '/login',

          // API
          '/api/',
          '/api/*',

          // پارامترهای URL
          '/*?tab=',
          '/*?sort=',
          '/*?q=',
          '/*?post=',
          '/*?user=',

          // فایل‌های سیستمی
          '/_next/',
          '/static/',
        ],
      },
      {
        // ربات‌های خاص — کل دسترسی ممنوع
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'Google-Extended'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}