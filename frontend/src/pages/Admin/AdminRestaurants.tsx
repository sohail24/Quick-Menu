// src/pages/Admin/AdminRestaurants.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import ImageUploader from '../../components/ImageUploader';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';

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
    <div className="p-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Restaurants</h1>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="px-3 py-1 bg-blue-600 text-white rounded">
            Create
          </button>
          <button onClick={load} className="px-3 py-1 border rounded">
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading restaurants…</div>}
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="space-y-3">
        {list.length === 0 && !loading ? (
          <div className="text-gray-600">No restaurants found.</div>
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="p-3 bg-white rounded shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  {r.bannerUrl ? (
                    <img
                      src={r.bannerUrl}
                      alt={r.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 p-2">No image</div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.description}</div>
                  <div className="text-xs text-gray-500">{r.address}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded text-sm"
                  onClick={() => window.open(`${window.location.origin}/menu/${r.id}`, '_blank')}
                >
                  Open
                </button>
                <button
                  onClick={() => navigate(`/admin/restaurants/${r.id}/qr`)}
                  className="px-2 py-1 border rounded text-blue-600"
                >
                  QR / Landing
                </button>
                <button className="px-2 py-1 border rounded text-sm" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button
                  className="px-2 py-1 border rounded text-sm text-red-600"
                  onClick={() => confirmDelete(r)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
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
      )}

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
