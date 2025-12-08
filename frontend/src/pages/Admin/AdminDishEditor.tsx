// src/pages/Admin/AdminDishEditor.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import DishForm from '../../components/DishForm';

export default function AdminDishEditor() {
  const { dishId } = useParams<{ dishId?: string }>();
  const navigate = useNavigate();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [initial, setInitial] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // resolve restaurant from demo or user selection: try to auto-pick first restaurant
  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants')
      .then((res) => {
        if (!mounted) return;
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        if (arr.length > 0) setRestaurantId(arr[0].id);
      })
      .catch((e) => console.warn('Failed load restaurants', e));
    return () => {
      mounted = false;
    };
  }, []);

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{dishId ? 'Edit Dish' : 'Create Dish'}</h1>
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
