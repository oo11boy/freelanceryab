// app/api/contracts/route.ts
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
    // socket server خاموش — نذار API fail بشه
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
// GET /api/contracts?postId=13&otherUserId=5
// دریافت قرارداد بین دو کاربر برای یه آگهی
// ===================================================
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const sp = request.nextUrl.searchParams;
    const postId = parseInt(sp.get('postId') || '0');
    const otherUserId = parseInt(sp.get('otherUserId') || '0');

    if (!postId || !otherUserId) {
      return NextResponse.json(
        { error: 'شناسه نامعتبر' },
        { status: 400 }
      );
    }

    // اطلاعات آگهی
    const postsData = await query(
      `SELECT user_id, status FROM posts WHERE id = ?`,
      [postId]
    );
    const postOwnerId = (postsData as any[])[0]?.user_id || null;
    const postStatus = (postsData as any[])[0]?.status || null;

    let role: 'client' | 'freelancer' | null = null;

    // قرارداد
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

    // تشخیص نقش
    if (contract) {
      if (contract.client_id === userId) role = 'client';
      else if (contract.freelancer_id === userId) role = 'freelancer';
    }

    if (!role && postOwnerId) {
      if (postOwnerId === userId) {
        role = 'client';
      } else if (postOwnerId === otherUserId) {
        role = 'freelancer';
      } else if (otherUserId !== userId) {
        role = 'freelancer';
      }
    }

    // امتیاز طرف مقابل (اگه قرارداد completed هست)
    let otherReview = null;
    if (contract && contract.status === 'completed') {
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
      postStatus,
      role,
    });
  } catch (error: any) {
    console.error('Get contract error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت قرارداد' },
      { status: 500 }
    );
  }
}

// ===================================================
// POST /api/contracts — شروع پروژه توسط کارفرما
// body: { postId, freelancerId }
// ===================================================
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'احراز هویت نشده' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, freelancerId } = body;

    if (!postId || !freelancerId) {
      return NextResponse.json(
        { error: 'اطلاعات ناقص' },
        { status: 400 }
      );
    }

    // چک کردن آگهی
    const posts = await query(
      `SELECT id, user_id, status, title FROM posts WHERE id = ?`,
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
        { error: 'فقط صاحب آگهی می‌تواند پروژه را شروع کند' },
        { status: 403 }
      );
    }
    if (post.status === 'locked') {
      return NextResponse.json(
        { error: 'این آگهی قفل شده است' },
        { status: 400 }
      );
    }
    if (post.status === 'completed') {
      return NextResponse.json(
        { error: 'این آگهی قبلاً تکمیل شده' },
        { status: 400 }
      );
    }
    if (freelancerId === userId) {
      return NextResponse.json(
        { error: 'نمی‌توانید با خودتان قرارداد ببندید' },
        { status: 400 }
      );
    }

    // چک قرارداد قبلی
    const existing = await query(
      `SELECT id, status FROM contracts
       WHERE post_id = ? AND client_id = ? AND freelancer_id = ?`,
      [postId, userId, freelancerId]
    );

    if ((existing as any[]).length > 0) {
      const existingContract = (existing as any[])[0];

      // اگه قرارداد قبلی cancelled بود، می‌تونه دوباره شروع کنه
      if (existingContract.status === 'cancelled') {
        await query(
          `UPDATE contracts
           SET status = 'in_progress',
               started_at = NOW(),
               delivered_at = NULL,
               completed_at = NULL
           WHERE id = ?`,
          [existingContract.id]
        );

        // 🔔 اطلاع به هر دو طرف
        await notifySocket('contract_event', {
          event: 'contract_updated',
          contractId: existingContract.id,
          postId,
          clientId: userId,
          freelancerId,
          status: 'in_progress',
          targetUsers: [userId, freelancerId],
        });

        return NextResponse.json({
          success: true,
          id: existingContract.id,
          restarted: true,
        });
      }

      return NextResponse.json(
        { error: 'این قرارداد قبلاً ثبت شده' },
        { status: 409 }
      );
    }

    // ساخت قرارداد جدید
    const result = await query(
      `INSERT INTO contracts (post_id, client_id, freelancer_id, status)
       VALUES (?, ?, ?, 'in_progress')`,
      [postId, userId, freelancerId]
    );

    const newContractId = (result as any).insertId;

    // 🔔 اطلاع به هر دو طرف
    await notifySocket('contract_event', {
      event: 'contract_updated',
      contractId: newContractId,
      postId,
      clientId: userId,
      freelancerId,
      status: 'in_progress',
      targetUsers: [userId, freelancerId],
    });

    return NextResponse.json({
      success: true,
      id: newContractId,
    });
  } catch (error: any) {
    console.error('Create contract error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت قرارداد' },
      { status: 500 }
    );
  }
}