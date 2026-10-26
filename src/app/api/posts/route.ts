// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 🔑 normalize از DB (بدون فایل constants)
async function normalizeCategoryFromDB(input?: string | null): Promise<string | null> {
  if (!input) return null;
  let cleaned: string;
  try {
    cleaned = decodeURIComponent(input).trim();
  } catch {
    cleaned = input.trim();
  }

  try {
    const rows = await query(
      `SELECT db_name, slug, name FROM categories
       WHERE slug = ? OR db_name = ? OR name = ?
       LIMIT 1`,
      [cleaned, cleaned, cleaned]
    );
    const found = (rows as any[])[0];
    return found ? found.db_name : cleaned;
  } catch (err) {
    console.error('normalizeCategoryFromDB error:', err);
    return cleaned;
  }
}

// -------------------------------------------------
// GET /api/posts
// -------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rawCategory = sp.get("category");
    const category = await normalizeCategoryFromDB(rawCategory);
    const search = sp.get("search")?.trim() || "";
    const sort = sp.get("sort") || "newest";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = ["p.status = 'active'"];
    const whereParams: any[] = [];

    if (category) {
      whereParts.push("p.category = ?");
      whereParams.push(category);
    }
    if (search) {
      whereParts.push("(p.title LIKE ? OR p.description LIKE ?)");
      whereParams.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = "WHERE " + whereParts.join(" AND ");

    let orderSQL = "ORDER BY p.created_at DESC";
    switch (sort) {
      case "price_asc":
      case "price-asc":
        orderSQL = "ORDER BY CAST(p.price AS UNSIGNED) ASC, p.created_at DESC";
        break;
      case "price_desc":
      case "price-desc":
        orderSQL = "ORDER BY CAST(p.price AS UNSIGNED) DESC, p.created_at DESC";
        break;
      case "most_viewed":
      case "most-viewed":
        orderSQL = "ORDER BY p.views DESC, p.created_at DESC";
        break;
    }

    const posts = await query(
      `SELECT p.*, u.full_name AS user_name, u.rating AS user_rating
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    const totalRows = await query(
      `SELECT COUNT(*) AS count FROM posts p ${whereSQL}`,
      whereParams,
    );
    const total = (totalRows as any[])[0]?.count || 0;

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "خطا در دریافت آگهی‌ها" }, { status: 500 });
  }
}

// -------------------------------------------------
// POST /api/posts
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [POST /api/posts] START");
    const body = await request.json();
    const {
      user_id, title, category, sub_category, price, price_type,
      description, skills, location, images, deadline,
    } = body;

    if (!user_id || !title || !category || !description) {
      return NextResponse.json({ error: "فیلدهای الزامی را پر کنید" }, { status: 400 });
    }

    const normalizedCategory = await normalizeCategoryFromDB(category);
    if (!normalizedCategory) {
      return NextResponse.json({ error: "دسته‌بندی نامعتبر است" }, { status: 400 });
    }

    // ۱. کلمات ممنوعه
    try {
      const bannedRows = await query(
        `SELECT \`value\` FROM settings WHERE \`key\` = 'banned_words' LIMIT 1`
      );
      const bannedWordsStr = (bannedRows as any[])[0]?.value || "";
      const bannedWords = bannedWordsStr
        .split(",")
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0);

      if (bannedWords.length > 0) {
        const textToCheck = `${title} ${description}`.toLowerCase();
        const foundWord = bannedWords.find((word: string) =>
          textToCheck.includes(word)
        );
        if (foundWord) {
          return NextResponse.json(
            { error: `آگهی شما شامل کلمه غیرمجاز «${foundWord}» است. لطفاً اصلاح کنید.` },
            { status: 400 }
          );
        }
      }
    } catch (settingsErr: any) {
      console.warn("Banned words check skipped:", settingsErr.message);
    }

    // ۲. حداکثر آگهی
    try {
      const maxPostsRows = await query(
        `SELECT \`value\` FROM settings WHERE \`key\` = 'max_posts_per_user' LIMIT 1`
      );
      const maxPosts = parseInt((maxPostsRows as any[])[0]?.value || "10");

      if (maxPosts > 0) {
     const userPostCountRows = await query(
  `SELECT COUNT(*) AS count FROM posts
   WHERE user_id = ?
     AND status IN ('active', 'pending', 'locked', 'in_progress', 'delivered')`,
  [user_id]
) as any[];
      const currentCount = Number(userPostCountRows[0]?.count || 0);
        if (currentCount >= maxPosts) {
          return NextResponse.json(
            { error: `شما به حداکثر تعداد آگهی مجاز (${maxPosts}) رسیده‌اید.` },
            { status: 400 }
          );
        }
      }
    } catch (settingsErr: any) {
      console.warn("Max posts check skipped:", settingsErr.message);
    }

    // ۳. حالت تأیید
    let initialStatus: string = "pending";
    try {
      const approvalRows = await query(
        `SELECT \`value\` FROM settings WHERE \`key\` = 'post_approval_mode' LIMIT 1`
      );
      const approvalMode = (approvalRows as any[])[0]?.value || "manual";
      initialStatus = approvalMode === "auto" ? "active" : "pending";
    } catch (settingsErr: any) {
      initialStatus = "pending";
    }

    const slug = `${title
      .replace(/[^آ-یa-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")}-${Date.now()}`;

    const result = await query(
      `INSERT INTO posts
        (user_id, title, slug, category, sub_category, price, price_type,
         description, skills, location, images, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title,
        slug,
        normalizedCategory,
        sub_category || null,
        price || null,
        price_type || "fixed",
        description,
        skills ? JSON.stringify(skills) : null,
        location || null,
        images ? JSON.stringify(images) : null,
        deadline || null,
        initialStatus,
      ],
    );

    const newPostId = (result as any).insertId;

    // اعلان به ادمین (فقط manual)
    if (initialStatus === "pending") {
      try {
        const admins = await query(
          `SELECT id FROM users WHERE role = 'admin' AND is_active = 1`
        );
        for (const admin of admins as any[]) {
          await query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, 'system', '📝 آگهی جدید در انتظار تأیید', ?, '/admin/posts?filter=pending')`,
            [admin.id, `آگهی «${title}» ثبت شد و منتظر تأیید است.`]
          );
        }
      } catch (notifErr: any) {
        console.error("Notification error:", notifErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        id: newPostId,
        status: initialStatus,
        needs_approval: initialStatus === "pending",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST error:", error);
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "آگهی مشابهی ثبت شده است، دوباره تلاش کنید" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "خطا در ثبت آگهی: " + error.message }, { status: 500 });
  }
}