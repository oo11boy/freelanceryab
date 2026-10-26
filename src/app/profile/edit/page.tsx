// app/profile/edit/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useUILayout } from "@/app/hooks/useUILayout";
import { profileAPI } from "@/app/services/api";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "انتخاب کنید", icon: "—" },
  { value: "beginner", label: "مبتدی", icon: "🌱" },
  { value: "intermediate", label: "متوسط", icon: "⚡" },
  { value: "advanced", label: "پیشرفته", icon: "🔥" },
  { value: "expert", label: "حرفه‌ای", icon: "👑" },
];

function parseSkills(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === "string");
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => typeof s === "string");
      }
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const { setHideBottomNav } = useUILayout();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    experience: string;
    bio: string;
    skills: string[];
  }>({
    full_name: "",
    email: "",
    experience: "",
    bio: "",
    skills: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setHideBottomNav(true);
    return () => setHideBottomNav(false);
  }, [setHideBottomNav]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        experience: user.experience || "",
        bio: user.bio || "",
        skills: parseSkills(user.skills),
      });
    }
  }, [user, token, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
    setIsDirty(true);
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      const currentSkills = Array.isArray(formData.skills)
        ? formData.skills
        : [];
      if (!currentSkills.includes(skill) && currentSkills.length < 20) {
        setFormData({
          ...formData,
          skills: [...currentSkills, skill],
        });
        setIsDirty(true);
      }
      setSkillInput("");
    }
  };

  const handleAddSkillClick = () => {
    if (skillInput.trim()) {
      const skill = skillInput.trim();
      const currentSkills = Array.isArray(formData.skills)
        ? formData.skills
        : [];
      if (!currentSkills.includes(skill) && currentSkills.length < 20) {
        setFormData({
          ...formData,
          skills: [...currentSkills, skill],
        });
        setIsDirty(true);
      }
      setSkillInput("");
      skillInputRef.current?.focus();
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const currentSkills = Array.isArray(formData.skills) ? formData.skills : [];
    setFormData({
      ...formData,
      skills: currentSkills.filter((s) => s !== skill),
    });
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.full_name.trim()) {
      setError("نام کامل الزامی است");
      nameInputRef.current?.focus();
      return;
    }

    if (formData.full_name.trim().length < 3) {
      setError("نام کامل باید حداقل ۳ کاراکتر باشد");
      nameInputRef.current?.focus();
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("ایمیل معتبر وارد کنید");
      return;
    }

    setLoading(true);

    try {
      const data = await profileAPI.updateProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        experience: formData.experience || null,
        bio: formData.bio.trim() || null,
        skills: Array.isArray(formData.skills) ? formData.skills : [],
      });

      if (data.success && data.user) {
        updateUser(data.user);
        setSuccess("پروفایل با موفقیت به‌روزرسانی شد ✓");
        setIsDirty(false);
        setTimeout(() => {
          router.push("/profile");
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "خطا در ذخیره اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !success) {
      if (!confirm("تغییرات ذخیره نشده. آیا خارج می‌شوید؟")) return;
    }
    router.back();
  };

  if (!token) return null;

  const safeSkills = Array.isArray(formData.skills) ? formData.skills : [];
  const currentExp = EXPERIENCE_OPTIONS.find(
    (o) => o.value === formData.experience,
  );

  // 🔑 دکمه‌های اکشن مشترک
  const ActionButtons = () => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleBack}
        disabled={loading}
        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors active:scale-[0.98] disabled:opacity-50"
      >
        انصراف
      </button>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            در حال ذخیره...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            ذخیره تغییرات
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 pb-28 lg:pb-12">
      {/* ===== نوار بالا موبایل ===== */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={handleBack}
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
          <div className="flex-1 text-center">
            <h1 className="text-base font-bold text-gray-800">
              ویرایش پروفایل
            </h1>
            <p className="text-[10px] text-gray-500">
              اطلاعات عمومی نمایش داده می‌شود
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* ===== هدر دسکتاپ ===== */}
      <div className="hidden lg:block max-w-5xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ویرایش پروفایل</h1>
            <p className="text-sm text-gray-500 mt-1">
              اطلاعات شما برای دیگران نمایش داده می‌شود
            </p>
          </div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <svg
              className="w-5 h-5 rotate-180"
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
            بازگشت به پروفایل
          </button>
        </div>
      </div>

      {/* ===== محتوا ===== */}
      <div className="max-w-5xl mx-auto lg:px-6 lg:mt-6">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">

          {/* ===== ستون فرم ===== */}
          <form onSubmit={handleSubmit} className="p-4 lg:p-0 space-y-4 lg:space-y-5">

            {/* کارت هدایت */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="text-3xl lg:text-4xl">✨</div>
                <div className="flex-1">
                  <h2 className="font-bold text-sm lg:text-lg mb-1">
                    پروفایل خودت رو برجسته کن!
                  </h2>
                  <p className="text-xs lg:text-sm opacity-90 leading-relaxed">
                    پروفایل کامل، شانس دیده شدن شما توسط کارفرماها رو چند برابر
                    می‌کنه
                  </p>
                </div>
              </div>
            </div>

            {/* نام کامل */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-700 mb-3">
                <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm lg:text-base">
                  👤
                </span>
                نام و نام خانوادگی
                <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="مثال: علی محمدی"
                className="w-full p-3.5 lg:p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                maxLength={100}
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-[10px] lg:text-xs text-gray-400">
                  {formData.full_name.length}/100
                </span>
              </div>
            </div>

            {/* ایمیل */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-700 mb-3">
                <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-purple-50 flex items-center justify-center text-sm lg:text-base">
                  ✉️
                </span>
                ایمیل
                <span className="text-[10px] lg:text-xs text-gray-400 font-normal">
                  (اختیاری)
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full p-3.5 lg:p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                dir="ltr"
              />
              <p className="text-[10px] lg:text-xs text-gray-400 mt-1.5">
                برای اطلاع‌رسانی پروژه‌ها و اعلان‌های مهم استفاده می‌شود
              </p>
            </div>

            {/* سطح تجربه */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-700 mb-3">
                <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-amber-50 flex items-center justify-center text-sm lg:text-base">
                  🏆
                </span>
                سطح تجربه
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {EXPERIENCE_OPTIONS.filter((o) => o.value).map((opt) => {
                  const isActive = formData.experience === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, experience: opt.value });
                        setIsDirty(true);
                        setError("");
                        setSuccess("");
                      }}
                      className={`p-3 lg:p-4 rounded-xl border-2 text-center transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        isActive
                          ? "border-amber-500 bg-amber-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg lg:text-xl">{opt.icon}</span>
                      <span
                        className={`text-xs lg:text-sm font-semibold ${
                          isActive ? "text-amber-700" : "text-gray-600"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {currentExp && currentExp.value && (
                <p className="text-[10px] lg:text-xs text-amber-700 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  سطح فعلی: {currentExp.label} — می‌توانید تغییر دهید
                </p>
              )}
            </div>

            {/* بیوگرافی */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-700 mb-3">
                <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm lg:text-base">
                  📝
                </span>
                درباره من
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="کمی از خودتان، تخصص‌ها و تجربیات کاری‌تان بنویسید..."
                className="w-full p-3.5 lg:p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                maxLength={500}
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-[10px] lg:text-xs text-gray-400">
                  پروفایل‌های کامل ۳ برابر بیشتر دیده می‌شوند
                </p>
                <span
                  className={`text-[10px] lg:text-xs ${
                    formData.bio.length > 450
                      ? "text-amber-600 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {formData.bio.length}/500
                </span>
              </div>
            </div>

            {/* مهارت‌ها */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <label className="flex items-center justify-between text-sm lg:text-base font-semibold text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm lg:text-base">
                    🎯
                  </span>
                  مهارت‌ها
                </div>
                {safeSkills.length > 0 && (
                  <span className="text-[10px] lg:text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {safeSkills.length}/20
                  </span>
                )}
              </label>

              <div className="flex gap-2">
                <input
                  ref={skillInputRef}
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillAdd}
                  placeholder="مثلاً React یا Python"
                  className="flex-1 p-3.5 lg:p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={handleAddSkillClick}
                  disabled={!skillInput.trim() || safeSkills.length >= 20}
                  className="w-[54px] h-[54px] lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all shrink-0"
                  aria-label="افزودن مهارت"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>

              {safeSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {safeSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="w-5 h-5 rounded-full bg-blue-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                        aria-label={`حذف ${skill}`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {safeSkills.length === 0 && (
                <div className="mt-3 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs lg:text-sm text-gray-400">
                    هنوز مهارتی اضافه نکرده‌اید
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">
                    مهارت‌های بیشتر = شانس بیشتر برای دیده شدن
                  </p>
                </div>
              )}
            </div>

            {/* پیام‌ها */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
                <span className="text-lg shrink-0">⚠️</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
                <span className="text-lg shrink-0">✓</span>
                <span className="leading-relaxed">{success}</span>
              </div>
            )}
          </form>

          {/* ===== Sidebar دسکتاپ ===== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">

              {/* کارت اقدام */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">
                  ذخیره تغییرات
                </h3>
                <ActionButtons />
                <p className="text-[10px] text-gray-400 mt-3 text-center leading-relaxed">
                  تغییرات پس از ذخیره، فوراً در پروفایل نمایش داده می‌شود
                </p>
              </div>

              {/* کارت راهنما */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="text-2xl shrink-0">💡</div>
                  <h4 className="font-bold text-blue-900 text-sm">
                    نکات مهم
                  </h4>
                </div>
                <ul className="space-y-2 text-xs text-blue-800 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>نام کامل شما برای همه قابل مشاهده است</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>ایمیل اختیاری است ولی برای اطلاع‌رسانی مفید است</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>مهارت‌های بیشتر = شانس بیشتر برای دیده شدن</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>بیوگرافی خوب، اعتماد کارفرما را جلب می‌کند</span>
                  </li>
                </ul>
              </div>

              {/* کارت پیشرفت (اختیاری) */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-800 text-sm mb-3">
                  تکمیل پروفایل
                </h4>
                {(() => {
                  const checks = [
                    formData.full_name.trim().length >= 3,
                    !!formData.email,
                    !!formData.experience,
                    formData.bio.trim().length >= 20,
                    safeSkills.length >= 3,
                  ];
                  const done = checks.filter(Boolean).length;
                  const percent = Math.round((done / checks.length) * 100);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {done} از {checks.length} مورد
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {percent}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== دکمه‌های ثابت پایین موبایل ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 max-w-md mx-auto shadow-2xl z-50 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <ActionButtons />
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}