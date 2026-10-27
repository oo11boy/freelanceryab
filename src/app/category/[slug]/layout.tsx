// src/app/category/[slug]/layout.tsx
import type { Metadata } from "next";
import { query } from "@/lib/db";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://freelancerkar.com";
const SITE_NAME = "فریلنسریاب";

// ===================================================
// 📊 گرفتن دسته از DB
// ===================================================
async function getCategory(slug: string) {
  try {
    const rows = await query<any>(
      `SELECT * FROM categories WHERE slug = ? LIMIT 1`,
      [slug],
    );
    return rows[0] || null;
  } catch (err) {
    console.error("getCategory metadata failed:", err);
    return null;
  }
}

// ===================================================
// 📊 گرفتن تعداد آگهی‌های فعال این دسته
// ===================================================
async function getActivePostCount(dbName: string): Promise<number> {
  try {
    const rows = await query<{ c: number }>(
      `SELECT COUNT(*) as c FROM posts
       WHERE category = ? AND status = 'active'`,
      [dbName],
    );
    return Number(rows[0]?.c || 0);
  } catch {
    return 0;
  }
}

// ===================================================
// 🧩 استخراج زیردسته‌ها
// ===================================================
function extractSubs(cat: any): string[] {
  if (!cat) return [];
  const candidates = [cat.subs, cat.sub, cat.subcategories, cat.sub_category];

  for (const raw of candidates) {
    if (!raw) continue;

    if (Array.isArray(raw)) {
      return raw.filter((s) => typeof s === "string" && s.trim());
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.filter((s) => typeof s === "string" && s.trim());
          }
        } catch {}
      }

      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  return [];
}

// ===================================================
// 🎯 عنوان‌های بهینه بر اساس آخرین اصول سئو
// ===================================================
function buildTitle(name: string, postCount: number, subs: string[]): string {
  // قالب ۱: با تعداد آگهی (اگر >= 3)
  if (postCount >= 3) {
    // «{تعداد} پروژه {دسته} | استخدام فریلنسر {دسته} — فریلنسریاب»
    const title = `${postCount} پروژه ${name} | استخدام فریلنسر ${name} | فریلنسریاب`;
    // اگر خیلی بلند شد، کوتاه کن
    if (title.length <= 65) return title;
  }

  // قالب ۲: بدون تعداد (اگر آگهی کم بود)
  // «پروژه‌های {دسته} | استخدام فریلنسر {دسته} — فریلنسریاب»
  const title = `پروژه‌های ${name} | استخدام فریلنسر ${name} | فریلنسریاب`;
  if (title.length <= 65) return title;

  // قالب ۳: خیلی کوتاه
  return `پروژه‌های ${name} | فریلنسریاب`;
}

// ===================================================
// 📝 توضیحات بهینه بر اساس آخرین اصول سئو
// ===================================================
function buildDescription(
  name: string,
  dbDescription: string | null | undefined,
  postCount: number,
  subs: string[],
): string {
  // اولویت ۱: توضیحات دسته از DB (اگر موجود و کافی)
  if (dbDescription && dbDescription.trim().length >= 80) {
    let desc = dbDescription.trim();
    if (desc.length > 158) desc = desc.slice(0, 155) + "...";
    return desc;
  }

  // اولویت ۲: توضیحات با تعداد + زیردسته + CTA
  if (postCount >= 3 && subs.length > 0) {
    const subsList = subs.slice(0, 3).join("، ");
    const desc = `${postCount} پروژه فعال ${name} در فریلنسریاب — شامل ${subsList}. همین حالا پروژه مناسب خودت رو پیدا کن و درآمدت رو شروع کن.`;
    return desc.length <= 158 ? desc : desc.slice(0, 155) + "...";
  }

  // اولویت ۳: توضیحات با تعداد + CTA
  if (postCount >= 3) {
    return `${postCount} پروژه فعال ${name} در فریلنسریاب — همین حالا پروژه مناسب خودت رو پیدا کن و کار حرفه‌ای‌ات رو شروع کن. ثبت‌نام رایگان.`;
  }

  // اولویت ۴: توضیحات با زیردسته
  if (subs.length > 0) {
    const subsList = subs.slice(0, 3).join("، ");
    return `پروژه‌های ${name} در فریلنسریاب — شامل ${subsList}. لیست کامل آگهی‌های فعال را ببین و با کارفرمایان مستقیم ارتباط بگیر.`;
  }

  // fallback
  return `پروژه‌های ${name} در فریلنسریاب — مشاهده لیست آگهی‌های فعال و ارتباط مستقیم با کارفرمایان. ثبت‌نام رایگان و ارسال پیشنهاد در چند دقیقه.`;
}

// ===================================================
// 📝 generateMetadata
// ===================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "دسته‌بندی یافت نشد | فریلنسریاب",
      robots: { index: false, follow: false },
    };
  }

  const name = category.name || "دسته‌بندی";
  const subs = extractSubs(category);
  const postCount = await getActivePostCount(category.db_name || "");

  const title = buildTitle(name, postCount, subs);
  const description = buildDescription(
    name,
    category.description,
    postCount,
    subs,
  );

  // 🎯 کلمات کلیدی ثانویه (بدون stuffing)
  const keywords = [
    `پروژه ${name}`,
    `استخدام فریلنسر ${name}`,
    `فریلنسر ${name}`,
    `آگهی ${name}`,
    `کار ${name}`,
    ...subs.slice(0, 3).map((s) => `${s}`),
    "فریلنسریاب",
    "پروژه آنلاین",
    "کار آنلاین",
  ];

  const url = `${BASE_URL}/category/${category.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `پروژه‌های ${name} در فریلنسریاب`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
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
    // 🎯 سیگنال‌های اضافی سئو
    authors: [{ name: SITE_NAME, url: BASE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: name,
    classification: "Business",
    other: {
      // 🎯 برای بعضی موتورهای جستجو
      "article:section": name,
    },
  };
}

// ===================================================
// 📦 Layout — JSON-LD
// ===================================================
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  const breadcrumbJsonLd = category
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "خانه",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "پروژه‌ها",
            item: `${BASE_URL}/explore`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: `${BASE_URL}/category/${category.slug}`,
          },
        ],
      }
    : null;

  // 🎯 CollectionPage + OfferCatalog (بهترین ساختار برای لیست پروژه‌ها)
  const collectionJsonLd = category
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${BASE_URL}/category/${category.slug}#collection`,
        url: `${BASE_URL}/category/${category.slug}`,
        name: `پروژه‌های ${category.name}`,
        description:
          category.description ||
          `لیست پروژه‌ها و آگهی‌های فعال در حوزه ${category.name} در فریلنسریاب`,
        inLanguage: "fa-IR",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${BASE_URL}#website`,
          name: SITE_NAME,
          url: BASE_URL,
        },
        about: {
          "@type": "Thing",
          name: category.name,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: 0, // اگر خواستی می‌توانی با postCount پر کنی
          itemListOrder: "https://schema.org/ItemListOrderDescending",
        },
      }
    : null;

  return (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />
      )}
      {collectionJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionJsonLd),
          }}
        />
      )}
      {children}
    </>
  );
}
