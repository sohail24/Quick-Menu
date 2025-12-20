import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AdminStaff() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  // load restaurants
  useEffect(() => {
    api.get('/api/restaurants').then((res) => {
      const list = res.data?.content ?? [];
      setRestaurants(list);
      if (list.length > 0) setRestaurantId(list[0].id);
    });
  }, []);

  // load staff
  useEffect(() => {
    if (!restaurantId) return;
    api.get('/api/admin/staff', { params: { restaurantId } }).then((res) => setStaff(res.data));
  }, [restaurantId]);

  function createStaff() {
    api
      .post('/api/admin/staff', {
        ...form,
        restaurantId,
      })
      .then(() => {
        setForm({ name: '', email: '', password: '' });
        setShowCreate(false);
        return api.get('/api/admin/staff', {
          params: { restaurantId },
        });
      })
      .then((res) => setStaff(res.data));
  }

  function toggleStaff(id: string, enabled: boolean) {
    api
      .patch(`/api/admin/staff/${id}/enabled`, null, {
        params: { enabled },
      })
      .then(() => setStaff((s) => s.map((u) => (u.id === id ? { ...u, enabled } : u))));
  }

  function deleteStaff(id: string) {
    if (!confirm('Delete staff?')) return;
    api.delete(`/api/admin/staff/${id}`).then(() => setStaff((s) => s.filter((u) => u.id !== id)));
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Staff Management</h1>

      {/* Restaurant selector */}
      <select
        className="border p-2 rounded mb-4"
        value={restaurantId}
        onChange={(e) => setRestaurantId(e.target.value)}
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <div className="mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          + Add Staff
        </button>
      </div>

      {/* Staff table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.email}</td>
              <td className="p-2 text-center">{s.enabled ? 'ACTIVE' : 'DISABLED'}</td>
              <td className="p-2 text-center space-x-2">
                <button
                  className="border px-2 py-1 rounded"
                  onClick={() => toggleStaff(s.id, !s.enabled)}
                >
                  {s.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="border px-2 py-1 rounded text-red-600"
                  onClick={() => deleteStaff(s.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No staff created yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-lg font-semibold mb-2">Add Staff</h2>

            <input
              className="border p-2 w-full mb-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border p-2 w-full mb-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="border p-2 w-full mb-2"
              placeholder="Temporary Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowCreate(false)}>Cancel</button>
              <button onClick={createStaff} className="bg-blue-600 text-white px-3 py-1 rounded">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
