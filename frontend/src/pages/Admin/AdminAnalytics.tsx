// src/pages/Admin/AdminAnalytics.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AdminAnalytics() {
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [hourly, setHourly] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/api/admin/stats')
      .then((res) => {
        if (!mounted) return;
        const d = res.data || {};
        setTopDishes(d.topDishes ?? d.top5 ?? []);
        setHourly(d.hourly ?? d.hourlyBreakdown ?? []);
      })
      .catch((err) => {
        console.warn('Failed to load analytics', err);
        // fallback sample data
        setTopDishes([
          { name: 'Paneer Butter Masala', sold: 32 },
          { name: 'Margherita', sold: 21 },
          { name: 'Veg Biryani', sold: 18 },
        ]);
        setHourly([1, 2, 5, 8, 7, 6, 4, 3, 2, 1, 0, 0, 0, 1, 2, 4, 7, 9, 8, 6, 4, 3, 2, 1]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading analytics…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Top dishes (last 24h)</h3>
          <ol className="list-decimal list-inside space-y-1">
            {topDishes.map((d: any, i: number) => (
              <li key={i}>
                <div className="flex justify-between">
                  <span>{d.name ?? d.dishName}</span>
                  <span className="text-sm text-gray-500">{d.sold ?? d.count ?? '-'}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-medium mb-2">Hourly breakdown (last 24h)</h3>
          <div className="w-full h-40">
            {/* simple bars using hourly array */}
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
