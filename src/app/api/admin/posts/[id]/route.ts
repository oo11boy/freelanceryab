// app/api/admin/posts/[id]/route.ts
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

async function checkAdmin(userId: number): Promise<boolean> {
  const users = await query('SELECT role FROM users WHERE id = ?', [userId]);
  const user = (users as any[])[0];
  return user?.role === 'admin';
}

async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: any
) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Admin log error:', err);
  }
}

// GET /api/admin/posts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const posts = await query(
      `SELECT
        p.*,
        u.id AS user_id, u.full_name AS user_name, u.phone AS user_phone,
        u.role AS user_role, u.is_active AS user_active, u.rating AS user_rating
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId]
    );

    const post = (posts as any[])[0];
    if (!post) {
      return NextResponse.json({ error: 'آگهی یافت نشد' }, { status: 404 });
    }

    if (post.skills && typeof post.skills === 'string') {
      try { post.skills = JSON.parse(post.skills); } catch { post.skills = []; }
    } else if (!post.skills) post.skills = [];

    if (post.images && typeof post.images === 'string') {
      try { post.images = JSON.parse(post.images); } catch { post.images = []; }
    } else if (!post.images) post.images = [];

    const contracts = await query(
      `SELECT
        c.id, c.status, c.started_at, c.delivered_at, c.completed_at,
        cl.full_name AS client_name, cl.phone AS client_phone,
        fr.full_name AS freelancer_name, fr.phone AS freelancer_phone
       FROM contracts c
       LEFT JOIN users cl ON c.client_id = cl.id
       LEFT JOIN users fr ON c.freelancer_id = fr.id
       WHERE c.post_id = ?
       ORDER BY c.started_at DESC`,
      [postId]
    );

    const [statsRows] = await query(
      `SELECT
        (SELECT COUNT(*) FROM saved_posts WHERE post_id = ?) AS saves_count,
        (SELECT COUNT(*) FROM contracts WHERE post_id = ?) AS contracts_count,
        (SELECT COUNT(*) FROM messages WHERE post_id = ?) AS messages_count
      `,
      [postId, postId, postId]
    );

    return NextResponse.json({
      post,
      contracts,
      stats: statsRows,
    });
  } catch (error: any) {
    console.error('Admin post GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آگهی' }, { status: 500 });
  }
}

// PUT /api/admin/posts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    // ✅ تأیید یا رد آگهی
    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      const { note } = body;

      const posts = await query('SELECT user_id, title, status FROM posts WHERE id = ?', [postId]);
      const post = (posts as any[])[0];
      if (!post) {
        return NextResponse.json({ error: 'آگهی یافت نشد' }, { status: 404 });
      }

      await query('UPDATE posts SET status = ? WHERE id = ?', [newStatus, postId]);
      await logAdminAction(adminId, `${action}_post`, 'post', postId, {
        note: note || null,
        from: post.status,
        to: newStatus,
      });

      // 🔔 اعلان به صاحب آگهی
      try {
        const notifTitle = action === 'approve' ? '✅ آگهی شما تأیید شد' : '❌ آگهی شما رد شد';
        const notifMsg = action === 'approve'
          ? `آگهی «${post.title}» تأیید شد و اکنون در اپ نمایش داده می‌شه.`
          : `آگهی «${post.title}» رد شد.${note ? ` دلیل: ${note}` : ''}`;

        await query(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES (?, 'system', ?, ?, ?)`,
          [post.user_id, notifTitle, notifMsg, `/post/${postId}`]
        );
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'وضعیت تغییر کرد' });
    }

    if (action === 'change-status') {
      const { status } = body;
      const validStatuses = [
        'pending', 'active', 'locked', 'in_progress',
        'delivered', 'completed', 'rejected', 'expired',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'وضعیت نامعتبر' }, { status: 400 });
      }

      const posts = await query('SELECT id, status FROM posts WHERE id = ?', [postId]);
      const post = (posts as any[])[0];
      if (!post) {
        return NextResponse.json({ error: 'آگهی یافت نشد' }, { status: 404 });
      }

      await query('UPDATE posts SET status = ? WHERE id = ?', [status, postId]);
      await logAdminAction(adminId, 'change_post_status', 'post', postId, {
        from: post.status,
        to: status,
      });

      return NextResponse.json({ success: true, message: 'وضعیت تغییر کرد' });
    }

    if (action === 'update') {
      const { title, category, sub_category, price, price_type, description } = body;

      if (title !== undefined && !String(title).trim()) {
        return NextResponse.json({ error: 'عنوان نمی‌تواند خالی باشد' }, { status: 400 });
      }

      await query(
        `UPDATE posts SET
          title = COALESCE(?, title),
          category = COALESCE(?, category),
          sub_category = COALESCE(?, sub_category),
          price = COALESCE(?, price),
          price_type = COALESCE(?, price_type),
          description = COALESCE(?, description)
         WHERE id = ?`,
        [
          title ? String(title).trim() : null,
          category || null,
          sub_category || null,
          price || null,
          price_type || null,
          description ? String(description).trim() : null,
          postId,
        ]
      );

      await logAdminAction(adminId, 'update_post', 'post', postId, {
        title, category, sub_category,
      });

      return NextResponse.json({ success: true, message: 'آگهی به‌روزرسانی شد' });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin post PUT error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی' }, { status: 500 });
  }
}

// DELETE /api/admin/posts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const posts = await query('SELECT id, title FROM posts WHERE id = ?', [postId]);
    const post = (posts as any[])[0];
    if (!post) {
      return NextResponse.json({ error: 'آگهی یافت نشد' }, { status: 404 });
    }

    await query('DELETE FROM posts WHERE id = ?', [postId]);
    await logAdminAction(adminId, 'delete_post', 'post', postId, { title: post.title });

    return NextResponse.json({ success: true, message: 'آگهی حذف شد' });
  } catch (error: any) {
    console.error('Admin post DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}