// app/api/posts/[id]/lock/route.ts
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
// POST /api/posts/[id]/lock
// body: { action: 'lock' | 'unlock' }
// ===================================================
export async function POST(
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
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'شناسه نامعتبر' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'lock' && action !== 'unlock') {
      return NextResponse.json(
        { error: 'عملیات نامعتبر' },
        { status: 400 }
      );
    }

    // چک کردن آگهی
    const posts = await query(
      `SELECT user_id, status FROM posts WHERE id = ?`,
      [postId]
    );
    const post = (posts as any[])[0];
    if (!post) {
      return NextResponse.json(
        { error: 'آگهی یافت نشد' },
        { status: 404 }
      );
    }
    if (post.user_id !== userId) {
      return NextResponse.json(
        { error: 'فقط صاحب آگهی می‌تواند قفل کند' },
        { status: 403 }
      );
    }

    // پیدا کردن قرارداد فعال (برای گرفتن طرف مقابل)
    const activeContracts = await query(
      `SELECT id, client_id, freelancer_id FROM contracts
       WHERE post_id = ? AND status IN ('in_progress', 'delivered')
       LIMIT 1`,
      [postId]
    );
    const activeContract = (activeContracts as any[])[0] || null;

    // ===================================================
    // قفل کردن
    // ===================================================
    if (action === 'lock') {
      if (post.status !== 'active') {
        return NextResponse.json(
          { error: 'فقط آگهی فعال قابل قفل کردن است' },
          { status: 400 }
        );
      }

      if (!activeContract) {
        return NextResponse.json(
          {
            error:
              'ابتدا باید پروژه رو با یک فریلنسر شروع کنید، سپس قفل کنید',
          },
          { status: 400 }
        );
      }

      await query(
        `UPDATE posts
         SET status = 'locked', updated_at = NOW()
         WHERE id = ?`,
        [postId]
      );

      // 🔔 اطلاع به هر دو طرف
      await notifySocket('contract_event', {
        event: 'post_locked',
        postId,
        clientId: activeContract.client_id,
        freelancerId: activeContract.freelancer_id,
        targetUsers: [activeContract.client_id, activeContract.freelancer_id],
      });

      return NextResponse.json({
        success: true,
        status: 'locked',
        message: 'آگهی قفل شد و از لیست عمومی حذف شد',
      });
    }

    // ===================================================
    // باز کردن قفل
    // ===================================================
    if (action === 'unlock') {
      if (post.status !== 'locked') {
        return NextResponse.json(
          { error: 'فقط آگهی قفل‌شده قابل باز کردن است' },
          { status: 400 }
        );
      }

      await query(
        `UPDATE posts
         SET status = 'active', updated_at = NOW()
         WHERE id = ?`,
        [postId]
      );

      // 🔔 اطلاع به هر دو طرف
      if (activeContract) {
        await notifySocket('contract_event', {
          event: 'post_unlocked',
          postId,
          clientId: activeContract.client_id,
          freelancerId: activeContract.freelancer_id,
          targetUsers: [
            activeContract.client_id,
            activeContract.freelancer_id,
          ],
        });
      }

      return NextResponse.json({
        success: true,
        status: 'active',
        message: 'آگهی باز شد و دوباره در لیست نمایش داده می‌شه',
      });
    }

    return NextResponse.json(
      { error: 'عملیات نامعتبر' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Lock post error:', error);
    return NextResponse.json(
      { error: 'خطا در عملیات' },
      { status: 500 }
    );
  }
}