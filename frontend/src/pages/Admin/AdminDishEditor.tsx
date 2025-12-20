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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{dishId ? 'Edit Dish' : 'Create Dish'}</h1>
        <div className="mb-4">
          <label className="text-sm font-medium">Select Restaurant</label>
          <select
            value={restaurantId ?? ''}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          >
            <option value="" disabled>
              Select a restaurant
            </option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

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
  );
}
