'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SECTIONS = [
  {
    id: 1,
    icon: '📜',
    title: 'قوانین عمومی',
    content:
      'استفاده از این پلتفرم به معنای پذیرش تمامی قوانین و مقررات است. فریلنسرکار تنها بستری برای ارتباط بین کارفرمایان و فریلنسرها فراهم می‌کند و طرف قرارداد محسوب نمی‌شود. کاربران موظف‌اند پیش از هر اقدام، این قوانین را به‌طور کامل مطالعه کنند.',
  },
  {
    id: 2,
    icon: '✅',
    title: 'محتوای مجاز',
    content:
      'تمامی خدمات ارائه‌شده باید در چارچوب قوانین جمهوری اسلامی ایران باشد. انتشار محتوای توهین‌آمیز، غیرقانونی، مغایر با عفت عمومی، یا هرگونه فعالیت مجرمانه ممنوع است و منجر به مسدودسازی حساب کاربری خواهد شد.',
  },
  {
    id: 3,
    icon: '👥',
    title: 'مسئولیت کاربران',
    content:
      'کاربران مسئول صحت اطلاعات وارد شده و انجام تعهدات خود هستند. فریلنسرکار هیچ‌گونه مسئولیتی در قبال اختلافات مالی یا کیفیت خدمات ارائه‌شده ندارد، اما در صورت گزارش تخلف، بررسی‌های لازم انجام خواهد شد.',
  },
  {
    id: 4,
    icon: '💳',
    title: 'پرداخت و تراکنش‌ها',
    content:
      'پرداخت‌ها باید صرفاً از طریق پلتفرم انجام شود. واریز مستقیم به حساب شخصی، خارج از مسئولیت فریلنسرکار است و در صورت بروز مشکل، هیچ‌گونه پیگیری امکان‌پذیر نیست. توصیه می‌شود پیش از پرداخت، از انجام تعهدات طرف مقابل اطمینان حاصل کنید.',
  },
  {
    id: 5,
    icon: '🛡️',
    title: 'حساب کاربری و امنیت',
    content:
      'شماره موبایل به‌عنوان شناسه اصلی حساب کاربری است و باید در اختیار صاحب آن باشد. هرگونه سوءاستفاده از حساب، جعل هویت، یا تلاش برای دسترسی غیرمجاز به اطلاعات دیگران ممنوع است و پیگرد قانونی دارد.',
  },
  {
    id: 6,
    icon: '📝',
    title: 'آگهی‌ها و محتوای منتشرشده',
    content:
      'آگهی‌ها باید دقیق، شفاف و بدون اطلاعات گمراه‌کننده باشند. تکرار آگهی‌های یکسان، تبلیغات غیرمرتبط، یا انتشار آگهی در دسته‌بندی نامناسب، منجر به حذف آگهی و در صورت تکرار، مسدودسازی حساب خواهد شد.',
  },
  {
    id: 7,
    icon: '💬',
    title: 'ارتباطات و پیام‌ها',
    content:
      'تمامی ارتباطات باید از طریق چت پلتفرم انجام شود. ارسال پیام‌های تبلیغاتی، اسپم، یا آزاردهنده ممنوع است. تیم پشتیبانی حق بررسی پیام‌ها در صورت گزارش تخلف را دارد.',
  },
  {
    id: 8,
    icon: '⚖️',
    title: 'اختلافات و حل و فصل',
    content:
      'در صورت بروز اختلاف بین کارفرما و فریلنسر، توصیه می‌شود ابتدا از طریق گفتگو حل شود. در صورت عدم توافق، موضوع از طریق پشتیبانی پیگیری می‌شود. تصمیم نهایی در موارد خاص با تیم فریلنسرکار است.',
  },
  {
    id: 9,
    icon: '🚫',
    title: 'تخلفات و پیامدها',
    content:
      'در صورت نقض قوانین، بسته به شدت تخلف، اقدامات زیر انجام می‌شود: اخطار کتبی، حذف محتوا، محدودیت موقت، مسدودسازی دائم حساب، و در موارد حقوقی، اقدام قانونی.',
  },
  {
    id: 10,
    icon: '🔄',
    title: 'تغییرات در قوانین',
    content:
      'فریلنسرکار حق تغییر این قوانین را در هر زمان محفوظ می‌دارد. تغییرات از طریق اعلان در پلتفرم اطلاع‌رسانی می‌شود و ادامه استفاده از خدمات به معنای پذیرش قوانین جدید است.',
  },
  {
  id: 11,
  icon: '⚠️',
  title: 'سلب مسئولیت و محدوده خدمات',
  content:
    'فریلنسرکار تنها بستری برای ارتباط بین کارفرما و فریلنسر است و هیچ‌گونه مسئولیتی در قبال کیفیت خدمات، صحت اطلاعات، تأخیر در تحویل، یا پرداخت‌های مالی بین طرفین ندارد. هر قراردادی که از طریق این پلتفرم شکل می‌گیرد، مستقیماً بین کارفرما و فریلنسر منعقد می‌شود و فریلنسرکار طرف قرارداد محسوب نمی‌شود. سیستم قرارداد و امتیازدهی صرفاً جهت شفافیت و ثبت سابقه ارائه شده است و تضمینی برای انجام تعهدات نیست. توصیه می‌شود پرداخت‌ها مرحله‌ای (پیش‌پرداخت و پس‌پرداخت) انجام شود و کاربران پیش از شروع همکاری، از صحت اطلاعات طرف مقابل اطمینان حاصل کنند. در صورت بروز اختلاف، فریلنسرکار تنها می‌تواند سابقه قرارداد و امتیازها را نمایش دهد و هرگونه پیگیری حقوقی بر عهده طرفین است.'
}
];

