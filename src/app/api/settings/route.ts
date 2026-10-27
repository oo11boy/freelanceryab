// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/settings — تنظیمات عمومی (بدون احراز هویت)
export async function GET(request: NextRequest) {
  try {
    const rows = await query(`SELECT key, value FROM settings`);
    const settings: Record<string, string> = {};
    for (const row of rows as any[]) {
      settings[row.key] = row.value || "";
    }

    // فقط تنظیمات عمومی رو برگردون (نه امنیتی)
    return NextResponse.json({
      site_name: settings.site_name || "فریلنسریاب",
      site_description: settings.site_description || "",
      contact_phone: settings.contact_phone || "",
      contact_email: settings.contact_email || "",
      about_text: settings.about_text || "",
      rules_text: settings.rules_text || "",
      post_approval_mode: settings.post_approval_mode || "manual",
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تنظیمات" },
      { status: 500 },
    );
  }
}
