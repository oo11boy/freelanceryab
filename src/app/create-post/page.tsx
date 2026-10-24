"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { postsAPI } from "@/app/services/api";
import { CATEGORIES, getCategoryByDbName } from "@/app/constants/categories";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",          // ← dbName (مقدار دقیق دیتابیس)
    sub_category: "",
    price: "",
    price_type: "fixed",
    description: "",
    location: "",
    skills: [] as string[],
    deadline: "",
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [token, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }
  if (!token) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, skillInput.trim()],
        });
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) =>
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.description) {
      alert("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }

    setSaving(true);
    try {
      await postsAPI.createPost({
        user_id: user?.id,
        ...formData,
        // category از قبل dbName است → نیازی به تبدیل نیست
      });
      alert("آگهی شما با موفقیت ثبت شد!");
      router.push("/profile");
    } catch (error: any) {
      alert(error.message || "خطا در ثبت آگهی");
    } finally {
      setSaving(false);
    }
  };

  // دسته انتخاب‌شده برای نمایش زیردسته‌ها
  const selectedCat = getCategoryByDbName(formData.category);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-2xl">←</button>
        <h1 className="text-lg font-bold flex-1 text-center">ثبت آگهی جدید</h1>
      </div>

      {/* مراحل */}
      <div className="flex border-b bg-white px-4 pt-2">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`flex-1 text-center pb-2 ${
              step >= num
                ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            مرحله {num}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* --- مرحله ۱ --- */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                عنوان آگهی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="مثال: برنامه‌نویس ری‌اکت برای پروژه فروشگاهی"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                دسته‌بندی <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                required
                className="w-full p-3 border rounded-lg"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">انتخاب کنید</option>
                {CATEGORIES.map((cat) => (
                  // 🔑 value = dbName (مقدار دیتابیس)
                  <option key={cat.id} value={cat.dbName}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCat && (
              <div>
                <label className="block text-sm font-semibold mb-2">زیردسته</label>
                <select
                  name="sub_category"
                  className="w-full p-3 border rounded-lg"
                  value={formData.sub_category}
                  onChange={handleChange}
                >
                  <option value="">انتخاب کنید</option>
                  {selectedCat.sub.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={nextStep}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              مرحله بعد
            </button>
          </div>
        )}

        {/* --- مرحله ۲ --- */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">نرخ هزینه</label>
              <div className="flex gap-3 mb-3">
                {[
                  { value: "fixed", label: "مبلغ ثابت" },
                  { value: "hourly", label: "ساعتی" },
                  { value: "contact", label: "توافقی" },
                ].map((type) => (
                  <label key={type.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="price_type"
                      value={type.value}
                      checked={formData.price_type === type.value}
                      onChange={handleChange}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
              {formData.price_type !== "contact" && (
                <input
                  type="text"
                  name="price"
                  placeholder={
                    formData.price_type === "fixed"
                      ? "مبلغ به تومان"
                      : "نرخ ساعتی به تومان"
                  }
                  className="w-full p-3 border rounded-lg"
                  value={formData.price}
                  onChange={handleChange}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                توضیحات کامل <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={6}
                placeholder="شرح کامل پروژه، نیازمندی‌ها و انتظارات خود را بنویسید..."
                className="w-full p-3 border rounded-lg"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">مهارت‌های مورد نیاز</label>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillAdd}
                placeholder="تایپ کنید و Enter بزنید (مثال: React, Python)"
                className="w-full p-3 border rounded-lg"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-300 p-3 rounded-lg font-semibold"
              >
                قبلی
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold"
              >
                بعدی
              </button>
            </div>
          </div>
        )}

        {/* --- مرحله ۳ --- */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">موقعیت مکانی</label>
              <input
                type="text"
                name="location"
                placeholder="شهر خود را وارد کنید"
                className="w-full p-3 border rounded-lg"
                value={formData.location}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">اختیاری - برای پروژه‌های حضوری</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">مهلت انجام (اختیاری)</label>
              <input
                type="date"
                name="deadline"
                className="w-full p-3 border rounded-lg"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">خلاصه آگهی</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-600">عنوان:</span> {formData.title}</p>
                <p>
                  <span className="text-gray-600">دسته:</span>{" "}
                  {selectedCat?.name}
                </p>
                <p><span className="text-gray-600">قیمت:</span> {formData.price || "توافقی"}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-300 p-3 rounded-lg font-semibold"
              >
                قبلی
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold disabled:bg-green-400"
              >
                {saving ? "در حال ثبت..." : "ثبت آگهی"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}