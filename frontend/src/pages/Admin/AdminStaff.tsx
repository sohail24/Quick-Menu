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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Staff Management</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex flex-col gap-1 min-w-0 sm:w-64">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
            <select
              className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 self-end sm:self-auto sm:mt-5"
          >
            + Add Staff
          </button>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-4">
        {staff.map((s) => (
          <div key={s.id} className="p-4 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-base font-black text-gray-900 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-400 font-bold truncate">{s.email}</div>
              </div>
              <span
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  s.enabled 
                    ? 'bg-green-50 text-green-700 border-green-100/50' 
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {s.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
              <button
                onClick={() => toggleStaff(s.id, !s.enabled)}
                className={`h-8 px-4 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border flex-1 ${
                  s.enabled 
                    ? 'bg-amber-50 text-amber-600 border-amber-100/30 hover:bg-amber-100' 
                    : 'bg-green-50 text-green-600 border-green-100/30 hover:bg-green-100'
                }`}
              >
                {s.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => deleteStaff(s.id)}
                className="h-8 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-red-100/30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No staff created yet</div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900">{s.name}</td>
                <td className="px-6 py-4 font-bold text-gray-500">{s.email}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      s.enabled 
                        ? 'bg-green-50 text-green-700 border-green-100/50' 
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {s.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => toggleStaff(s.id, !s.enabled)}
                    className="h-8 px-4 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {s.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    className="h-8 px-4 border border-red-100 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No staff created yet</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4">Add Staff Member</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                <input
                  className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                <input
                  className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="e.g. john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Temporary Password</label>
                <input
                  type="password"
                  className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="h-10 px-6 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createStaff}
                className="h-10 px-8 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
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
