// app/components/PostCard.tsx
import Link from "next/link";
import { categoryLabel } from "@/app/constants/categories";

interface PostCardProps {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  timeAgo: string;
  image?: string;
}

// 🔑 تبدیل عدد به فارسی با جداکننده هزارگان
function formatPrice(price: string | number | null | undefined): string {
  if (!price) return "";

  const numericValue = String(price).replace(/[^\d]/g, "");
  if (!numericValue) return "";

  const num = Number(numericValue);
  if (num <= 0) return "";

  // تبدیل به فرمت فارسی با جداکننده هزارگان
  return num.toLocaleString("fa-IR");
}

export default function PostCard({
  id,
  title,
  price,
  category,
  location,
  timeAgo,
  image,
}: PostCardProps) {
  const displayCategory = categoryLabel(category) || category;
  const formattedPrice = formatPrice(price);
  const isContact = !formattedPrice;

  return (
    <Link
      href={`/post/${id}`}
      className="group block bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 active:scale-[0.99] transition-all duration-200"
    >
      <div className="flex gap-3">
        {/* تصویر / آیکون */}
        <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center shrink-0 border border-blue-100/50">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <>
              <div className="absolute top-1 right-1 w-8 h-8 bg-white/60 rounded-full blur-md" />
              <span className="relative text-3xl drop-shadow-sm">📄</span>
            </>
          )}
        </div>

        {/* محتوا */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* عنوان */}
          <h3 className="font-bold text-gray-800 text-sm leading-relaxed line-clamp-2 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>

          {/* دسته و موقعیت */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1 min-w-0 bg-blue-50/60 text-blue-700 px-2 py-0.5 rounded-md">
              <span className="text-[10px] shrink-0">📂</span>
              <span className="truncate font-medium">{displayCategory}</span>
            </span>
            <span className="flex items-center gap-1 min-w-0">
              <svg
                className="w-3 h-3 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{location}</span>
            </span>
          </div>

          {/* قیمت و زمان */}
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {timeAgo}
            </span>

            {isContact ? (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                🤝 توافقی
              </span>
            ) : (
              <div className="text-left flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-green-700 tracking-tight">
                  {formattedPrice}
                </span>
                <span className="text-[10px] font-medium text-green-600">
                  تومان
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}