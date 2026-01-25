// src/components/CategoryManager.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { GripVertical, Plus, Save, Trash2, Edit2, Check, X } from 'lucide-react';

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
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

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

  function onDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData('text/plain', String(idx));
    setDraggingIdx(idx);
    // Visual feedback for the drag image (transparent pixel trick or just let browser handle)
  }

  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDraggingIdx(null);
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(from)) return;
    const copy = [...categories];
    const [item] = copy.splice(from, 1);
    copy.splice(idx, 0, item);
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
      const orderPayload = categories.map((c) => ({ id: c.id, orderIndex: c.orderIndex }));
      await api
        .patch(`/api/${restaurantId}/categories/reorder`, { order: orderPayload })
        .catch(() => {
          return Promise.all(
            orderPayload.map((p: any) =>
              api.patch(`/api/${restaurantId}/categories/${p.id}`, { orderIndex: p.orderIndex }),
            ),
          );
        });
      alert('Order saved successfully');
    } catch (err) {
      console.error('Persist order failed', err);
      alert('Failed to persist order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Manage Categories</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Drag to reorder items</p>
        </div>
        <button 
          onClick={persistOrder} 
          disabled={busy || categories.length === 0}
          className="h-10 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Ordering
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <input
            placeholder="Search or add new category..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full h-11 border border-gray-100 bg-gray-50/50 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={createCategory}
          disabled={busy || !newName.trim()}
          className="h-11 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading...</span>
        </div>
      )}
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold">{error}</div>}

      <div className="space-y-2">
        {categories.map((c, i) => (
          <div
            key={c.id ?? i}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDrop={(e) => onDrop(e, i)}
            onDragOver={onDragOver}
            onDragEnd={() => setDraggingIdx(null)}
            className={`group p-3 sm:p-4 bg-white border rounded-[20px] flex items-center justify-between transition-all duration-300 ${
              draggingIdx === i ? 'opacity-40 border-dashed border-blue-400 scale-95 shadow-inner' : 'border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 hover:border-blue-100'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="w-6 text-[10px] font-black text-gray-300 uppercase tracking-tighter shrink-0">{i + 1}</div>
              
              <div className="min-w-0 flex-1">
                {editingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      className="w-full border border-blue-200 bg-blue-50/20 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none transition-all"
                    />
                    <button onClick={saveEdit} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm font-black text-gray-700 truncate">{c.name}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!editingId && (
                <>
                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 border border-blue-50 text-blue-600 bg-blue-50/30 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => doDelete(c.id)}
                    className="p-2 border border-red-50 text-red-500 bg-red-50/30 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-[20px] border-2 border-dashed border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No categories yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
