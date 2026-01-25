// src/pages/Admin/AdminRestaurants.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import ImageUploader from '../../components/ImageUploader';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import RestaurantEditModal from '../../components/RestaurantEditModal';
import Button from '../../components/ui/Button';

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  timezone?: string;
  currency?: string;
  planId?: string;
  bannerUrl?: string | null;
  tables?: any[];
  address?: string;
  ownerUserId?: string | null;
};

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const [list, setList] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create/edit modal state
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // delete confirmation
  const [deleting, setDeleting] = useState<Restaurant | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  // form state for create/edit
  const emptyForm = {
    id: '',
    name: '',
    description: '',
    timezone: 'UTC',
    currency: 'INR',
    planId: 'free',
    bannerUrl: '',
    address: '',
    ownerUserId: loggedInUserEmail || null,
  };
  const [form, setForm] = useState<Restaurant>(emptyForm as Restaurant);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/restaurants/owner/' + loggedInUserEmail);
      // Handle both direct array and paginated response
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setList(data);
    } catch (err: any) {
      console.warn('Failed to load restaurants', err);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm as Restaurant);
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(r: Restaurant) {
    setForm({ ...r });
    setEditing(r);
    setIsModalOpen(true);
  }

  function onBannerUploaded(url: string) {
    setForm((s) => ({ ...s, bannerUrl: url }));
  }

  async function submitModal(e?: React.FormEvent) {
    e?.preventDefault();
    setModalSubmitting(true);
    try {
      if (editing) {
        // PATCH
        const payload: Partial<Restaurant> = {
          name: form.name,
          description: form.description,
          timezone: form.timezone,
          currency: form.currency,
          planId: form.planId,
          bannerUrl: form.bannerUrl,
          address: form.address,
        };
        const res = await api.patch(`/api/restaurants/${editing.id}`, payload);
        // update list
        // setList((prev) =>
        //   prev.map((p) => (p.id === editing.id ? res.data || { ...p, ...payload } : p)),
        // );
      } else {
        // POST create
        const payload: Partial<Restaurant> = {
          name: form.name,
          description: form.description,
          timezone: form.timezone,
          currency: form.currency,
          planId: form.planId,
          bannerUrl: form.bannerUrl,
          address: form.address,
          ownerUserId: form.ownerUserId,
        };
        const res = await api.post('/api/restaurants', payload);
        // setList((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      console.error('Save restaurant failed', err);
      setError(err?.response?.data?.message || 'Failed to save restaurant');
    } finally {
      setModalSubmitting(false);
    }
  }

  function confirmDelete(r: Restaurant) {
    setDeleting(r);
  }

  async function doDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.delete(`/api/restaurants/${deleting.id}`);
      setList((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (err: any) {
      console.error('Delete failed', err);
      setError(err?.response?.data?.message || 'Failed to delete restaurant');
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Restaurants</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} size="sm" className="flex-1 sm:flex-none font-bold shadow-lg shadow-blue-600/20">
            Create New
          </Button>
          <button 
            onClick={load} 
            className="h-9 px-4 border border-gray-100 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center bg-gray-50/30"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-4">{error}</div>}

      <div className="space-y-3">
        {list.length === 0 && !loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No restaurants found</div>
          </div>
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="p-4 sm:p-5 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner shrink-0">
                    {r.bannerUrl ? (
                      <img
                        src={r.bannerUrl}
                        alt={r.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-300 font-black uppercase tracking-tighter p-2 text-center leading-tight">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-base sm:text-lg font-black text-gray-900 truncate">{r.name}</span>
                       <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100/50">
                         {r.planId || 'free'}
                       </span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-bold line-clamp-1 mb-1">{r.description || 'No description provided'}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                       <span className="truncate">{r.address || 'No address set'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                  <button
                    className="h-8 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-blue-100/30 flex-1 sm:flex-none"
                    onClick={() => window.open(`${window.location.origin}/menu/${r.id}`, '_blank')}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => navigate(`/admin/restaurants/${r.id}/qr`)}
                    className="h-8 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-indigo-100/30 flex-1 sm:flex-none"
                  >
                    QR
                  </button>
                  <button 
                    className="h-8 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-gray-100 flex-1 sm:flex-none" 
                    onClick={() => openEdit(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-red-100/30"
                    onClick={() => confirmDelete(r)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitModal} className="bg-white rounded max-w-xl w-full p-4 shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">
                {editing ? 'Edit restaurant' : 'Create restaurant'}
              </h3>
              <button type="button" className="text-gray-600" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>

              <div>
                <label className="block text-sm">Short description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 p-2 border rounded w-full"
                  rows={2}
                />
              </div>

              <div>
                <label className="grid grid-cols-2 gap-2">Address</label>
                <input
                  value={form.address ?? ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Owner User ID {editing ? '(Readonly once assigned)' : ''}
                </label>
                <input
                  value={form.ownerUserId ?? ''}
                  onChange={(e) => setForm({ ...form, ownerUserId: e.target.value || null })}
                  className="mt-1 p-2 border rounded w-full"
                  disabled={!!editing}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">Timezone</label>
                  <input
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm">Currency</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm">Plan</label>
                <select
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="mt-1 p-2 border rounded"
                  disabled={!!editing}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm">Banner / logo (optional)</label>
                <div className="mt-1">
                  <ImageUploader
                    value={form.bannerUrl ?? null}
                    uploadUrl="/api/uploads"
                    onUploadSuccess={(url) => onBannerUploaded(url)}
                    onError={(e) => setError(String(e?.message ?? e))}
                    autoUpload={true}
                  />
                  {form.bannerUrl && (
                    <div className="mt-2 text-xs text-gray-600">
                      Uploaded:{' '}
                      <a
                        href={form.bannerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600"
                      >
                        {form.bannerUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded"
                disabled={modalSubmitting}
              >
                {modalSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )} */}

      <RestaurantEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={submitModal}
        form={form}
        setForm={setForm}
        editing={editing ? true : false}
        modalSubmitting={modalSubmitting}
        onBannerUploaded={onBannerUploaded}
        setError={setError}
      />

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded p-4 shadow max-w-sm w-full">
            <div className="mb-3">
              <div className="font-semibold">Delete restaurant</div>
              <div className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{deleting.name}</strong>? This action cannot
                be undone.
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setDeleting(null)}
                disabled={deletingBusy}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={doDelete}
                disabled={deletingBusy}
              >
                {deletingBusy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
