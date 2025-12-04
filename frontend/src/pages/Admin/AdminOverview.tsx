// src/pages/Admin/AdminOverview.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

type Stats = {
  restaurants?: number;
  orders?: number;
  revenue?: number;
  activeTables?: number;
  topDishes?: any[];
  hourly?: number[];
};

export default function AdminOverview() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load restaurants for admin select
  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants')
      .then((res) => {
        if (!mounted) return;
        // Handle both direct array and paginated response
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setRestaurants(data);
        // preselect first if available
        if (data.length > 0) {
          setSelectedRest((prev) => prev ?? data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Failed to load restaurants for admin overview', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // fetch stats when selectedRest changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // call backend with restaurantId + timezone per your backend signature
    const params = selectedRest ? `?restaurantId=${selectedRest}&timezone=Asia/Kolkata` : '';
    api
      .get(`/api/admin/stats${params}`)
      .then((res) => {
        if (!mounted) return;
        const d = res.data || {};
        setStats({
          restaurants: d.restaurantsCount ?? d.totalRestaurants ?? undefined,
          orders: d.ordersCount ?? d.totalOrders ?? d.orders,
          revenue: d.revenue ?? d.totalRevenue ?? undefined,
          activeTables: d.activeTables ?? d.tablesActive ?? undefined,
          topDishes: d.topDishes ?? d.top5 ?? undefined,
          hourly: d.hourly ?? d.hourlyBreakdown ?? undefined,
        });
      })
      .catch((err) => {
        console.warn('Failed to load admin stats', err);
        setError('Failed to load stats');
        // reset stats on error
        setStats({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedRest]);

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <div>
          <Link to="/admin/restaurants/create" className="px-3 py-1 bg-blue-600 text-white rounded">
            Create Restaurant
          </Link>
        </div>
      </div>

      <div className="">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-sm block">Select restaurant</label>
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border rounded"
            >
              <option value="">-- all / global --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-500">{loading ? 'Loading stats...' : ''}</div>
        </div>

        {error && <div className="text-red-600 mt-2">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Restaurants</div>
            <div className="text-2xl font-bold">{stats.restaurants ?? '—'}</div>
            <div className="text-xs mt-2">
              <Link to="/admin/restaurants" className="text-blue-600">
                Manage
              </Link>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Orders (total)</div>
            <div className="text-2xl font-bold">{stats.orders ?? '—'}</div>
            <div className="text-xs mt-2">
              <Link to="/admin/orders" className="text-blue-600">
                View orders
              </Link>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-bold">
              {typeof stats.revenue === 'number' ? `₹ ${stats.revenue.toLocaleString()}` : '—'}
            </div>
            <div className="text-xs mt-2">
              <Link to="/admin/analytics" className="text-blue-600">
                Analytics
              </Link>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Active tables</div>
            <div className="text-2xl font-bold">{stats.activeTables ?? '—'}</div>
            <div className="text-xs mt-2">Live</div>
          </div>
        </div>

        {/* small top-dishes preview */}
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Top dishes (preview)</h3>
          {stats.topDishes && stats.topDishes.length > 0 ? (
            <ol className="list-decimal list-inside">
              {stats.topDishes.map((d: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{d.name ?? d.dishName}</span>
                  <span className="text-sm text-gray-500">{d.sold ?? d.count ?? '-'}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-gray-500">No top dishes yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
