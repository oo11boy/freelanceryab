// app/api/admin/reports/[id]/route.ts
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

async function logAdminAction(adminId: number, action: string, targetType: string, targetId: number, details?: any) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) { console.error('Admin log error:', err); }
}

// GET — جزئیات گزارش + محتوای گزارش‌شده
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const reports = await query(
      `SELECT
        r.*,
        u.full_name AS reporter_name, u.phone AS reporter_phone, u.id AS reporter_id,
        a.full_name AS admin_name
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN users a ON r.admin_id = a.id
       WHERE r.id = ?`,
      [reportId]
    );
    const report = (reports as any[])[0];
    if (!report) return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 });

    // محتوای گزارش‌شده
    let target: any = null;
    if (report.target_type === 'post') {
      const rows = await query(
        `SELECT p.*, u.full_name AS user_name, u.phone AS user_phone, u.id AS user_id
         FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
        [report.target_id]
      );
      target = (rows as any[])[0] || null;
      if (target?.skills && typeof target.skills === 'string') {
        try { target.skills = JSON.parse(target.skills); } catch { target.skills = []; }
      }
    } else if (report.target_type === 'user') {
      const rows = await query(
        `SELECT id, phone, full_name, email, role, rating, completed_projects,
                is_active, bio, created_at
         FROM users WHERE id = ?`,
        [report.target_id]
      );
      target = (rows as any[])[0] || null;
    } else if (report.target_type === 'message') {
      const rows = await query(
        `SELECT m.*, s.full_name AS sender_name, s.phone AS sender_phone,
                r.full_name AS receiver_name, r.phone AS receiver_phone
         FROM messages m
         LEFT JOIN users s ON m.sender_id = s.id
         LEFT JOIN users r ON m.receiver_id = r.id
         WHERE m.id = ?`,
        [report.target_id]
      );
      target = (rows as any[])[0] || null;
    }

    // تاریخچه گزارش‌های قبلی برای همین هدف
    const previousReports = await query(
      `SELECT id, reporter_id, reason, status, created_at
       FROM reports
       WHERE target_type = ? AND target_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [report.target_type, report.target_id, reportId]
    );

    return NextResponse.json({ report, target, previousReports });
  } catch (error: any) {
    console.error('Admin report GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت گزارش' }, { status: 500 });
  }
}

