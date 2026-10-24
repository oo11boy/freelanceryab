// app/profile/edit/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { profileAPI } from '@/app/services/api';

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'انتخاب کنید' },
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
  { value: 'expert', label: 'حرفه‌ای' },
];

// ✅ تابع کمکی برای تبدیل امن skills به آرایه
function parseSkills(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === 'string');
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => typeof s === 'string');
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

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    experience: string;
    bio: string;
    skills: string[];
  }>({
    full_name: '',
    email: '',
    experience: '',
    bio: '',
    skills: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // بارگذاری اطلاعات فعلی
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        experience: user.experience || '',
        bio: user.bio || '',
        skills: parseSkills(user.skills), // ✅ استفاده از تابع امن
      });
    }
  }, [user, token, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      // ✅ اطمینان از آرایه بودن
      const currentSkills = Array.isArray(formData.skills)
        ? formData.skills
        : [];
      if (!currentSkills.includes(skill) && currentSkills.length < 20) {
        setFormData({
          ...formData,
          skills: [...currentSkills, skill],
        });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const currentSkills = Array.isArray(formData.skills)
      ? formData.skills
      : [];
    setFormData({
      ...formData,
      skills: currentSkills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // اعتبارسنجی
    if (!formData.full_name.trim()) {
      setError('نام کامل الزامی است');
      return;
    }

    if (formData.full_name.trim().length < 3) {
      setError('نام کامل باید حداقل ۳ کاراکتر باشد');
      return;
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setError('ایمیل معتبر وارد کنید');
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
        setSuccess('پروفایل با موفقیت به‌روزرسانی شد');
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  // ✅ اطمینان نهایی قبل از رندر
  const safeSkills = Array.isArray(formData.skills) ? formData.skills : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* هدر */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-600 text-2xl"
        >
          ←
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">ویرایش پروفایل</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* نام کامل */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">
            نام و نام خانوادگی <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="مثال: علی محمدی"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
        </div>

        {/* ایمیل */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">
            ایمیل <span className="text-gray-400 text-xs">(اختیاری)</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>

        {/* سطح تجربه */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">سطح تجربه</label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* بیوگرافی */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">درباره من</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            placeholder="کمی از خودتان و تخصص‌هایتان بنویسید..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">
            {formData.bio.length}/500
          </p>
        </div>

        {/* مهارت‌ها */}
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">مهارت‌ها</label>
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillAdd}
            placeholder="تایپ کنید و Enter بزنید (مثال: React, Python)"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {/* ✅ استفاده از safeSkills */}
            {safeSkills.map((skill, idx) => (
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
          {safeSkills.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              هنوز مهارتی اضافه نکرده‌اید
            </p>
          )}
        </div>

        {/* پیام‌ها */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* دکمه‌ها */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-blue-400"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      </form>
    </div>
  );
}