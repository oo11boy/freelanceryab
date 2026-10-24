// app/constants/categories.ts

export interface Category {
  id: number;
  slug: string;        // برای URL
  name: string;        // برای نمایش
  dbName: string;      // 🔑 دقیقاً همان مقداری که در ستون category ذخیره شده
  icon: string;
  color: string;
  sub: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    slug: "programming",
    name: "برنامه‌نویسی",
    dbName: "برنامه‌نویسی و وب",       // ← مطابق دیتابیس فعلی
    icon: "💻",
    color: "blue",
    sub: ["React", "Next.js", "Python", "Node.js", "PHP", "جاوا", "موبایل"],
  },
  {
    id: 2,
    slug: "research",
    name: "تحقیق درسی",
    dbName: "تحقیق و مقاله",
    icon: "📚",
    color: "green",
    sub: ["تحقیق درسی", "مقاله علمی", "پایان‌نامه", "ترجمه تخصصی"],
  },
  {
    id: 3,
    slug: "translation",
    name: "ترجمه",
    dbName: "ترجمه",
    icon: "🌍",
    color: "purple",
    sub: ["ترجمه متون", "ترجمه تخصصی", "زیرنویس"],
  },
  {
    id: 4,
    slug: "design",
    name: "طراحی",
    dbName: "طراحی و گرافیک",
    icon: "🎨",
    color: "pink",
    sub: ["لوگو", "طراحی سایت", "موشن گرافیک", "ویرایش عکس"],
  },
  {
    id: 5,
    slug: "teaching",
    name: "تدریس",
    dbName: "تدریس و آموزش",
    icon: "🎓",
    color: "yellow",
    sub: ["ریاضی", "برنامه‌نویسی", "زبان انگلیسی", "آیلتس"],
  },
  {
    id: 6,
    slug: "consulting",
    name: "مشاوره",
    dbName: "مشاوره و کسب‌وکار",
    icon: "💼",
    color: "indigo",
    sub: ["بازاریابی", "برندینگ", "استارتاپ", "سئو"],
  },
];

// ------- توابع کمکی -------

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);

export const getCategoryByDbName = (dbName: string) =>
  CATEGORIES.find((c) => c.dbName === dbName);

export const getCategoryByName = (name: string) =>
  CATEGORIES.find((c) => c.name === name);

/**
 * هر ورودی (slug | name | dbName) را به مقدار استاندارد دیتابیس تبدیل می‌کند.
 * هم در فرانت و هم در بک‌اند استفاده شود.
 */
export function normalizeCategory(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = decodeURIComponent(input).trim();
  const found =
    getCategoryBySlug(cleaned) ||
    getCategoryByDbName(cleaned) ||
    getCategoryByName(cleaned);
  return found ? found.dbName : cleaned;
}

/** برچسب نمایشی خوانا برای یک dbName */
export function categoryLabel(dbName?: string | null): string {
  if (!dbName) return "";
  const cat = getCategoryByDbName(dbName) || getCategoryBySlug(dbName);
  return cat?.name || dbName;
}