"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { postsAPI } from "@/app/services/api";
import { useCategories, getCategoryByDbName } from "@/app/hooks/useCategories";

const DEADLINE_OPTIONS = [
  { days: 1, label: "۱ روز" },
  { days: 3, label: "۳ روز" },
  { days: 7, label: "۱ هفته" },
  { days: 14, label: "۲ هفته" },
  { days: 30, label: "۱ ماه" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    sub_category: "",
    price: "",
    price_type: "fixed",
    description: "",
    location: "",
    skills: [] as string[],
  });

  const [deadlineDays, setDeadlineDays] = useState<number | "custom" | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [token, loading, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [step]);

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }
  if (!token) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: value, sub_category: "" }));
    } else if (name === "price") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, price: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    if (!formData.skills.includes(val)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setSkillInput("");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleRemoveSkill = (skill: string) =>
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "عنوان آگهی را وارد کنید";
      if (!formData.category) newErrors.category = "دسته‌بندی را انتخاب کنید";
    }
    if (currentStep === 2) {
      if (!formData.description.trim()) newErrors.description = "توضیحات را وارد کنید";
      if (formData.price_type !== "contact") {
        const priceNum = Number(formData.price.replace(/,/g, ""));
        if (!formData.price.trim()) newErrors.price = "قیمت را وارد کنید";
        else if (isNaN(priceNum) || priceNum <= 0) newErrors.price = "قیمت باید بیشتر از صفر باشد";
      }
      if (deadlineDays === "custom") {
        const n = Number(customDays);
        if (!customDays || n < 1 || n > 365) newErrors.deadline = "تعداد روز را بین ۱ تا ۳۶۵ وارد کنید";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  const computeDeadline = (): string => {
    const days = deadlineDays === "custom" ? Number(customDays) : deadlineDays ?? 0;
    if (!days || days < 1) return "";
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) { setStep(2); return; }

    setSaving(true);
    try {
      const result = await postsAPI.createPost({
        user_id: user?.id,
        ...formData,
        deadline: computeDeadline(),
      });

      if (result?.needs_approval) {
        alert('✅ آگهی شما ثبت شد و پس از تأیید ادمین نمایش داده می‌شه.');
      } else {
        alert('✅ آگهی شما با موفقیت منتشر شد!');
      }
      router.push("/profile?created=1");
    } catch (error: any) {
      alert(error.message || "خطا در ثبت آگهی");
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = getCategoryByDbName(categories, formData.category);

  const steps = [
    { num: 1, title: "اطلاعات پایه", icon: "📋" },
    { num: 2, title: "جزئیات و قیمت", icon: "💰" },
    { num: 3, title: "تأیید نهایی", icon: "✅" },
  ];

  const deadlineLabel =
    deadlineDays === "custom"
      ? customDays ? `${customDays} روز` : ""
      : deadlineDays
        ? DEADLINE_OPTIONS.find((o) => o.days === deadlineDays)?.label || ""
        : "";

  const formattedPrice = formData.price
    ? Number(formData.price).toLocaleString("fa-IR")
    : "";

  // ==================== کامپوننت Stepper ====================
  const Stepper = () => (
    <div className="flex border-t border-gray-100 lg:border-0 lg:bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100">
      {steps.map((s) => {
        const isActive = step === s.num;
        const isDone = step > s.num;
        const isClickable = s.num < step;
        return (
          <button
            key={s.num}
            type="button"
            onClick={() => { if (isClickable) setStep(s.num); }}
            disabled={!isClickable && !isActive}
            className={`flex-1 py-3 lg:py-4 flex flex-col lg:flex-row items-center lg:justify-center gap-1 lg:gap-2 transition-all lg:rounded-2xl ${
              isActive
                ? "bg-blue-50/50 lg:bg-blue-50"
                : isClickable
                  ? "hover:bg-gray-50 cursor-pointer"
                  : "cursor-default"
            }`}
          >
            <div
              className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-110 lg:scale-100"
                  : isDone
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {isDone ? "✓" : s.num}
            </div>
            <span className={`text-[10px] lg:text-sm ${
              isActive ? "text-blue-600 font-bold" : isDone ? "text-green-600 font-medium" : "text-gray-400 lg:text-gray-500"
            }`}>
              {s.title}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ==================== کامپوننت پیش‌نمایش ====================
  const PreviewCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <span>👁️</span> پیش‌نمایش آگهی
        </h3>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">عنوان</div>
          <div className="font-bold text-gray-800 text-sm leading-relaxed">
            {formData.title || <span className="text-gray-400 italic">عنوان وارد نشده</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-0.5">دسته</div>
            <div className="text-sm font-semibold text-gray-800">
              {selectedCat?.name || "—"}
            </div>
            {formData.sub_category && (
              <div className="text-xs text-gray-500 mt-0.5">{formData.sub_category}</div>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-0.5">قیمت</div>
            <div className="text-sm font-semibold text-gray-800" dir="ltr">
              {formData.price_type === "contact"
                ? "توافقی"
                : formattedPrice
                  ? `${formattedPrice} تومان`
                  : "—"}
            </div>
          </div>
        </div>

        {deadlineLabel && (
          <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-100">
            <div className="text-xs text-orange-600 mb-0.5">⏳ مهلت انجام</div>
            <div className="text-sm font-semibold text-orange-900">{deadlineLabel}</div>
          </div>
        )}

        {formData.location && (
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-xs text-gray-500 mb-0.5">📍 موقعیت</div>
            <div className="text-sm font-semibold text-gray-800">{formData.location}</div>
          </div>
        )}

        {formData.description && (
          <div>
            <div className="text-xs text-gray-500 mb-1">توضیحات</div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{formData.description}</p>
          </div>
        )}

        {formData.skills.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1.5">مهارت‌ها</div>
            <div className="flex flex-wrap gap-1.5">
              {formData.skills.map((skill, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 pb-24 lg:pb-12">
      {/* ===== نوار بالا موبایل ===== */}
      <div ref={headerRef} className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-800 text-center">ثبت آگهی جدید</h1>
            <p className="text-xs text-gray-500 text-center">مرحله {step} از ۳</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  step >= n ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <Stepper />
      </div>

      {/* ===== هدر دسکتاپ (اختصاصی صفحه، زیر Header سراسری) ===== */}
      <div className="hidden lg:block max-w-6xl mx-auto px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ثبت آگهی جدید</h1>
            <p className="text-sm text-gray-500 mt-1">
              مرحله {step} از ۳ — {steps[step - 1].title}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            انصراف و بازگشت
          </button>
        </div>

        <Stepper />
      </div>

      {/* ===== محتوا ===== */}
      <div className="max-w-6xl mx-auto lg:px-6 lg:mt-8">
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">

          {/* ===== ستون فرم ===== */}
          <form ref={formRef} onSubmit={handleSubmit} className="p-4 lg:p-0">
            {/* مرحله ۱ */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg shadow-blue-500/20">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl lg:text-4xl">✍️</div>
                    <div>
                      <h2 className="font-bold text-sm lg:text-lg mb-1">بیایید شروع کنیم!</h2>
                      <p className="text-xs lg:text-sm opacity-90 leading-relaxed">
                        عنوان و دسته‌بندی مناسب انتخاب کنید تا آگهی شما بهتر دیده شود
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white lg:rounded-2xl lg:p-6 lg:shadow-sm lg:border lg:border-gray-100 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      عنوان آگهی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="مثال: برنامه‌نویس ری‌اکت برای پروژه فروشگاهی"
                      className={`w-full p-3.5 lg:p-4 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.title ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      value={formData.title}
                      onChange={handleChange}
                      maxLength={100}
                    />
                    <div className="flex justify-between mt-1.5">
                      {errors.title ? (
                        <p className="text-xs text-red-500 flex items-center gap-1">⚠️ {errors.title}</p>
                      ) : <span />}
                      <span className="text-xs text-gray-400">{formData.title.length}/100</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      دسته‌بندی <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        className={`w-full p-3.5 lg:p-4 bg-white border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all ${
                          errors.category ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        value={formData.category}
                        onChange={handleChange}
                      >
                        <option value="">انتخاب کنید</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.db_name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.category && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠️ {errors.category}</p>
                    )}
                  </div>

                  {selectedCat && selectedCat.sub.length > 0 && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        زیردسته <span className="text-gray-400 font-normal">(اختیاری)</span>
                      </label>
                      <div className="relative">
                        <select
                          name="sub_category"
                          className="w-full p-3.5 lg:p-4 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          value={formData.sub_category}
                          onChange={handleChange}
                        >
                          <option value="">انتخاب کنید</option>
                          {selectedCat.sub.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full lg:w-auto lg:px-8 lg:ml-auto lg:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  مرحله بعد
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* مرحله ۲ */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-white lg:rounded-2xl lg:p-6 lg:shadow-sm lg:border lg:border-gray-100 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">نرخ هزینه</label>
                    <div className="grid grid-cols-3 gap-2 lg:gap-3">
                      {[
                        { value: "fixed", label: "مبلغ ثابت", icon: "💵" },
                        { value: "hourly", label: "ساعتی", icon: "⏱️" },
                        { value: "contact", label: "توافقی", icon: "🤝" },
                      ].map((type) => {
                        const isActive = formData.price_type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                price_type: type.value,
                                price: type.value === "contact" ? "" : formData.price,
                              })
                            }
                            className={`p-3 lg:p-4 rounded-xl border-2 text-center transition-all ${
                              isActive
                                ? "border-blue-500 bg-blue-50 shadow-sm scale-[1.02]"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="text-2xl lg:text-3xl mb-1">{type.icon}</div>
                            <div className={`text-xs lg:text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-600"}`}>
                              {type.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formData.price_type !== "contact" && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        مبلغ {formData.price_type === "fixed" ? "(کل پروژه)" : "(ساعتی)"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="price"
                          inputMode="numeric"
                          placeholder="مثلاً ۵۰۰۰۰۰"
                          className={`w-full p-3.5 lg:p-4 pl-16 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                            errors.price ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                          }`}
                          value={formData.price}
                          onChange={handleChange}
                          dir="ltr"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">تومان</span>
                      </div>
                      {errors.price && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠️ {errors.price}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      توضیحات کامل <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows={7}
                      placeholder="شرح کامل پروژه، نیازمندی‌ها و انتظارات خود را بنویسید..."
                      className={`w-full p-3.5 lg:p-4 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                        errors.description ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      value={formData.description}
                      onChange={handleChange}
                      maxLength={2000}
                    />
                    <div className="flex justify-between mt-1.5">
                      {errors.description ? (
                        <p className="text-xs text-red-500 flex items-center gap-1">⚠️ {errors.description}</p>
                      ) : <span />}
                      <span className="text-xs text-gray-400">{formData.description.length}/2000</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      مهارت‌های مورد نیاز <span className="text-gray-400 font-normal">(اختیاری)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="مثلاً React یا Python"
                        className="flex-1 p-3.5 lg:p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        disabled={!skillInput.trim()}
                        className="w-[54px] h-[54px] lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.skills.map((skill, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="w-5 h-5 rounded-full bg-blue-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 lg:flex-none lg:px-8 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors active:scale-[0.98]"
                  >
                    قبلی
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 lg:flex-none lg:px-8 lg:ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}

            {/* مرحله ۳ */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-xl">💡</span>
                  <p className="text-xs lg:text-sm text-amber-800 leading-relaxed">
                    لطفاً قبل از ثبت، اطلاعات را یک بار مرور کنید. پس از ثبت می‌توانید آگهی را ویرایش کنید.
                  </p>
                </div>

                <div className="bg-white lg:rounded-2xl lg:p-6 lg:shadow-sm lg:border lg:border-gray-100 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      موقعیت مکانی <span className="text-gray-400 font-normal">(اختیاری)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                      <input
                        type="text"
                        name="location"
                        placeholder="شهر خود را وارد کنید"
                        className="w-full p-3.5 lg:p-4 pr-11 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      مهلت انجام <span className="text-gray-400 font-normal">(اختیاری)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEADLINE_OPTIONS.map((opt) => {
                        const isActive = deadlineDays === opt.days;
                        return (
                          <button
                            key={opt.days}
                            type="button"
                            onClick={() => {
                              setDeadlineDays(isActive ? null : opt.days);
                              setCustomDays("");
                              setErrors((prev) => ({ ...prev, deadline: "" }));
                            }}
                            className={`px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                              isActive ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setDeadlineDays(deadlineDays === "custom" ? null : "custom");
                          setCustomDays("");
                        }}
                        className={`px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                          deadlineDays === "custom" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        دلخواه
                      </button>
                    </div>

                    {deadlineDays === "custom" && (
                      <div className="mt-3 animate-fade-in">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={customDays}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setCustomDays(v);
                              setErrors((prev) => ({ ...prev, deadline: "" }));
                            }}
                            placeholder="مثلاً ۱۰"
                            className={`w-full p-3.5 lg:p-4 pl-20 bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                              errors.deadline ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                            }`}
                            dir="ltr"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">روز</span>
                        </div>
                        {errors.deadline && <p className="text-xs text-red-500 mt-1.5">⚠️ {errors.deadline}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* پیش‌نمایش — فقط موبایل (در دسکتاپ در Sidebar هست) */}
                <div className="lg:hidden">
                  <PreviewCard />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={saving}
                    className="flex-1 lg:flex-none lg:px-8 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] lg:flex-none lg:px-10 lg:ml-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ثبت آگهی
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* ===== Sidebar دسکتاپ: پیش‌نمایش ===== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <PreviewCard />

              {/* راهنما */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-2.5">
                  <div className="text-2xl shrink-0">💡</div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm mb-1">نکته</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      هر چه توضیحات دقیق‌تر باشد، شانس دریافت پیشنهاد از فریلنسرهای حرفه‌ای بیشتر می‌شود.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}