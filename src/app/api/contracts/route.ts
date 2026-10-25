// app/api/contracts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUserIdFromToken(request: NextRequest): number | null {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

// -------------------------------------------------
// GET /api/contracts?postId=9&otherUserId=4
// -------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const postId = parseInt(sp.get("postId") || "0");
    const otherUserId = parseInt(sp.get("otherUserId") || "0");

    if (!postId || !otherUserId) {
      return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    }

    // 🔑 صاحب آگهی رو بگیر (مستقل از قرارداد)
    const posts = await query(`SELECT user_id FROM posts WHERE id = ?`, [postId]);
    const postOwnerId = (posts as any[])[0]?.user_id || null;

    // قرارداد (اگه وجود داره)
    const contracts = await query(
      `SELECT c.*,
              r.rating  AS my_rating,
              r.comment AS my_comment
       FROM contracts c
       LEFT JOIN reviews r
         ON r.contract_id = c.id AND r.reviewer_id = ?
       WHERE c.post_id = ?
         AND ((c.client_id = ? AND c.freelancer_id = ?)
           OR (c.client_id = ? AND c.freelancer_id = ?))
       LIMIT 1`,
      [userId, postId, userId, otherUserId, otherUserId, userId]
    );

    const contract = (contracts as any[])[0] || null;

    // 🔑 تشخیص نقش (به‌ترتیب اولویت):
    let role: "client" | "freelancer" | null = null;

    // ۱. اول از روی قرارداد (قطعی‌ترین)
    if (contract) {
      if (contract.client_id === userId) role = "client";
      else if (contract.freelancer_id === userId) role = "freelancer";
    }

    // ۲. اگه قرارداد نبود، از روی صاحب آگهی
    if (!role && postOwnerId) {
      if (postOwnerId === userId) {
        // من صاحب آگهیم → کارفرما
        role = "client";
      } else if (postOwnerId === otherUserId) {
        // طرف مقابل صاحب آگهیه → من فریلنسرم
        role = "freelancer";
      } else if (otherUserId !== userId) {
        // هیچ‌کدوم صاحب آگهی نیستن (حالت غیرعادی)
        // ولی چون در چت هستیم، فرض می‌کنیم کاربر جاری فریلنسره
        // (چون طرف مقابل صاحب آگهی نیست ولی در چت آگهی هست)
        role = "freelancer";
      }
    }

    // امتیاز طرف مقابل (اگه قرارداد completed هست)
    let otherReview = null;
    if (contract && contract.status === "completed") {
      const revieweeId =
        contract.client_id === userId
          ? contract.freelancer_id
          : contract.client_id;
      const reviews = await query(
        `SELECT rating, comment, created_at
         FROM reviews
         WHERE contract_id = ? AND reviewer_id = ?`,
        [contract.id, revieweeId]
      );
      otherReview = (reviews as any[])[0] || null;
    }

    return NextResponse.json({
      contract,
      myReview: contract?.my_rating
        ? { rating: contract.my_rating, comment: contract.my_comment }
        : null,
      otherReview,
      postOwnerId,
      role,
    });
  } catch (error) {
    console.error("Get contract error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت قرارداد" },
      { status: 500 }
    );
  }
}

// -------------------------------------------------
// POST /api/contracts — شروع پروژه توسط کارفرما
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, freelancerId } = body;

    if (!postId || !freelancerId) {
      return NextResponse.json({ error: "اطلاعات ناقص" }, { status: 400 });
    }

    // آگهی باید مال کاربر باشه
    const posts = await query(`SELECT id, user_id FROM posts WHERE id = ?`, [
      postId,
    ]);
    const post = (posts as any[])[0];
    if (!post) {
      return NextResponse.json({ error: "آگهی یافت نشد" }, { status: 404 });
    }
    if (post.user_id !== userId) {
      return NextResponse.json(
        { error: "فقط صاحب آگهی می‌تواند پروژه را شروع کند" },
        { status: 403 }
      );
    }
    if (freelancerId === userId) {
      return NextResponse.json(
        { error: "نمی‌توانید با خودتان قرارداد ببندید" },
        { status: 400 }
      );
    }

    // چک کن قبلاً قراردادی نبوده
    const existing = await query(
      `SELECT id FROM contracts
       WHERE post_id = ? AND client_id = ? AND freelancer_id = ?`,
      [postId, userId, freelancerId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "این قرارداد قبلاً ثبت شده" },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO contracts (post_id, client_id, freelancer_id, status)
       VALUES (?, ?, ?, 'in_progress')`,
      [postId, userId, freelancerId]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error("Create contract error:", error);
    return NextResponse.json({ error: "خطا در ثبت قرارداد" }, { status: 500 });
  }
}