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
    <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
      <div>
        <label className="block text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="block text-sm">Price</label>
          <input
            type="number"
            value={price as any}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm">Category</label>
          <div className="flex gap-2 mt-1">
            <select
              value={categoryId ?? categories[0]?.id ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="p-2 border rounded flex-1"
            >
              <option value="" disabled>
                -- none --
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const nm = prompt('New category name');
                if (nm) createCategoryInline(nm);
              }}
              className="px-2 py-1 border rounded"
            >
              + New
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm">Available</label>
          <div className="mt-1">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span className="text-sm">Show on menu</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm">Image</label>
        <div className="mt-2">
          <ImageUploader
            value={imageUrl ?? null}
            uploadUrl="/api/uploads"
            onUploadSuccess={(url) => setImageUrl(url)}
            onError={(e) => setError(String(e?.message ?? e))}
            autoUpload={true}
          />
        </div>
        {imageUrl && (
          <div className="mt-2 text-xs text-gray-600">
            Uploaded:{' '}
            <a href={imageUrl} target="_blank" rel="noreferrer" className="text-blue-600">
              {imageUrl}
            </a>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm">Tags (comma separated)</label>
        <input
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          className="mt-1 p-2 border rounded w-full"
          placeholder="e.g. spicy,veg,chef-special"
        />
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-3 py-1 border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || loading}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
