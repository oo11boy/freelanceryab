import Link from "next/link";
import { categoryLabel } from "@/app/constants/categories";

interface PostCardProps {
  id: number;
  title: string;
  price: string;
  category: string;   // مقدار دیتابیس (مثل "برنامه‌نویسی و وب")
  location: string;
  timeAgo: string;
  image?: string;
}

export default function PostCard({
  id,
  title,
  price,
  category,
  location,
  timeAgo,
}: PostCardProps) {
  // تبدیل dbName به نام خوانا
  const displayCategory = categoryLabel(category) || category;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-3 p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition">
      <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
        <span className="text-gray-400 text-3xl">📄</span>
      </div>

      <Link href={`/post/${id}`} className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-800 text-base line-clamp-2">{title}</h3>
          <span className="text-green-700 font-bold mr-2 whitespace-nowrap">{price}</span>
        </div>

        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>📂</span> {displayCategory}
          </span>
          <span className="flex items-center gap-1">
            <span>📍</span> {location}
          </span>
        </div>

        <div className="text-xs text-gray-400 mt-2">{timeAgo}</div>
      </Link>
    </div>
  );
}