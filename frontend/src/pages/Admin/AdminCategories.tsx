// src/pages/Admin/AdminCategories.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import CategoryManager from '../../components/CategoryManager';

export default function AdminCategories() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/api/restaurants')
      .then((res) => {
        if (!mounted) return;
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.restaurants ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setSelectedRest(arr[0].id);
      })
      .catch((e) => {
        console.warn('Failed to load restaurants', e);
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
      </div>

      <div className="mb-4">
        <label className="text-sm block">Select restaurant</label>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : (
          <select
            value={selectedRest ?? ''}
            onChange={(e) => setSelectedRest(e.target.value || null)}
            className="p-2 border rounded"
          >
            <option value="">-- select --</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name ?? r.restaurantName}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedRest ? (
        <CategoryManager restaurantId={selectedRest} />
      ) : (
        <div className="text-sm text-gray-600">Select a restaurant to manage categories</div>
      )}
    </div>
  );
}