export default function RulesPage() {
  const router = useRouter();
  const [openIds, setOpenIds] = useState<number[]>([1]);

  const toggleSection = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenIds(SECTIONS.map((s) => s.id));
  const collapseAll = () => setOpenIds([]);
  const allOpen = openIds.length === SECTIONS.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 py-3 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-800 flex-1 text-center">
            قوانین و مقررات
          </h1>
          <button
            onClick={allOpen ? collapseAll : expandAll}
            className="text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 active:scale-95 transition-all"
          >
            {allOpen ? 'بستن همه' : 'باز کردن همه'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* هدر اطلاع‌رسانی */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
                ⚖️
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight">
                  قبل از شروع بخوانید
                </h2>
                <p className="text-[10px] opacity-80">
                  آخرین بروزرسانی: مهر ۱۴۰۳
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed opacity-95 mt-2">
              با ثبت‌نام و استفاده از فریلنسرکار، شما با تمامی قوانین زیر
              موافقت می‌کنید. لطفاً با دقت مطالعه کنید.
            </p>
          </div>
        </div>

        {/* لیست بخش‌ها */}
        <div className="space-y-2.5">
          {SECTIONS.map((section) => {
            const isOpen = openIds.includes(section.id);
            return (
              <div
                key={section.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                  isOpen ? 'border-blue-200 shadow-blue-100/50' : 'border-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 p-4 text-right hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
                      isOpen
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-gray-100'
                    }`}
                  >
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOpen
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {section.id}
                      </span>
                      <h3 className="font-bold text-sm text-gray-800 truncate">
                        {section.title}
                      </h3>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* محتوا با انیمیشن */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* بخش تماس با پشتیبانی */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
              💬
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 text-sm mb-1">
                سوالی دارید؟
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                اگه درباره قوانین سوالی داری یا ابهامی وجود داره، تیم پشتیبانی
                آماده کمکه.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                تماس با پشتیبانی
              </Link>
            </div>
          </div>
        </div>

        {/* لینک‌های مرتبط */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 mb-3">
            صفحات مرتبط
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/about"
              className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
            >
              <span className="text-base">📖</span>
              <span className="text-xs font-medium text-gray-700">
                درباره ما
              </span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98]"
            >
              <span className="text-base">📞</span>
              <span className="text-xs font-medium text-gray-700">
                تماس با ما
              </span>
            </Link>
          </div>
        </div>

        {/* پذیرش قوانین */}
        <div className="text-center py-2">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            با استفاده از فریلنسرکار، شما این قوانین را پذیرفته‌اید.
            <br />© ۱۴۰۳ فریلنسرکار
          </p>
        </div>
      </div>
    </div>
  );
}