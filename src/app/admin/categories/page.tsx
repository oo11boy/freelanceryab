'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  is_active: number;
  posts_count?: number;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  db_name: string;
  icon: string;
  color: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  posts_count?: number;
  subcategories: Subcategory[];
  sub: string[];
}

export default function AdminCategoriesPage() {
  const { token, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // فرم
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    slug: '', name: '', db_name: '', icon: '📁', color: 'gray',
    description: '', sort_order: '0', is_active: true,
  });
  const [subsInput, setSubsInput] = useState<string[]>([]);
  const [subInput, setSubInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({
        slug: cat.slug,
        name: cat.name,
        db_name: cat.db_name,
        icon: cat.icon,
        color: cat.color,
        description: cat.description || '',
        sort_order: String(cat.sort_order),
        is_active: cat.is_active === 1,
      });
      setSubsInput(cat.subcategories?.map((s) => s.name) || []);
    } else {
      setEditingId(null);
      setFormData({
        slug: '', name: '', db_name: '', icon: '📁', color: 'gray',
        description: '', sort_order: '0', is_active: true,
      });
      setSubsInput([]);
    }
    setFormError('');
    setShowForm(true);
  };

  const addSub = () => {
    const v = subInput.trim();
    if (!v) return;
    if (subsInput.includes(v)) {
      setSubInput('');
      return;
    }
    setSubsInput([...subsInput, v]);
    setSubInput('');
  };

  const removeSub = (i: number) => {
    setSubsInput(subsInput.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setFormError('');
    if (!formData.slug.trim() || !formData.name.trim() || !formData.db_name.trim()) {
      setFormError('slug، name و db_name الزامی است');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          sort_order: parseInt(formData.sort_order) || 0,
          is_active: formData.is_active,
          subcategories: subsInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا');

      setShowForm(false);
      loadCategories();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`آیا از حذف دسته «${cat.name}» مطمئنید؟`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadCategories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: cat.is_active === 1 ? 0 : 1 }),
      });
      if (!res.ok) throw new Error();
      loadCategories();
    } catch {
      alert('خطا');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            {categories.length} دسته • {categories.reduce((s, c) => s + c.subcategories.length, 0)} زیردسته
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          دسته جدید
        </button>
      </div>

      {/* فرم */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">
              {editingId ? 'ویرایش دسته' : 'دسته جدید'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                slug (انگلیسی) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="programming"
                dir="ltr"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                نام نمایشی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="برنامه‌نویسی"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                db_name (ذخیره در posts) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.db_name}
                onChange={(e) => setFormData({ ...formData, db_name: e.target.value })}
                placeholder="برنامه‌نویسی و وب"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                ⚠️ این مقدار توی ستون category آگهی‌ها ذخیره می‌شه
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">آیکون</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="💻"
                maxLength={4}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">رنگ</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['blue', 'green', 'purple', 'pink', 'yellow', 'indigo', 'orange', 'red', 'gray'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">ترتیب نمایش</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                dir="ltr"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">توضیحات (اختیاری)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">فعال (نمایش در اپ)</label>
          </div>

          {/* زیردسته‌ها */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              زیردسته‌ها ({subsInput.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }}
                placeholder="نام زیردسته"
                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSub}
                disabled={!subInput.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subsInput.map((sub, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => removeSub(i)}
                    className="w-4 h-4 rounded-full bg-blue-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {formError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{formError}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowForm(false)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md disabled:opacity-50"
            >
              {saving ? '...' : editingId ? 'ذخیره تغییرات' : 'ساخت دسته'}
            </button>
          </div>
        </div>
      )}

      {/* لیست */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-700 font-semibold mb-1">دسته‌بندی‌ای وجود ندارد</p>
            <p className="text-sm text-gray-500">اولین دسته رو بساز!</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
                cat.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-${cat.color}-50 flex items-center justify-center text-2xl shrink-0`}>
                  {cat.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-sm text-gray-800">{cat.name}</span>
                    {!cat.is_active && (
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono" dir="ltr">
                    {cat.slug} → {cat.db_name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {cat.subcategories.length} زیردسته • {cat.posts_count || 0} آگهی
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                    title="زیردسته‌ها"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedId === cat.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      cat.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}
                    title={cat.is_active ? 'غیرفعال' : 'فعال'}
                  >
                    {cat.is_active ? '✓' : '×'}
                  </button>
                  <button
                    onClick={() => openForm(cat)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                    title="ویرایش"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* زیردسته‌ها */}
              {expandedId === cat.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 animate-fade-in">
                  <div className="text-[10px] font-semibold text-gray-500 mb-2">زیردسته‌ها:</div>
                  {cat.subcategories.length === 0 ? (
                    <p className="text-xs text-gray-400">زیردسته‌ای تعریف نشده</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded-lg border border-gray-200"
                        >
                          {sub.name}
                          {sub.posts_count ? (
                            <span className="text-[9px] text-gray-400 mr-1">({sub.posts_count})</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}