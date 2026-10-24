// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeCategory } from "@/app/constants/categories";

// -------------------------------------------------
// GET /api/posts
// -------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    // 🔑 نرمال‌سازی category (هر ورودی → مقدار دیتابیس)
    const rawCategory = sp.get("category");
    const category = normalizeCategory(rawCategory);

    const search = sp.get("search")?.trim() || "";
    const sort = sp.get("sort") || "newest";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // --- شرط‌های WHERE مشترک ---
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

    // --- ORDER BY (با پشتیبانی از هر دو فرمت) ---
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
      case "newest":
      default:
        orderSQL = "ORDER BY p.created_at DESC";
    }

    // --- کوئری اصلی ---
    const posts = await query(
      `SELECT p.*, u.full_name AS user_name, u.rating AS user_rating
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    // --- شمارش کل با همان فیلترها ---
    const totalRows = await query(
      `SELECT COUNT(*) AS count FROM posts p ${whereSQL}`,
      whereParams,
    );
    const total = (totalRows as any[])[0]?.count || 0;

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت آگهی‌ها" },
      { status: 500 },
    );
  }
}

// -------------------------------------------------
// POST /api/posts
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      category,
      sub_category,
      price,
      price_type,
      description,
      skills,
      location,
      images,
      deadline,
    } = body;

    if (!user_id || !title || !category || !description) {
      return NextResponse.json(
        { error: "فیلدهای الزامی را پر کنید" },
        { status: 400 },
      );
    }

    // 🔑 نرمال‌سازی category قبل از ذخیره
    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      return NextResponse.json(
        { error: "دسته‌بندی نامعتبر است" },
        { status: 400 },
      );
    }

    // تولید slug یکتا (چون UNIQUE KEY است)
    const slug = `${title
      .replace(/[^آ-یa-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")}-${Date.now()}`;

    const result = await query(
      `INSERT INTO posts
        (user_id, title, slug, category, sub_category, price, price_type,
         description, skills, location, images, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        title,
        slug,
        normalizedCategory,             // ✅ مقدار دیتابیس
        sub_category || null,
        price || null,
        price_type || "fixed",
        description,
        skills ? JSON.stringify(skills) : null,   // json_valid → stringify لازم است
        location || null,
        images ? JSON.stringify(images) : null,
        deadline || null,
      ],
    );

    return NextResponse.json(
      { success: true, id: (result as any).insertId },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create post error:", error);
    // اگر slug تکراری بود
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "آگهی مشابهی ثبت شده است، دوباره تلاش کنید" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "خطا در ثبت آگهی" }, { status: 500 });
  }
}