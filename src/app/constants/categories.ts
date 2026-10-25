// app/constants/categories.ts

export interface Category {
  id: number;
  slug: string;          // برای URL
  name: string;          // برای نمایش
  dbName: string;        // 🔑 دقیقاً همان مقداری که در ستون category ذخیره شده
  icon: string;
  color: string;
  sub: string[];
  description?: string;  // توضیح کوتاه برای صفحه دسته‌بندی
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    slug: "programming",
    name: "برنامه‌نویسی",
    dbName: "برنامه‌نویسی و وب",
    icon: "💻",
    color: "blue",
    description: "توسعه وب، اپلیکیشن و بک‌اند",
    sub: [
      "React",
      "Next.js",
      "Vue.js",
      "Python",
      "Django",
      "Node.js",
      "Express",
      "PHP",
      "Laravel",
      "وردپرس",
      "جاوا",
      "موبایل",
      "Flutter",
      "React Native",
      "دیتابیس",
      "API",
    ],
  },
  {
    id: 2,
    slug: "research",
    name: "تحقیق درسی",
    dbName: "تحقیق و مقاله",
    icon: "📚",
    color: "green",
    description: "تحقیق، مقاله، پایان‌نامه و پروژه‌های دانشجویی",
    sub: [
      "تحقیق درسی",
      "مقاله علمی",
      "پایان‌نامه",
      "پروپوزال",
      "پروژه دانشجویی",
      "تحلیل داده",
      "آمار",
      "ویرایش علمی",
    ],
  },
  {
    id: 3,
    slug: "translation",
    name: "ترجمه",
    dbName: "ترجمه",
    icon: "🌍",
    color: "purple",
    description: "ترجمه متون، اسناد و زیرنویس",
    sub: [
      "ترجمه متون",
      "ترجمه تخصصی",
      "ترجمه کتاب",
      "ترجمه مقاله",
      "زیرنویس",
      "دوبله",
      "ترجمه همزمان",
    ],
  },
  {
    id: 4,
    slug: "design",
    name: "طراحی",
    dbName: "طراحی و گرافیک",
    icon: "🎨",
    color: "pink",
    description: "طراحی گرافیک، وب و لوگو",
    sub: [
      "لوگو",
      "طراحی سایت",
      "UI/UX",
      "بنر و پوستر",
      "کارت ویزیت",
      "موشن گرافیک",
      "ویرایش عکس",
      "تصویرسازی",
      "اینفوگرافیک",
    ],
  },
  {
    id: 5,
    slug: "teaching",
    name: "تدریس",
    dbName: "تدریس و آموزش",
    icon: "🎓",
    color: "yellow",
    description: "تدریس خصوصی و آموزش آنلاین",
    sub: [
      "ریاضی",
      "فیزیک",
      "شیمی",
      "برنامه‌نویسی",
      "زبان انگلیسی",
      "آیلتس",
      "تولید محتوا",
      "موسیقی",
      "هنر",
    ],
  },
  {
    id: 6,
    slug: "consulting",
    name: "مشاوره",
    dbName: "مشاوره و کسب‌وکار",
    icon: "💼",
    color: "indigo",
    description: "مشاوره کسب‌وکار، بازاریابی و برندینگ",
    sub: [
      "بازاریابی",
      "دیجیتال مارکتینگ",
      "برندینگ",
      "استارتاپ",
      "سئو",
      "شبکه‌های اجتماعی",
      "مدیریت پروژه",
      "مالی و حسابداری",
    ],
  },
  {
    id: 7,
    slug: "content",
    name: "تولید محتوا",
    dbName: "تولید محتوا",
    icon: "✍️",
    color: "orange",
    description: "نوشتن مقاله، کپی‌رایتینگ و محتوای شبکه‌های اجتماعی",
    sub: [
      "مقاله نویسی",
      "کپی‌رایتینگ",
      "محتوای شبکه‌های اجتماعی",
      "ویراستاری",
      "سناریو نویسی",
      "سئو محتوا",
    ],
  },
  {
    id: 8,
    slug: "video",
    name: "ویدیو و صدا",
    dbName: "ویدیو و صدا",
    icon: "🎬",
    color: "red",
    description: "تدوین ویدیو، صداگذاری و تولید محتوای تصویری",
    sub: [
      "تدوین ویدیو",
      "صداگذاری",
      "دوبله",
      "پادکست",
      "تیزر تبلیغاتی",
      "موشن گرافیک",
      "فیلمنامه",
    ],
  },
];

// ------- توابع کمکی -------

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

export const getCategoryByDbName = (dbName: string): Category | undefined =>
  CATEGORIES.find((c) => c.dbName === dbName);

export const getCategoryByName = (name: string): Category | undefined =>
  CATEGORIES.find((c) => c.name === name);

export const getCategoryById = (id: number): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

/**
 * هر ورودی (slug | name | dbName) را به مقدار استاندارد دیتابیس تبدیل می‌کند.
 * هم در فرانت و هم در بک‌اند استفاده شود.
 */
export function normalizeCategory(input?: string | null): string | null {
  if (!input) return null;
  let cleaned: string;
  try {
    cleaned = decodeURIComponent(input).trim();
  } catch {
    cleaned = input.trim();
  }
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

/** آیکون برای یک dbName */
export function categoryIcon(dbName?: string | null): string {
  if (!dbName) return "📁";
  const cat = getCategoryByDbName(dbName) || getCategoryBySlug(dbName);
  return cat?.icon || "📁";
}

/** رنگ Tailwind برای یک dbName */
export function categoryColor(dbName?: string | null): string {
  if (!dbName) return "gray";
  const cat = getCategoryByDbName(dbName) || getCategoryBySlug(dbName);
  return cat?.color || "gray";
}

/** آیا ورودی یک دسته‌بندی معتبر است؟ */
export function isValidCategory(input?: string | null): boolean {
  if (!input) return false;
  const cleaned = input.trim();
  return !!(
    getCategoryBySlug(cleaned) ||
    getCategoryByDbName(cleaned) ||
    getCategoryByName(cleaned)
  );
}

/** لیست همه زیردسته‌ها (برای جستجو/فیلتر) */
export function getAllSubcategories(): { name: string; category: Category }[] {
  return CATEGORIES.flatMap((cat) =>
    cat.sub.map((sub) => ({ name: sub, category: cat }))
  );
}

/** پیدا کردن دسته‌بندی بر اساس زیردسته */
export function getCategoryBySubcategory(
  subName: string
): Category | undefined {
  return CATEGORIES.find((cat) => cat.sub.includes(subName));
}

/** لیست ساده { slug, name, icon } برای منوها/فیلترها */
export const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c.dbName,
  slug: c.slug,
  label: c.name,
  icon: c.icon,
  color: c.color,
}));

/** نقشه slug → dbName (برای استفاده سریع) */
export const SLUG_TO_DBNAME: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.dbName])
);

/** نقشه dbName → slug (برای ساخت URL) */
export const DBNAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.dbName, c.slug])
);

/** ساخت URL دسته‌بندی از dbName */
export function categoryUrl(dbName?: string | null): string {
  if (!dbName) return "/explore";
  const slug = DBNAME_TO_SLUG[dbName];
  return slug ? `/category/${slug}` : `/explore?category=${encodeURIComponent(dbName)}`;
}