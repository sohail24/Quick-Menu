// src/pages/Admin/AdminOverview.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store';

type Stats = {
  restaurants?: number;
  orders?: number;
  revenue?: number;
  activeTables?: number;
  topDishes?: any[];
  hourly?: number[];
  raw?: any;
};

export default function AdminOverview() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  // load restaurants for admin select
  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
      .then((res) => {
        if (!mounted) return;
        // backend returns pageable with 'content' array (Spring Data style)
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        setRestaurants(arr);

        // preselect first restaurant if available
        if (arr.length > 0) {
          // ensure we set after restaurants are loaded so stats won't call prematurely
          setSelectedRest((prev) => prev ?? arr[0].id);
        } else {
          setSelectedRest(null);
        }
      })
      .catch((err) => {
        console.warn('Failed to load restaurants for admin overview', err);
        setError('Failed to load restaurants');
      })
      .finally(() => {
        if (mounted) setLoadingRestaurants(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // fetch stats only when a restaurant is selected (backend requires restaurantId)
  useEffect(() => {
    let mounted = true;
    if (!selectedRest) {
      // Clear stats if none selected
      setStats({});
      return;
    }
    setLoading(true);
    setError(null);

    const timezone = 'Asia/Kolkata';
    const params = `?restaurantId=${selectedRest}&timezone=${encodeURIComponent(timezone)}`;

    api
      .get(`/api/admin/stats${params}`)
      .then((res) => {
        if (!mounted) return;
        const d = res.data ?? {};
        // Defensive mapping of likely keys
        const topDishes =
          d.topDishes ??
          d.top5 ??
          d.top_5 ??
          d.top_dishes ??
          d.data?.topDishes ??
          d.stats?.topDishes ??
          [];

        const hourly =
          d.hourly ??
          d.hourlyBreakdown ??
          d.hourly_breakdown ??
          d.data?.hourly ??
          d.stats?.hourly ??
          [];

        const orders =
          d.ordersToday ??
          d.ordersCount ??
          d.totalOrders ??
          d.orders ??
          d.data?.ordersCount ??
          d.stats?.orders;

        const revenue =
          d.revenueToday ?? d.revenue ?? d.totalRevenue ?? d.revenueAmount ?? d.data?.revenue;

        const activeTables = d.activeTables ?? d.tablesActive ?? d.data?.activeTables;

        setStats({
          restaurants: d.restaurantsCount ?? d.totalRestaurants ?? undefined,
          orders: orders,
          revenue: revenue,
          activeTables: activeTables,
          topDishes: Array.isArray(topDishes) ? topDishes : [],
          hourly: Array.isArray(hourly) ? hourly : [],
          raw: d,
        });

        // helpful console log for debugging actual backend shape
        console.debug('AdminOverview: /api/admin/stats response', d);
      })
      .catch((err: any) => {
        console.warn('Failed to load admin stats', err);
        setError(
          err?.response?.data?.message
            ? `Failed to load stats: ${err.response.data.message}`
            : 'Failed to load stats (see console/network)',
        );
        setStats({ raw: err?.response?.data ?? err });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedRest]);

  return (
    <div className="p-12 space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <div>
          <Link to="/admin/restaurants/create" className="px-3 py-1 bg-blue-600 text-white rounded">
            Create Restaurant
          </Link>
        </div>
      </div>

      <div className="bg-white p-3 rounded shadow">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-sm block">Select restaurant</label>
            {loadingRestaurants ? (
              <div className="text-sm text-gray-600">Loading restaurants...</div>
            ) : (
              <select
                value={selectedRest ?? ''}
                onChange={(e) => setSelectedRest(e.target.value || null)}
                className="p-2 border rounded"
              >
                <option value="">-- select a restaurant --</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name ?? r.restaurantName ?? r.id}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="ml-auto text-sm text-gray-500">{loading ? 'Loading stats...' : ''}</div>
        </div>

        {error && <div className="text-red-600 mt-2">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Restaurants</div>
            <div className="text-2xl font-bold">
              {stats.restaurants ?? restaurants.length ?? '—'}
            </div>
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

        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Top dishes (preview)</h3>
          {Array.isArray(stats.topDishes) && stats.topDishes.length > 0 ? (
            <ol className="list-decimal list-inside">
              {stats.topDishes.map((d: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{d.name ?? d.dishName ?? d.title ?? 'Unknown'}</span>
                  <span className="text-sm text-gray-500">{d.sold ?? d.count ?? d.qty ?? '-'}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-gray-500">
              No top dishes yet. (If your backend returned data, check console for raw payload.)
              <pre className="mt-2 text-xs max-h-40 overflow-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(stats.raw ?? {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
