// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { query } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://freelanceryaab.ir';

  // ===== صفحات ثابت =====
  const basePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ];

  // ===== آگهی‌های فعال =====
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await query<{ id: number; created_at: string }>(
      `SELECT id, created_at FROM posts 
       WHERE status = 'active' 
       ORDER BY created_at DESC 
       LIMIT 500`
    );
    postPages = posts.map((p) => ({
      url: `${baseUrl}/post/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.error('sitemap: posts query failed', err);
  }

  // ===== دسته‌بندی‌ها =====
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await query<{ slug: string }>(
      `SELECT slug FROM categories`
    );
    categoryPages = categories.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (err) {
    console.error('sitemap: categories query failed', err);
  }

  // ===== پروفایل کاربران عمومی =====
  // 🔑 ستون is_public وجود ندارد — از role استفاده کن
  let userPages: MetadataRoute.Sitemap = [];
  try {
    const users = await query<{ id: number; created_at: string }>(
      `SELECT id, created_at FROM users 
       WHERE (role IS NULL OR role != 'admin')
         AND (is_active IS NULL OR is_active = 1)
       ORDER BY created_at DESC 
       LIMIT 500`
    );
    userPages = users.map((u) => ({
      url: `${baseUrl}/user/${u.id}`,
      lastModified: new Date(u.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (err) {
    console.error('sitemap: users query failed', err);
  }

  return [...basePages, ...postPages, ...categoryPages, ...userPages];
}