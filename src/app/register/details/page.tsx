// app/register/details/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { authAPI } from '@/app/services/api';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // اگر کاربر لاگین نیست، به login برود
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  // اگر کاربر از قبل نام دارد، به خانه برود
  useEffect(() => {
    if (user?.full_name && String(user.full_name).trim()) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // اعتبارسنجی سمت کلاینت
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('نام باید حداقل ۲ کاراکتر باشد');
      return;
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      setError('نام خانوادگی باید حداقل ۲ کاراکتر باشد');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.completeProfile(
        firstName.trim(),
        lastName.trim()
      );

      // به‌روزرسانی اطلاعات کاربر در context
      if (data.user) {
        updateUser(data.user);
      }

      // ریدایرکت به صفحه اصلی
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* هدر */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-800">خوش آمدید!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            برای ادامه، لطفاً نام و نام خانوادگی خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              نام <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثال: علی"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="مثال: محمدی"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg disabled:bg-blue-400 transition-all hover:bg-blue-700"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          شماره موبایل شما: {user?.phone}
        </p>
      </div>
    </div>
  );
}