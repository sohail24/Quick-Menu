// src/pages/Admin/AdminDishEditor.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import DishForm from '../../components/DishForm';
import { useAuthStore } from '../../app/store';

export default function AdminDishEditor() {
  const { dishId } = useParams<{ dishId?: string }>();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [initial, setInitial] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  // resolve restaurant from demo or user selection: try to auto-pick first restaurant
  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
      .then((res) => {
        if (!mounted) return;
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setRestaurantId(arr[0].id); // auto-pick first
      })
      .catch((e) => console.warn('Failed load restaurants', e));
    return () => {
      mounted = false;
    };
  }, [loggedInUserEmail]);

  useEffect(() => {
    if (!dishId || !restaurantId) return;
    setLoading(true);
    api
      .get(`/api/${restaurantId}/dishes/${dishId}`)
      .then((res) => {
        setInitial(res.data);
      })
      .catch(async (e) => {
        // try alternative path
        try {
          const res2 = await api.get(`/api/restaurants/${restaurantId}/dishes/${dishId}`);
          setInitial(res2.data);
        } catch (e2) {
          console.error('Failed to load dish', e2);
          setError('Failed to load dish');
        }
      })
      .finally(() => setLoading(false));
  }, [dishId, restaurantId]);

  async function handleSubmit(payload: any) {
    if (!restaurantId) return alert('No restaurant selected');
    setSaving(true);
    setError(null);
    try {
      if (dishId) {
        const res = await api.patch(`/api/${restaurantId}/dishes/${dishId}`, payload);
        alert('Updated');
        navigate('/admin/dishes');
      } else {
        const res = await api.post(`/api/${restaurantId}/dishes`, payload);
        alert('Created');
        navigate('/admin/dishes');
      }
    } catch (err: any) {
      console.error('Save dish failed', err);
      setError(err?.response?.data?.message || 'Failed to save dish');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
          {dishId ? 'Edit Dish' : 'Create Dish'}
        </h1>
        <div className="flex flex-col gap-1 min-w-0 sm:w-64">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
          <select
            value={restaurantId ?? ''}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
          >
            <option value="" disabled>
              -- select --
            </option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {error && <div className="p-4 mx-6 mt-6 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{error}</div>}

      <DishForm
        restaurantId={restaurantId}
        initial={initial}
        loading={loading}
        onSubmit={handleSubmit}
        submitLabel={
          dishId ? (saving ? 'Saving...' : 'Save changes') : saving ? 'Creating...' : 'Create dish'
        }
      />
    </div>
    </div>
  );
}
