// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const API_URL = 'https://edge.ippanel.com/v1/api/send';
const PATTERN_CODE = 'ngdcpa2uz8q88zm';

function generateOTP(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function sendSms(phone: string, code: string): Promise<boolean> {
  const API_KEY = process.env.IP_PANEL_API_KEY;
  const SENDER = process.env.SENDER_NUMBER;

  if (!API_KEY || !SENDER) {
    console.error('IP_PANEL_API_KEY or SENDER_NUMBER is missing');
    return false;
  }

  const formattedPhone = phone.startsWith('0')
    ? `+98${phone.slice(1)}`
    : phone;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY,
      },
      body: JSON.stringify({
        sending_type: 'pattern',
        from_number: SENDER,
        code: PATTERN_CODE,
        recipients: [formattedPhone],
        params: { code },
      }),
    });

    const result = await response.json();

    if (result?.meta?.status !== true) {
      console.error('IPPanel error:', result);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS Error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      );
    }

    // --- Rate limit ساده: حداکثر یک کد در ۶۰ ثانیه ---
    const recent = await query(
      `SELECT id FROM otp_codes
       WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       LIMIT 1`,
      [phone]
    );
    if ((recent as any[]).length > 0) {
      return NextResponse.json(
        { error: 'لطفاً کمی صبر کنید و دوباره تلاش کنید' },
        { status: 429 }
      );
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // --- پاک‌سازی کدهای قبلی استفاده‌نشده ---
    await query(
      'UPDATE otp_codes SET is_used = TRUE WHERE phone = ? AND is_used = FALSE',
      [phone]
    );

    // --- ذخیره کد جدید ---
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt]
    );

    // --- ارسال واقعی پیامک ---
    const smsSent = await sendSms(phone, code);

    if (!smsSent) {
      // کد رو باطل کن که کاربر گیر نکنه
      await query(
        'UPDATE otp_codes SET is_used = TRUE WHERE phone = ? AND code = ?',
        [phone, code]
      );
      return NextResponse.json(
        { error: 'خطا در ارسال پیامک' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'کد تأیید ارسال شد',
        debug_code: code,
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