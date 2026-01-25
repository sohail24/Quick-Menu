// src/pages/Admin/AdminCategories.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import CategoryManager from '../../components/CategoryManager';
import { useAuthStore } from '../../app/store';

export default function AdminCategories() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
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
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Categories</h1>
        <div className="flex flex-col gap-1 min-w-0 sm:w-64">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
          {loading ? (
            <div className="text-[10px] text-gray-400 italic">Loading...</div>
          ) : (
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
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
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-4 sm:p-6">
        {selectedRest ? (
          <CategoryManager restaurantId={selectedRest} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Select a restaurant to manage categories</div>
          </div>
        )}
      </div>
    </div>
  );
}
