// app/components/FilterModal.tsx
'use client';
import { useState, useEffect } from "react";
import { useCategories, getCategoryBySlug } from "@/app/hooks/useCategories";

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  subCategory?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug?: string;
  onApply?: (values: FilterValues) => void;
}

export function FilterModal({
  isOpen,
  onClose,
  categorySlug,
  onApply,
}: FilterModalProps) {
  const { categories } = useCategories();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  const category = categorySlug ? getCategoryBySlug(categories, categorySlug) : null;

  // 🔑 بستن با کلید Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // 🔑 قفل اسکرول body هنگام باز بودن
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply?.({
      minPrice: priceRange[0] || undefined,
      maxPrice: priceRange[1] || undefined,
      location: selectedLocation || undefined,
      subCategory: selectedSub || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setPriceRange([0, 10_000_000]);
    setSelectedLocation("");
    setSelectedSub("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md lg:max-w-lg rounded-t-2xl lg:rounded-2xl animate-slide-up lg:animate-fade-in shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر */}
        <div className="sticky top-0 bg-white lg:rounded-t-2xl border-b border-gray-100 px-4 lg:px-6 py-3 lg:py-4 flex justify-between items-center z-10">
          <h2 className="text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl lg:text-2xl">⚙️</span>
            فیلتر پیشرفته
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors active:scale-95"
            aria-label="بستن"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* محتوا */}
        <div className="p-4 lg:p-6 space-y-5 lg:space-y-6">
          {/* محدوده قیمت */}
          <div>
            <label className="block font-semibold text-sm lg:text-base text-gray-800 mb-3">
              💰 محدوده قیمت (تومان)
            </label>
            <div className="flex gap-3 lg:gap-4 items-center">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="flex-1 p-2.5 lg:p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="حداقل"
                dir="ltr"
              />
              <span className="text-sm text-gray-500 shrink-0">تا</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="flex-1 p-2.5 lg:p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="حداکثر"
                dir="ltr"
              />
            </div>
          </div>

          {/* زیردسته */}
          {category && category.sub.length > 0 && (
            <div>
              <label className="block font-semibold text-sm lg:text-base text-gray-800 mb-3">
                📂 زیردسته
              </label>
              <div className="relative">
                <select
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  className="w-full p-2.5 lg:p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="">همه زیردسته‌ها</option>
                  {category.sub.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* موقعیت مکانی */}
          <div>
            <label className="block font-semibold text-sm lg:text-base text-gray-800 mb-3">
              📍 موقعیت مکانی
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2.5 lg:p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">همه شهرها</option>
                <option value="تهران">تهران</option>
                <option value="کرمانشاه">کرمانشاه</option>
                <option value="مشهد">مشهد</option>
                <option value="اصفهان">اصفهان</option>
                <option value="شیراز">شیراز</option>
                <option value="آنلاین">آنلاین</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-2 lg:pt-4">
            <button
              onClick={handleReset}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm lg:text-base hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              حذف فیلترها
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-[0.98] transition-all"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 1024px) {
          .lg\\:animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
        }
      `}</style>
    </div>
  );
}