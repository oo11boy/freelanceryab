// app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

// ===================================================
// ارسال رویداد به socket server
// ===================================================
async function notifySocket(event: string, data: any) {
  try {
    const SOCKET_URL =
      process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
    const SOCKET_SECRET = process.env.SOCKET_SECRET || 'dev-secret-change-me';

    const response = await fetch(`${SOCKET_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, secret: SOCKET_SECRET }),
    });

    if (!response.ok) {
      console.error(
        'Socket notify failed:',
        response.status,
        await response.text().catch(() => '')
      );
    }
  } catch (error: any) {
    // خطای شبکه یا socket server خاموش — نذار API fail بشه
    console.error('Socket notify error:', error.message);
  }
}

// ===================================================
// استخراج userId از توکن
// ===================================================
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

// ===================================================
// PUT /api/contracts/[id]
// body: { action: 'deliver' | 'confirm' | 'cancel' }
// ===================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'شناسه نامعتبر' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // گرفتن قرارداد
    const contracts = await query(
      `SELECT * FROM contracts WHERE id = ?`,
      [contractId]
    );
    const contract = (contracts as any[])[0];
    if (!contract) {
      return NextResponse.json(
        { error: 'قرارداد یافت نشد' },
        { status: 404 }
      );
    }

    const isClient = contract.client_id === userId;
    const isFreelancer = contract.freelancer_id === userId;
    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'دسترسی ندارید' },
        { status: 403 }
      );
    }

    // ===================================================
    // ۱. تحویل پروژه (فقط فریلنسر)
    // ===================================================
    if (action === 'deliver') {
      if (!isFreelancer) {
        return NextResponse.json(
          { error: 'فقط فریلنسر می‌تواند تحویل بزند' },
          { status: 403 }
        );
      }
      if (contract.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'وضعیت قرارداد اجازه تحویل نمی‌دهد' },
          { status: 400 }
        );
      }

      await query(
        `UPDATE contracts
         SET status = 'delivered', delivered_at = NOW()
         WHERE id = ?`,
        [contractId]
      );

      // 🔔 اطلاع به هر دو طرف
      await notifySocket('contract_event', {
        event: 'contract_updated',
        contractId,
        postId: contract.post_id,
        clientId: contract.client_id,
        freelancerId: contract.freelancer_id,
        status: 'delivered',
        targetUsers: [contract.client_id, contract.freelancer_id],
      });

      return NextResponse.json({ success: true, status: 'delivered' });
    }

    // ===================================================
    // ۲. تأیید دریافت (فقط کارفرما)
    // ===================================================
    if (action === 'confirm') {
      if (!isClient) {
        return NextResponse.json(
          { error: 'فقط کارفرما می‌تواند تأیید کند' },
          { status: 403 }
        );
      }
      if (contract.status !== 'delivered') {
        return NextResponse.json(
          { error: 'وضعیت قرارداد اجازه تأیید نمی‌دهد' },
          { status: 400 }
        );
      }

      // آپدیت قرارداد
      await query(
        `UPDATE contracts
         SET status = 'completed', completed_at = NOW()
         WHERE id = ?`,
        [contractId]
      );

      // آپدیت آگهی
      await query(
        `UPDATE posts
         SET status = 'completed', updated_at = NOW()
         WHERE id = ?`,
        [contract.post_id]
      );

      // افزایش پروژه‌های موفق هر دو طرف
      await query(
        `UPDATE users
         SET completed_projects = completed_projects + 1
         WHERE id IN (?, ?)`,
        [contract.client_id, contract.freelancer_id]
      );

      // 🔔 اطلاع به هر دو طرف
      await notifySocket('contract_event', {
        event: 'contract_updated',
        contractId,
        postId: contract.post_id,
        clientId: contract.client_id,
        freelancerId: contract.freelancer_id,
        status: 'completed',
        targetUsers: [contract.client_id, contract.freelancer_id],
      });

      return NextResponse.json({ success: true, status: 'completed' });
    }

    // ===================================================
    // ۳. لغو قرارداد (فقط کارفرما)
    // ===================================================
    if (action === 'cancel') {
      if (!isClient) {
        return NextResponse.json(
          { error: 'فقط کارفرما می‌تواند لغو کند' },
          { status: 403 }
        );
      }
      if (contract.status === 'completed') {
        return NextResponse.json(
          { error: 'پروژه تکمیل شده، لغو ممکن نیست' },
          { status: 400 }
        );
      }
      if (contract.status === 'cancelled') {
        return NextResponse.json(
          { error: 'قبلاً لغو شده' },
          { status: 400 }
        );
      }

      // آپدیت قرارداد
      await query(
        `UPDATE contracts SET status = 'cancelled' WHERE id = ?`,
        [contractId]
      );

      // آگهی برگرده به active
      await query(
        `UPDATE posts
         SET status = 'active', updated_at = NOW()
         WHERE id = ?`,
        [contract.post_id]
      );

      // 🔔 اطلاع به هر دو طرف
      await notifySocket('contract_event', {
        event: 'contract_updated',
        contractId,
        postId: contract.post_id,
        clientId: contract.client_id,
        freelancerId: contract.freelancer_id,
        status: 'cancelled',
        targetUsers: [contract.client_id, contract.freelancer_id],
      });

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    return NextResponse.json(
      { error: 'عملیات نامعتبر' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Update contract error:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی' },
      { status: 500 }
    );
  }
}