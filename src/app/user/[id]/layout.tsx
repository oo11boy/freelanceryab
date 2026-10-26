// src/app/user/[id]/layout.tsx
import type { Metadata } from "next";
import { query } from "@/lib/db";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://freelancerkar.com";
const SITE_NAME = "فریلنسرکار";

// ===================================================
// 📊 گرفتن کاربر از DB
// ===================================================
async function getUser(id: number) {
  try {
    const rows = await query<any>(
      `SELECT
        u.id,
        u.full_name,
        u.avatar,
        u.bio,
        u.skills,
        u.experience,
        u.rating,
        u.completed_projects,
        u.created_at,
        u.role,
        u.is_active,
        (SELECT COUNT(*) FROM posts
         WHERE user_id = u.id AND status = 'active') AS active_posts_count,
        (SELECT COUNT(*) FROM reviews
         WHERE reviewee_id = u.id) AS reviews_count,
        (SELECT AVG(rating) FROM reviews
         WHERE reviewee_id = u.id) AS avg_rating
       FROM users u
       WHERE u.id = ? AND (u.is_active IS NULL OR u.is_active = 1)`,
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("getUser metadata failed:", err);
    return null;
  }
}

// ===================================================
// 🧹 پاکسازی متن
// ===================================================
function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/[\r\n\t]/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trim() + "...";
}

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter((s) => typeof s === "string");
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

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "تازه‌کار",
  intermediate: "متوسط",
  advanced: "پیشرفته",
  expert: "حرفه‌ای",
};

// ===================================================
// 🎯 عنوان بهینه
// ===================================================
function buildTitle(user: any): string {
  const name = cleanText(user.full_name) || "فریلنسر";
  const exp = user.experience
    ? EXPERIENCE_LABELS[user.experience] || user.experience
    : "";
  const skills = parseSkills(user.skills);
  const skillsShort = skills.slice(0, 2).join("، ");

  // قالب ۱: «{نام} — فریلنسر {مهارت‌ها}»
  if (skillsShort) {
    const title = `${name} — فریلنسر ${skillsShort}`;
    if (title.length <= 65) return title;
  }

  // قالب ۲: «{نام} — فریلنسر {سطح تجربه}»
  if (exp) {
    const title = `${name} — فریلنسر ${exp}`;
    if (title.length <= 65) return title;
  }

  // قالب ۳: ساده
  return `${name} | پروفایل فریلنسر`;
}

// ===================================================
// 📝 توضیحات بهینه
// ===================================================
function buildDescription(user: any): string {
  const name = cleanText(user.full_name) || "این فریلنسر";
  const bio = cleanText(user.bio);
  const skills = parseSkills(user.skills);
  const rating = Number(user.avg_rating) || Number(user.rating) || 0;
  const completed = Number(user.completed_projects) || 0;
  const reviews = Number(user.reviews_count) || 0;
  const activePosts = Number(user.active_posts_count) || 0;

  const parts: string[] = [];

  // اولویت ۱: bio
  if (bio.length >= 60) {
    parts.push(truncate(bio, 120));
  }

  // آمار
  const stats: string[] = [];
  if (completed > 0) stats.push(`${completed} پروژه موفق`);
  if (rating > 0) stats.push(`امتیاز ${rating.toFixed(1)} از ۵`);
  if (reviews > 0) stats.push(`${reviews} نظر`);
  if (activePosts > 0) stats.push(`${activePosts} آگهی فعال`);

  if (stats.length > 0 && parts.length === 0) {
    parts.push(`${name} — ${stats.join("، ")}`);
  }

  // مهارت‌ها
  if (skills.length > 0 && parts.join(" ").length < 120) {
    parts.push(`مهارت‌ها: ${skills.slice(0, 4).join("، ")}`);
  }

  // CTA
  parts.push("مشاهده پروفایل کامل و ارسال پیام در فریلنسرکار.");

  return truncate(parts.join(" — "), 158);
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
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return {
      title: "پروفایل یافت نشد",
      robots: { index: false, follow: false },
    };
  }

  const user = await getUser(userId);

  // کاربر پیدا نشد یا ادمین است (نباید ایندکس شود)
  if (!user || user.role === "admin") {
    return {
      title: "پروفایل یافت نشد",
      description: "این پروفایل در فریلنسرکار وجود ندارد.",
      robots: { index: false, follow: false },
    };
  }

  const title = buildTitle(user);
  const description = buildDescription(user);
  const skills = parseSkills(user.skills);

  const url = `${BASE_URL}/user/${user.id}`;
  const ogImage = user.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `${BASE_URL}${user.avatar}`
    : `${BASE_URL}/og-image.png`;

  const keywords = [
    cleanText(user.full_name),
    ...skills.slice(0, 5),
    user.experience ? EXPERIENCE_LABELS[user.experience] : "",
    "فریلنسر",
    "فریلنسرکار",
    "پروفایل فریلنسر",
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanText(user.full_name) || "پروفایل فریلنسر",
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
    authors: [{ name: cleanText(user.full_name) }],
    creator: cleanText(user.full_name) || SITE_NAME,
    publisher: SITE_NAME,
    other: {
      "profile:first_name": cleanText(user.full_name),
      "profile:username": String(user.id),
    },
  };
}

// ===================================================
// 📦 Layout — JSON-LD
// ===================================================
export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = parseInt(id);
  const user = !isNaN(userId) ? await getUser(userId) : null;

  // کاربر معتبر نیست یا ادمین است → JSON-LD نگذار
  if (!user || user.role === "admin") {
    return <>{children}</>;
  }

  const skills = parseSkills(user.skills);
  const rating = Number(user.avg_rating) || Number(user.rating) || 0;
  const reviewsCount = Number(user.reviews_count) || 0;
  const completed = Number(user.completed_projects) || 0;
  const url = `${BASE_URL}/user/${user.id}`;

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
        name: "فریلنسرها",
        item: `${BASE_URL}/top-freelancers`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cleanText(user.full_name) || "پروفایل",
        item: url,
      },
    ],
  };

  // 🎯 ProfilePage + Person + AggregateRating
  const profileJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profilepage`,
    url,
    name: `${cleanText(user.full_name)} | پروفایل فریلنسر`,
    inLanguage: "fa-IR",
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name: cleanText(user.full_name),
      url,
      image: user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${BASE_URL}${user.avatar}`
        : undefined,
      description: cleanText(user.bio).slice(0, 300) || undefined,
      jobTitle: user.experience
        ? EXPERIENCE_LABELS[user.experience] || user.experience
        : "فریلنسر",
      knowsAbout: skills.length > 0 ? skills : undefined,
      ...(completed > 0 && {
        hasOccupation: {
          "@type": "Occupation",
          name: "فریلنسر",
          occupationLocation: {
            "@type": "Country",
            name: "Iran",
          },
        },
      }),
    },
    ...(reviewsCount > 0 && rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount: reviewsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      {children}
    </>
  );
}