// src/app/post/[id]/layout.tsx
import type { Metadata } from "next";
import { query } from "@/lib/db";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://freelancerkar.com";
const SITE_NAME = "فریلنسریاب";

// ===================================================
// 📊 گرفتن آگهی + مالک از DB
// ===================================================
async function getPost(id: number) {
  try {
    const rows = await query<any>(
      `SELECT
        p.*,
        u.full_name AS user_name
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id],
    );
    return rows[0] || null;
  } catch (err) {
    console.error("getPost metadata failed:", err);
    return null;
  }
}

// ===================================================
// 🧹 پاکسازی متن برای استفاده در متادیتا
// ===================================================
function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trim() + "...";
}

function formatPrice(price: string | null, priceType: string | null): string {
  if (!price || priceType === "contact") return "توافقی";
  const num = Number(price);
  if (isNaN(num)) return "توافقی";
  if (priceType === "hourly") {
    return `${num.toLocaleString("fa-IR")} تومان در ساعت`;
  }
  return `${num.toLocaleString("fa-IR")} تومان`;
}

// ===================================================
// 🎯 عنوان بهینه
// ===================================================
function buildTitle(post: any): string {
  const title = cleanText(post.title) || "آگهی";
  const price = formatPrice(post.price, post.price_type);

  // اگر عنوان + قیمت در ۶۵ کاراکتر جا شد
  const withPrice = `${title} — ${price} | فریلنسریاب`;
  if (withPrice.length <= 65) return withPrice;

  // اگر عنوان + دسته
  const withCategory = `${title} | پروژه ${post.category || ""} | فریلنسریاب`;
  if (withCategory.length <= 65) return withCategory;

  // فقط عنوان
  return `${title} | فریلنسریاب`;
}

// ===================================================
// 📝 توضیحات بهینه
// ===================================================
function buildDescription(post: any): string {
  const desc = cleanText(post.description);

  if (desc.length >= 80) {
    return truncate(desc, 158);
  }

  // ترکیب توضیحات + اطلاعات تکمیلی
  const parts: string[] = [];
  if (desc) parts.push(desc);

  const price = formatPrice(post.price, post.price_type);
  parts.push(`قیمت: ${price}`);

  if (post.location) parts.push(`موقعیت: ${post.location}`);

  const skills = parseSkills(post.skills);
  if (skills.length > 0) {
    parts.push(`مهارت‌ها: ${skills.slice(0, 3).join("، ")}`);
  }

  parts.push("همین حالا در فریلنسریاب ببینید و پیشنهاد ارسال کنید.");

  return truncate(parts.join(" — "), 158);
}

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseImages(images: any): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ===================================================
// 📝 generateMetadata
// ===================================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = parseInt(id);

  // id نامعتبر
  if (isNaN(postId)) {
    return {
      title: "آگهی یافت نشد | فریلنسریاب",
      robots: { index: false, follow: false },
    };
  }

  const post = await getPost(postId);

  // آگهی پیدا نشد یا غیرفعال
  if (
    !post ||
    !["active", "locked", "in_progress", "delivered", "completed"].includes(
      post.status,
    )
  ) {
    return {
      title: "آگهی یافت نشد | فریلنسریاب",
      description: "این آگهی در فریلنسریاب وجود ندارد یا حذف شده است.",
      robots: { index: false, follow: false },
    };
  }

  const title = buildTitle(post);
  const description = buildDescription(post);
  const skills = parseSkills(post.skills);
  const images = parseImages(post.images);
  const url = `${BASE_URL}/post/${post.id}`;

  // 🖼️ تصویر OG (اگر آگهی تصویر دارد)
  const ogImage = images.length > 0 ? images[0] : `${BASE_URL}/og-image.png`;

  // 🎯 کلمات کلیدی
  const keywords = [
    cleanText(post.title),
    post.category,
    post.sub_category,
    ...skills.slice(0, 5),
    post.location,
    "فریلنسریاب",
    "پروژه آنلاین",
  ].filter(Boolean) as string[];

  // 🚫 اگر آگهی غیرفعال است، noindex
  const isActive = post.status === "active" || post.status === "completed";
  const shouldIndex = isActive;

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
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanText(post.title),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    authors: post.user_name
      ? [{ name: post.user_name }]
      : [{ name: SITE_NAME, url: BASE_URL }],
    creator: post.user_name || SITE_NAME,
    publisher: SITE_NAME,
    category: post.category || undefined,
    other: {
      "article:published_time": post.created_at || "",
      "article:section": post.category || "",
    },
  };
}

// ===================================================
// 📦 Layout — JSON-LD
// ===================================================
export default async function PostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id);
  const post = !isNaN(postId) ? await getPost(postId) : null;

  // اگر آگهی معتبر نیست، هیچ JSON-LD نمی‌گذاریم
  if (
    !post ||
    !["active", "locked", "in_progress", "delivered", "completed"].includes(
      post.status,
    )
  ) {
    return <>{children}</>;
  }

  const skills = parseSkills(post.skills);
  const images = parseImages(post.images);
  const price = Number(post.price) || 0;
  const url = `${BASE_URL}/post/${post.id}`;

  // 🎯 BreadcrumbList
  const breadcrumbJsonLd = {
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
        name: "جستجوی پروژه",
        item: `${BASE_URL}/explore`,
      },
      ...(post.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: post.category,
              item: `${BASE_URL}/explore?category=${encodeURIComponent(
                post.category,
              )}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: post.category ? 4 : 3,
        name: cleanText(post.title),
        item: url,
      },
    ],
  };

  // 🎯 Product + Offer (بهترین ساختار برای آگهی/پروژه)
  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: cleanText(post.title),
    description: cleanText(post.description).slice(0, 500),
    url,
    sku: String(post.id),
    category: post.category || undefined,
    ...(images.length > 0 && {
      image: images.map((img) =>
        img.startsWith("http") ? img : `${BASE_URL}${img}`,
      ),
    }),
    ...(skills.length > 0 && {
      keywords: skills.join(", "),
    }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      price: price > 0 ? price : 0,
      priceValidUntil: post.deadline || undefined,
      availability:
        post.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Person",
        name: post.user_name || "کاربر فریلنسریاب",
        url: `${BASE_URL}/user/${post.user_id}`,
      },
    },
    ...(post.user_name && {
      brand: {
        "@type": "Brand",
        name: SITE_NAME,
      },
    }),
  };

  // 🎯 اگر قیمت توافقی است، Offer را با price=0 بگذار
  if (post.price_type === "contact" || price === 0) {
    productJsonLd.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "IRR",
      price: 0,
      availability:
        post.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Person",
        name: post.user_name || "کاربر فریلنسریاب",
        url: `${BASE_URL}/user/${post.user_id}`,
      },
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {children}
    </>
  );
}
