import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// تولید کد ۵ رقمی تصادفی
function generateOTP(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !phone.match(/^09[0-9]{9}$/)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      );
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 دقیقه اعتبار

    // ذخیره کد در دیتابیس
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt]
    );

    // در محیط واقعی، اینجا کد رو به سرویس پیامک می‌فرستید
    // برای تست، کد رو در کنسول لاگ می‌کنیم
    console.log(`📱 کد تأیید برای ${phone}: ${code}`);

    // در محیط توسعه، کد رو برگردونید (برای تست)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'کد تأیید ارسال شد',
        debug_code: code, // فقط در توسعه
      });
    }

    return NextResponse.json({
      success: true,
      message: 'کد تأیید ارسال شد',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
}