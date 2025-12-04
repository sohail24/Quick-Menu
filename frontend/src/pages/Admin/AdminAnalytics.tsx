// src/pages/Admin/AdminAnalytics.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AdminAnalytics() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);

  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [hourly, setHourly] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants')
      .then((res) => {
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setSelectedRest((prev) => prev ?? arr[0].id);
      })
      .catch((err) => {
        console.warn('Failed to load restaurants for analytics', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!selectedRest) return;
    setLoading(true);
    const timezone = 'Asia/Kolkata';
    api
      .get(`/api/admin/stats?restaurantId=${selectedRest}&timezone=${encodeURIComponent(timezone)}`)
      .then((res) => {
        if (!mounted) return;
        const d = res.data ?? {};
        console.debug('AdminAnalytics /api/admin/stats response:', d);
        const td =
          d.topDishes ??
          d.top5 ??
          d.top_5 ??
          d.top_dishes ??
          d.data?.topDishes ??
          d.stats?.topDishes ??
          [];
        const hr = d.hourly ?? d.hourlyBreakdown ?? d.data?.hourly ?? d.stats?.hourly ?? [];
        setTopDishes(Array.isArray(td) ? td : []);
        setHourly(Array.isArray(hr) ? hr : []);
      })
      .catch((err) => {
        console.warn('Failed to load analytics', err);
        setTopDishes([
          { name: 'Sample Dish A', sold: 12 },
          { name: 'Sample Dish B', sold: 9 },
        ]);
        setHourly([0, 1, 2, 3, 4, 6, 8, 3, 2, 1, 0, 0, 0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 0]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedRest]);

  return (
    <div className="p-12 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div>
          <label className="text-sm block">Restaurant</label>
          <select
            value={selectedRest ?? ''}
            onChange={(e) => setSelectedRest(e.target.value || null)}
            className="p-2 border rounded"
          >
            <option value="">Select</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name ?? r.restaurantName ?? r.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading analytics…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Top dishes (last 24h)</h3>
          <ol className="list-decimal list-inside space-y-1">
            {topDishes.map((d: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{d.name ?? d.dishName ?? d.title}</span>
                <span className="text-sm text-gray-500">{d.sold ?? d.count ?? d.qty ?? '-'}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Hourly breakdown (last 24h)</h3>
          <div className="w-full h-40">
            <div className="flex items-end gap-1 h-full">
              {hourly.map((v: number, i: number) => (
                <div key={i} title={`Hour ${i}: ${v}`} className="flex-1">
                  <div
                    style={{ height: `${(v / Math.max(...hourly, 1)) * 100}%` }}
                    className="bg-blue-500 rounded-t"
                  ></div>
                  <div className="text-xs text-center mt-1">{i}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
