// src/components/CategoryManager.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';

type Category = {
  id?: string;
  name: string;
  orderIndex?: number;
};

type Props = {
  restaurantId: string | null;
  onChange?: (categories: Category[]) => void;
};

export default function CategoryManager({ restaurantId, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setCategories([]);
      return;
    }
    setLoading(true);
    api
      .get(`/api/${restaurantId}/categories`)
      .then((res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.categories ?? []);
        // normalize orderIndex if missing
        const norm = arr.map((c: any, i: number) => ({
          id: c.id,
          name: c.name,
          orderIndex: c.orderIndex ?? i,
        }));
        norm.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategories(norm);
        onChange?.(norm);
      })
      .catch((e) => {
        console.warn('Failed load categories', e);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  async function createCategory() {
    if (!restaurantId) return alert('Select a restaurant');
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/${restaurantId}/categories`, { name: newName.trim() });
      const created = res.data;
      const next = [
        ...categories,
        { id: created.id, name: created.name, orderIndex: created.orderIndex ?? categories.length },
      ];
      setCategories(next);
      setNewName('');
      onChange?.(next);
    } catch (err) {
      console.error('Create category failed', err);
      alert('Failed to create category');
    } finally {
      setBusy(false);
    }
  }

  async function startEdit(cat: Category) {
    setEditingId(cat.id ?? null);
    setEditingName(cat.name);
  }

  async function saveEdit() {
    if (!restaurantId || !editingId) return;
    setBusy(true);
    try {
      await api.patch(`/api/${restaurantId}/categories/${editingId}`, { name: editingName });
      const next = categories.map((c) => (c.id === editingId ? { ...c, name: editingName } : c));
      setCategories(next);
      setEditingId(null);
      setEditingName('');
      onChange?.(next);
    } catch (err) {
      console.error('Edit failed', err);
      alert('Failed to update');
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(id?: string) {
    if (!restaurantId || !id) return;
    if (!confirm('Delete category? Dishes in that category might remain unchanged.')) return;
    setBusy(true);
    try {
      await api.delete(`/api/${restaurantId}/categories/${id}`);
      const next = categories.filter((c) => c.id !== id);
      setCategories(next);
      onChange?.(next);
    } catch (err) {
      console.error('Delete category failed', err);
      alert('Failed to delete category');
    } finally {
      setBusy(false);
    }
  }

  // Simple drag & drop reorder: swap positions
  function onDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData('text/plain', String(idx));
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(from)) return;
    const copy = [...categories];
    const [item] = copy.splice(from, 1);
    copy.splice(idx, 0, item);
    // reassign orderIndex
    const next = copy.map((c, i) => ({ ...c, orderIndex: i }));
    setCategories(next);
    onChange?.(next);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function persistOrder() {
    if (!restaurantId) return alert('No restaurant');
    setBusy(true);
    try {
      // backend may accept a reorder endpoint: /categories/reorder with order array
      const orderPayload = categories.map((c) => ({ id: c.id, orderIndex: c.orderIndex }));
      await api
        .patch(`/api/${restaurantId}/categories/reorder`, { order: orderPayload })
        .catch(() => {
          // if not supported, attempt individual patches
          return Promise.all(
            orderPayload.map((p: any) =>
              api.patch(`/api/${restaurantId}/categories/${p.id}`, { orderIndex: p.orderIndex }),
            ),
          );
        });
      alert('Saved order');
    } catch (err) {
      console.error('Persist order failed', err);
      alert('Failed to persist order (see console)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white p-3 rounded shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Categories</h3>
        <div className="flex items-center gap-2">
          <button onClick={persistOrder} className="px-2 py-1 border rounded" disabled={busy}>
            Save order
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          placeholder="New category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="p-2 border rounded"
        />
        <div>
          <button
            onClick={createCategory}
            className="px-3 py-1 bg-blue-600 text-white rounded"
            disabled={busy}
          >
            Create
          </button>
        </div>
        <div className="text-sm text-gray-500">Drag to reorder, then Save order</div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading categories...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-2">
        {categories.map((c, i) => (
          <div
            key={c.id ?? i}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDrop={(e) => onDrop(e, i)}
            onDragOver={onDragOver}
            className="p-2 border rounded flex items-center justify-between bg-white"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 text-xs text-gray-500">{i + 1}</div>
              {editingId === c.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="p-1 border rounded"
                />
              ) : (
                <div>{c.name}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId === c.id ? (
                <button onClick={saveEdit} className="px-2 py-1 border rounded">
                  Save
                </button>
              ) : (
                <button onClick={() => startEdit(c)} className="px-2 py-1 border rounded">
                  Edit
                </button>
              )}
              <button
                onClick={() => doDelete(c.id)}
                className="px-2 py-1 border rounded text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
