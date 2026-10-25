// src/app/api/contracts/[id]/route.ts
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
// PUT /api/contracts/[id]
// body: { action: 'deliver' | 'confirm' | 'cancel' }
// -------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { id } = await params;
    const contractId = parseInt(id);
    if (!contractId) {
      return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    const contracts = await query(
      `SELECT * FROM contracts WHERE id = ?`,
      [contractId]
    );
    const contract = (contracts as any[])[0];
    if (!contract) {
      return NextResponse.json({ error: "قرارداد یافت نشد" }, { status: 404 });
    }

    const isClient = contract.client_id === userId;
    const isFreelancer = contract.freelancer_id === userId;
    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
    }

    // -------------------------------------------------
    // تحویل پروژه (فقط فریلنسر)
    // -------------------------------------------------
    if (action === "deliver") {
      if (!isFreelancer) {
        return NextResponse.json(
          { error: "فقط فریلنسر می‌تواند تحویل بزند" },
          { status: 403 }
        );
      }
      if (contract.status !== "in_progress") {
        return NextResponse.json(
          { error: "وضعیت قرارداد اجازه تحویل نمی‌دهد" },
          { status: 400 }
        );
      }
      await query(
        `UPDATE contracts
         SET status = 'delivered', delivered_at = NOW()
         WHERE id = ?`,
        [contractId]
      );
      return NextResponse.json({ success: true, status: "delivered" });
    }

    // -------------------------------------------------
    // تأیید دریافت (فقط کارفرما)
    // -------------------------------------------------
    if (action === "confirm") {
      if (!isClient) {
        return NextResponse.json(
          { error: "فقط کارفرما می‌تواند تأیید کند" },
          { status: 403 }
        );
      }
      if (contract.status !== "delivered") {
        return NextResponse.json(
          { error: "وضعیت قرارداد اجازه تأیید نمی‌دهد" },
          { status: 400 }
        );
      }
      await query(
        `UPDATE contracts
         SET status = 'completed', completed_at = NOW()
         WHERE id = ?`,
        [contractId]
      );

      // افزایش completed_projects هر دو طرف
      await query(
        `UPDATE users SET completed_projects = completed_projects + 1
         WHERE id IN (?, ?)`,
        [contract.client_id, contract.freelancer_id]
      );

      return NextResponse.json({ success: true, status: "completed" });
    }

    // -------------------------------------------------
    // لغو قرارداد (فقط کارفرما و فقط در in_progress)
    // -------------------------------------------------
    if (action === "cancel") {
      if (!isClient) {
        return NextResponse.json(
          { error: "فقط کارفرما می‌تواند لغو کند" },
          { status: 403 }
        );
      }
      if (contract.status !== "in_progress") {
        return NextResponse.json(
          { error: "فقط در مرحله انجام می‌توان لغو کرد" },
          { status: 400 }
        );
      }
      await query(
        `UPDATE contracts SET status = 'cancelled' WHERE id = ?`,
        [contractId]
      );
      return NextResponse.json({ success: true, status: "cancelled" });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (error) {
    console.error("Update contract error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}