// PUT — اقدام روی گزارش
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const body = await request.json();
    const { action, note } = body;

    const reports = await query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const report = (reports as any[])[0];
    if (!report) return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 });

    // 🔹 تغییر وضعیت ساده
    if (action === 'mark-reviewed' || action === 'dismiss') {
      const newStatus = action === 'dismiss' ? 'dismissed' : 'reviewed';
      await query(
        `UPDATE reports
         SET status = ?, admin_id = ?, admin_note = COALESCE(?, admin_note),
             reviewed_at = NOW(),
             resolved_at = CASE WHEN ? = 'dismissed' THEN NOW() ELSE resolved_at END
         WHERE id = ?`,
        [newStatus, adminId, note || null, newStatus, reportId]
      );
      await logAdminAction(adminId, `report_${action}`, 'report', reportId, { note });
      return NextResponse.json({ success: true, message: 'وضعیت گزارش به‌روز شد' });
    }

    // 🔹 حل گزارش (resolve)
    if (action === 'resolve') {
      await query(
        `UPDATE reports
         SET status = 'resolved', admin_id = ?, admin_note = COALESCE(?, admin_note),
             reviewed_at = COALESCE(reviewed_at, NOW()), resolved_at = NOW()
         WHERE id = ?`,
        [adminId, note || null, reportId]
      );
      await logAdminAction(adminId, 'report_resolve', 'report', reportId, { note });
      return NextResponse.json({ success: true, message: 'گزارش حل شد' });
    }

    // 🔹 حذف محتوای گزارش‌شده
    if (action === 'delete-target') {
      if (report.target_type === 'post') {
        await query(`UPDATE posts SET status = 'rejected' WHERE id = ?`, [report.target_id]);
      } else if (report.target_type === 'message') {
        await query(`DELETE FROM messages WHERE id = ?`, [report.target_id]);
      } else if (report.target_type === 'user') {
        // برای کاربر، فقط مسدود می‌کنیم (حذف کامل خطرناکه)
        await query(`UPDATE users SET is_active = 0 WHERE id = ?`, [report.target_id]);
      }

      await query(
        `UPDATE reports
         SET status = 'resolved', admin_id = ?, admin_note = COALESCE(?, admin_note),
             reviewed_at = COALESCE(reviewed_at, NOW()), resolved_at = NOW()
         WHERE id = ?`,
        [adminId, note || null, reportId]
      );

      await logAdminAction(adminId, 'report_delete_target', 'report', reportId, {
        target_type: report.target_type,
        target_id: report.target_id,
        note,
      });

      return NextResponse.json({ success: true, message: 'محتوا حذف/مسدود شد' });
    }

    // 🔹 مسدودسازی کاربر خاطی
    if (action === 'block-user') {
      let targetUserId: number | null = null;

      if (report.target_type === 'user') {
        targetUserId = report.target_id;
      } else if (report.target_type === 'post') {
        const rows = await query('SELECT user_id FROM posts WHERE id = ?', [report.target_id]);
        targetUserId = (rows as any[])[0]?.user_id || null;
      } else if (report.target_type === 'message') {
        const rows = await query('SELECT sender_id FROM messages WHERE id = ?', [report.target_id]);
        targetUserId = (rows as any[])[0]?.sender_id || null;
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'کاربر هدف یافت نشد' }, { status: 404 });
      }
      if (targetUserId === adminId) {
        return NextResponse.json({ error: 'نمی‌توانید خودتان را مسدود کنید' }, { status: 400 });
      }

      await query('UPDATE users SET is_active = 0 WHERE id = ?', [targetUserId]);
      await query(
        `UPDATE reports
         SET status = 'resolved', admin_id = ?, admin_note = COALESCE(?, admin_note),
             reviewed_at = COALESCE(reviewed_at, NOW()), resolved_at = NOW()
         WHERE id = ?`,
        [adminId, note || null, reportId]
      );

      await logAdminAction(adminId, 'report_block_user', 'report', reportId, {
        target_user_id: targetUserId,
        note,
      });

      return NextResponse.json({ success: true, message: 'کاربر مسدود شد' });
    }

    // 🔹 ارسال اخطار به کاربر
    if (action === 'warn-user') {
      let targetUserId: number | null = null;
      if (report.target_type === 'user') targetUserId = report.target_id;
      else if (report.target_type === 'post') {
        const rows = await query('SELECT user_id FROM posts WHERE id = ?', [report.target_id]);
        targetUserId = (rows as any[])[0]?.user_id || null;
      } else if (report.target_type === 'message') {
        const rows = await query('SELECT sender_id FROM messages WHERE id = ?', [report.target_id]);
        targetUserId = (rows as any[])[0]?.sender_id || null;
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'کاربر هدف یافت نشد' }, { status: 404 });
      }

      await query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'warning', '⚠️ اخطار از طرف مدیریت', ?, NULL)`,
        [targetUserId, note || 'محتوای شما گزارش شده و مغایر قوانین است. لطفاً قوانین را رعایت کنید.']
      );

      await query(
        `UPDATE reports
         SET status = 'resolved', admin_id = ?, admin_note = COALESCE(?, admin_note),
             reviewed_at = COALESCE(reviewed_at, NOW()), resolved_at = NOW()
         WHERE id = ?`,
        [adminId, note || null, reportId]
      );

      await logAdminAction(adminId, 'report_warn_user', 'report', reportId, {
        target_user_id: targetUserId,
        note,
      });

      return NextResponse.json({ success: true, message: 'اخطار ارسال شد' });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin report PUT error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی' }, { status: 500 });
  }
}