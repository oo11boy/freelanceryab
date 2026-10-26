// app/hooks/useCategories.ts
'use client';
import { useState, useEffect } from 'react';

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  is_active: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  db_name: string;
  icon: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  sub: string[];
  subcategories: Subcategory[];
}

// 🔑 کش ساده
let cached: Category[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

export async function fetchCategories(force = false): Promise<Category[]> {
  if (!force && cached && Date.now() - cacheTime < CACHE_TTL) {
    return cached;
  }

  try {
    const res = await fetch('/api/categories', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    cached = data.categories || [];
    cacheTime = Date.now();
    return cached!;
  } catch (error) {
    console.error('fetchCategories error:', error);
    return cached || [];
  }
}

export function clearCategoriesCache() {
  cached = null;
  cacheTime = 0;
}

// 🔑 هوک
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchCategories();
      if (mounted) {
        setCategories(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { categories, loading };
}

// -------------------------------------------------
// Helper functions (با categories به‌عنوان پارامتر)
// -------------------------------------------------

export function getCategoryBySlug(
  categories: Category[],
  slug: string
): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryByDbName(
  categories: Category[],
  dbName: string
): Category | undefined {
  return categories.find((c) => c.db_name === dbName);
}

export function getCategoryByName(
  categories: Category[],
  name: string
): Category | undefined {
  return categories.find((c) => c.name === name);
}

export function getCategoryById(
  categories: Category[],
  id: number
): Category | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * هر ورودی (slug | name | db_name) → مقدار استاندارد دیتابیس
 */
export function normalizeCategory(
  categories: Category[],
  input?: string | null
): string | null {
  if (!input) return null;
  let cleaned: string;
  try {
    cleaned = decodeURIComponent(input).trim();
  } catch {
    cleaned = input.trim();
  }
  const found =
    getCategoryBySlug(categories, cleaned) ||
    getCategoryByDbName(categories, cleaned) ||
    getCategoryByName(categories, cleaned);
  return found ? found.db_name : cleaned;
}

export function categoryLabel(
  categories: Category[],
  dbName?: string | null
): string {
  if (!dbName) return '';
  const cat =
    getCategoryByDbName(categories, dbName) ||
    getCategoryBySlug(categories, dbName);
  return cat?.name || dbName;
}

export function categoryIcon(
  categories: Category[],
  dbName?: string | null
): string {
  if (!dbName) return '📁';
  const cat =
    getCategoryByDbName(categories, dbName) ||
    getCategoryBySlug(categories, dbName);
  return cat?.icon || '📁';
}

export function categoryColor(
  categories: Category[],
  dbName?: string | null
): string {
  if (!dbName) return 'gray';
  const cat =
    getCategoryByDbName(categories, dbName) ||
    getCategoryBySlug(categories, dbName);
  return cat?.color || 'gray';
}

/**
 * 🔑 ساخت URL از slug (نه db_name)
 */
export function categoryUrl(categories: Category[], dbName?: string | null): string {
  if (!dbName) return '/explore';
  const cat = getCategoryByDbName(categories, dbName);
  return cat ? `/category/${cat.slug}` : `/explore?category=${encodeURIComponent(dbName)}`;
}

/**
 * 🔑 نسخه سریع بدون DB برای سمت سرور
 * (فقط slug رو از db_name استخراج می‌کنه — fallback)
 */
export function categoryUrlSimple(dbName?: string | null): string {
  if (!dbName) return '/explore';
  return `/explore?category=${encodeURIComponent(dbName)}`;
}