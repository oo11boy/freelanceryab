// src/app/api/reviews/route.ts
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
// POST /api/reviews
// body: { contractId, rating (1-5), comment? }
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, rating, comment } = body;

    if (!contractId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "امتیاز نامعتبر" }, { status: 400 });
    }

    const contracts = await query(
      `SELECT * FROM contracts WHERE id = ?`,
      [contractId]
    );
    const contract = (contracts as any[])[0];
    if (!contract) {
      return NextResponse.json({ error: "قرارداد یافت نشد" }, { status: 404 });
    }

    if (contract.status !== "completed") {
      return NextResponse.json(
        { error: "فقط بعد از تکمیل پروژه می‌توان امتیاز داد" },
        { status: 400 }
      );
    }

    const isClient = contract.client_id === userId;
    const isFreelancer = contract.freelancer_id === userId;
    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
    }

    const revieweeId = isClient
      ? contract.freelancer_id
      : contract.client_id;

    // چک کن قبلاً امتیاز نداده
    const existing = await query(
      `SELECT id FROM reviews
       WHERE contract_id = ? AND reviewer_id = ?`,
      [contractId, userId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "قبلاً امتیاز داده‌اید" },
        { status: 409 }
      );
    }

    await query(
      `INSERT INTO reviews
        (contract_id, reviewer_id, reviewee_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [contractId, userId, revieweeId, rating, comment || null]
    );

    // بروزرسانی rating کاربر مقصد (میانگین همه امتیازهای واقعی)
    const agg = await query(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS count
       FROM reviews WHERE reviewee_id = ?`,
      [revieweeId]
    );
    const avg = (agg as any[])[0];
    if (avg && avg.avg_rating !== null) {
      await query(
        `UPDATE users SET rating = ? WHERE id = ?`,
        [Number(avg.avg_rating).toFixed(1), revieweeId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "خطا در ثبت امتیاز" }, { status: 500 });
  }
}