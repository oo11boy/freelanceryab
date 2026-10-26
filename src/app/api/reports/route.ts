// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUserIdFromToken(request: NextRequest): number | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

// POST /api/reports — ثبت گزارش جدید
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { target_type, target_id, reason, description } = body;

    if (!target_type || !target_id || !reason) {
      return NextResponse.json({ error: 'فیلدهای الزامی را پر کنید' }, { status: 400 });
    }

    if (!['post', 'user', 'message'].includes(target_type)) {
      return NextResponse.json({ error: 'نوع هدف نامعتبر' }, { status: 400 });
    }

    // چک نکن کاربر خودش رو گزارش کنه
    if (target_type === 'user' && Number(target_id) === userId) {
      return NextResponse.json({ error: 'نمی‌توانید خودتان را گزارش کنید' }, { status: 400 });
    }

    // چک تکراری نبودن (همون کاربر، همون هدف، در ۲۴ ساعت اخیر)
    const [existing] = await query(
      `SELECT id FROM reports
       WHERE reporter_id = ? AND target_type = ? AND target_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       LIMIT 1`,
      [userId, target_type, Number(target_id)]
    ) as any[];

    if (existing) {
      return NextResponse.json(
        { error: 'شما قبلاً این مورد را گزارش کرده‌اید' },
        { status: 429 }
      );
    }

    const result = await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, target_type, Number(target_id), String(reason).trim(), description?.trim() || null]
    );

    return NextResponse.json(
      { success: true, id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Report POST error:', error);
    return NextResponse.json({ error: 'خطا در ثبت گزارش' }, { status: 500 });
  }
}