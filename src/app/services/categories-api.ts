// app/services/categories-api.ts
'use client';

let cachedCategories: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

export async function fetchCategories(force = false): Promise<any[]> {
  if (!force && cachedCategories && Date.now() - cacheTime < CACHE_TTL) {
    return cachedCategories;
  }

  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('خطا');
    const data = await res.json();
    cachedCategories = data.categories || [];
    cacheTime = Date.now();
    return cachedCategories!;
  } catch (error) {
    console.error('fetchCategories error:', error);
    return cachedCategories || [];
  }
}

export function clearCategoriesCache() {
  cachedCategories = null;
  cacheTime = 0;
}