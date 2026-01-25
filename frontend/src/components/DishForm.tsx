// src/components/DishForm.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import ImageUploader from './ImageUploader';

type Props = {
  restaurantId: string | null;
  initial?: any | null; // existing dish
  loading?: boolean;
  onSubmit: (payload: any) => void;
  submitLabel?: string;
};

export default function DishForm({
  restaurantId,
  initial,
  loading,
  onSubmit,
  submitLabel = 'Save',
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [available, setAvailable] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tagsRaw, setTagsRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? '');
      setDescription(initial.description ?? '');
      setPrice(initial.price ?? initial.amount ?? '');
      setCategoryId(initial.categoryId ?? initial.category?.id ?? null);
      setAvailable(
        initial.available === undefined ? (initial.isAvailable ?? true) : initial.available,
      );
      setImageUrl(initial.imageUrl ?? initial.bannerUrl ?? initial.photo ?? null);
      const tags = initial.tags ?? initial.tagsList ?? [];
      setTagsRaw(Array.isArray(tags) ? tags.join(',') : typeof tags === 'string' ? tags : '');
    }
  }, [initial]);

  useEffect(() => {
    if (!restaurantId) return;
    api
      .get(`/api/${restaurantId}/categories`)
      .then((res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.categories ?? []);
        setCategories(arr);
      })
      .catch((e) => {
        console.warn('Failed load categories', e);
        setCategories([]);
      });
  }, [restaurantId]);

  async function createCategoryInline(name: string) {
    if (!restaurantId || !name) return;
    try {
      const res = await api.post(`/api/${restaurantId}/categories`, { name });
      const created = res.data;
      setCategories((s) => [created, ...s]);
      setCategoryId(created.id);
    } catch (err) {
      console.error('Failed to create category', err);
      alert('Failed to create category');
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!name) return setError('Name is required');
    if (!price || Number(price) <= 0) return setError('Price must be > 0');
    setSubmitting(true);
    const payload: any = {
      name,
      description,
      price: Number(price),
      categoryId,
      isAvailable: available,
      imageUrl,
      tags: tagsRaw.trim(),
    };
    try {
      await onSubmit(payload);
    } catch (err: any) {
      console.error('Submit failed', err);
      setError(err?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Burger"
            className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about this dish..."
            className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Price (₹)</label>
            <input
              type="number"
              value={price as any}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Category</label>
            <div className="flex gap-2">
              <select
                value={categoryId ?? categories[0]?.id ?? ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all flex-1"
              >
                <option value="" disabled>-- select --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const nm = prompt('New category name');
                  if (nm) createCategoryInline(nm);
                }}
                className="h-11 px-4 border border-blue-100 bg-blue-50/30 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
              >
                + New
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Availability</label>
            <div className="h-11 flex items-center bg-gray-50/50 border border-gray-100 rounded-xl px-4">
              <label className="inline-flex items-center gap-3 cursor-pointer group w-full">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${available ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${available ? 'text-green-600' : 'text-gray-500'}`}>
                  {available ? 'Show on menu' : 'Hidden'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Dish Image</label>
          <div className="mt-1">
            <ImageUploader
              value={imageUrl ?? null}
              uploadUrl="/api/uploads"
              onUploadSuccess={(url) => setImageUrl(url)}
              onError={(e) => setError(String(e?.message ?? e))}
              autoUpload={true}
            />
          </div>
          {imageUrl && (
            <div className="mt-2 text-[10px] font-bold text-blue-600 truncate border border-blue-100 bg-blue-50/30 px-3 py-1.5 rounded-lg">
              Uploaded: <a href={imageUrl} target="_blank" rel="noreferrer" className="underline">{imageUrl}</a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tags (comma separated)</label>
          <input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            placeholder="e.g. spicy, veg, chef-special"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-4">{error}</div>}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-50">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="h-11 px-8 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || loading}
          className="h-11 px-10 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
