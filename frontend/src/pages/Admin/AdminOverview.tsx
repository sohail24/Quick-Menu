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
  const selectedRestaurant = restaurants.find((r) => r.id === selectedRest);
  const [staffList, setStaffList] = useState<any[]>([]);

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

    api
      .get('/api/admin/staff' + `?restaurantId=${selectedRest}`) // or your actual endpoint
      .then((res) => {
        const allStaff = Array.isArray(res.data) ? res.data : [];
        const filtered = allStaff.filter((s) => s.assignedRestaurantId === selectedRest);
        setStaffList(filtered);
      })
      .catch((err) => console.warn('Failed to load staff', err));

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

        {selectedRestaurant && (
          <div className="mt-6 bg-white rounded-lg shadow border p-4">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Banner */}
              {selectedRestaurant.bannerUrl && (
                <div className="w-full md:w-1/3">
                  <img
                    src={selectedRestaurant.bannerUrl}
                    alt="Restaurant banner"
                    className="w-full h-40 object-cover rounded-md border"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedRestaurant.name}</h3>
                  <Link
                    to={`/admin/restaurants/${selectedRestaurant.id}/edit`}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Edit
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Plan:</span> {selectedRestaurant.planId}
                  </div>
                  <div>
                    <span className="text-gray-500">Timezone:</span> {selectedRestaurant.timezone}
                  </div>
                  <div>
                    <span className="text-gray-500">Currency:</span> {selectedRestaurant.currency}
                  </div>
                  <div>
                    <span className="text-gray-500">Address:</span> {selectedRestaurant.address}
                  </div>
                  <div>
                    <span className="text-gray-500">Created At:</span>{' '}
                    {new Date(selectedRestaurant.createdAt).toLocaleString()}
                  </div>
                </div>

                {selectedRestaurant.description && (
                  <div className="text-sm text-gray-700">
                    <span className="text-gray-500">Description:</span>{' '}
                    {selectedRestaurant.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Staff Summary</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Staff</div>
              <div className="text-xl font-bold">{staffList.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Staff</div>
              <div className="text-xl font-bold">{staffList.filter((s) => s.enabled).length}</div>
            </div>
          </div>

          {staffList.length > 0 && (
            <div className="mt-4 space-y-1 text-sm">
              {staffList.slice(0, 5).map((s) => (
                <div key={s.id} className="flex justify-between border-b py-1">
                  <span>{s.name}</span>
                  <span className="text-gray-500">{s.email}</span>
                </div>
              ))}
              {staffList.length > 5 && (
                <div className="text-xs text-blue-600 mt-2">
                  <Link to="/admin/staff">View all staff</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
