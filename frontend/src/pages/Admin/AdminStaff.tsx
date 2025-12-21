import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../app/store';

export default function AdminStaff() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  useEffect(() => {
    api.get('/api/restaurants/owner/' + loggedInUserEmail).then((res) => {
      const list = res.data?.content ?? [];
      setRestaurants(list);
      if (list.length > 0) setRestaurantId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    api.get('/api/admin/staff', { params: { restaurantId } }).then((res) => setStaff(res.data));
  }, [restaurantId]);

  function createStaff() {
    api
      .post('/api/admin/staff', { ...form, restaurantId })
      .then(() => {
        setForm({ name: '', email: '', password: '' });
        setShowCreate(false);
        return api.get('/api/admin/staff', { params: { restaurantId } });
      })
      .then((res) => setStaff(res.data));
  }

  function toggleStaff(id: string, enabled: boolean) {
    api
      .patch(`/api/admin/staff/${id}/enabled`, null, { params: { enabled } })
      .then(() => setStaff((s) => s.map((u) => (u.id === id ? { ...u, enabled } : u))));
  }

  function deleteStaff(id: string) {
    if (!confirm('Delete staff?')) return;
    api.delete(`/api/admin/staff/${id}`).then(() => setStaff((s) => s.filter((u) => u.id !== id)));
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Staff Management</h1>

      <div className="mb-6 flex items-center gap-4">
        <select
          className="border p-2 rounded text-sm"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          + Add Staff
        </button>
      </div>

      <div className="bg-white rounded shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      s.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => toggleStaff(s.id, !s.enabled)}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                  >
                    {s.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    className="px-3 py-1 border rounded text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No staff created yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-lg font-semibold mb-2">Add Staff</h2>
            <div className="space-y-3">
              <input
                className="border p-2 w-full rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="border p-2 w-full rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="border p-2 w-full rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Temporary Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createStaff}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
