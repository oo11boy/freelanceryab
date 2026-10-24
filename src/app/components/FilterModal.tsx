"use client";
import { useState } from "react";
import { getCategoryBySlug } from "@/app/constants/categories";

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div
        className="bg-white w-full max-w-md rounded-t-2xl animate-slide-up"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">فیلتر پیشرفته</h2>
          <button onClick={onClose} className="text-2xl text-gray-500">✕</button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label className="block font-semibold mb-3">محدوده قیمت (تومان)</label>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="flex-1 p-2 border rounded-lg"
                placeholder="حداقل"
              />
              <span>تا</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="flex-1 p-2 border rounded-lg"
                placeholder="حداکثر"
              />
            </div>
          </div>

          {category && category.sub.length > 0 && (
            <div>
              <label className="block font-semibold mb-3">زیردسته</label>
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">همه زیردسته‌ها</option>
                {category.sub.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-3">موقعیت مکانی</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">همه شهرها</option>
              <option value="تهران">تهران</option>
              <option value="کرمانشاه">کرمانشاه</option>
              <option value="مشهد">مشهد</option>
              <option value="اصفهان">اصفهان</option>
              <option value="شیراز">شیراز</option>
              <option value="آنلاین">آنلاین</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold"
            >
              حذف فیلترها
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold"
            >
              اعمال فیلتر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}