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
  raw?: any;
};

export default function AdminOverview() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRest);

  // Load restaurants for admin select
  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants/owner/' + encodeURIComponent(String(loggedInUserEmail ?? '')))
      .then((res) => {
        if (!mounted) return;
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        setRestaurants(arr);
        setSelectedRest((prev) => prev ?? arr[0]?.id ?? null);
      })
      .catch((err) => {
        console.warn('Failed to load restaurants', err);
        setError('Failed to load restaurants');
      })
      .finally(() => {
        if (mounted) setLoadingRestaurants(false);
      });

    return () => {
      mounted = false;
    };
  }, [loggedInUserEmail]);

  // Fetch stats and staff when restaurant changes
  useEffect(() => {
    let mounted = true;
    if (!selectedRest) {
      setStats({});
      setStaffList([]);
      return;
    }
    setError(null);
    setLoadingStats(true);

    const timezone = selectedRestaurant?.timezone ?? 'UTC';
    const params = `?restaurantId=${selectedRest}&timezone=${encodeURIComponent(timezone)}`;

    // Stats
    api
      .get(`/api/admin/stats${params}`)
      .then((res) => {
        if (!mounted) return;
        const d = res.data ?? {};
        const orders =
          d.ordersToday ?? d.ordersCount ?? d.totalOrders ?? d.orders ?? d.data?.ordersCount;
        const revenue =
          d.revenueToday ?? d.revenue ?? d.totalRevenue ?? d.revenueAmount ?? d.data?.revenue;
        const activeTables = d.activeTables ?? d.tablesActive ?? d.data?.activeTables;

        setStats({
          restaurants: d.restaurantsCount ?? d.totalRestaurants ?? undefined,
          orders,
          revenue,
          activeTables,
          raw: d,
        });
      })
      .catch((err: any) => {
        console.warn('Failed to load admin stats', err);
        setError(
          err?.response?.data?.message
            ? `Failed to load stats: ${err.response.data.message}`
            : 'Failed to load stats',
        );
        setStats({ raw: err?.response?.data ?? err });
      })
      .finally(() => {
        if (mounted) setLoadingStats(false);
      });

    // Staff summary
    api
      .get('/api/admin/staff' + `?restaurantId=${selectedRest}`)
      .then((res) => {
        if (!mounted) return;
        const allStaff = Array.isArray(res.data) ? res.data : [];
        const filtered = allStaff.filter((s) => s.assignedRestaurantId === selectedRest);
        setStaffList(filtered);
      })
      .catch((err) => console.warn('Failed to load staff', err));

    return () => {
      mounted = false;
    };
  }, [selectedRest, selectedRestaurant?.timezone]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Admin Overview</h1>
          {loadingRestaurants && (
            <span className="text-sm text-gray-500">Loading restaurants...</span>
          )}
        </div>
        <Link
          to="/admin/restaurants/create"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          Create Restaurant
        </Link>
      </div>

      {/* Selector */}
      <div className="bg-white bg-white rounded shadow flex items-center justify-between p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            <label className="text-sm text-gray-600 block mb-1">Select restaurant</label>
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border border-gray-300 rounded-md w-64 text-sm"
            >
              <option value="">-- select a restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:ml-auto text-sm text-gray-500">
            {loadingStats ? 'Loading stats...' : ''}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Restaurants"
          value={stats.restaurants ?? restaurants.length ?? '—'}
          action={
            <Link to="/admin/restaurants" className="text-blue-600 text-xs">
              Manage
            </Link>
          }
          icon={<IconStore className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Orders (total)"
          value={stats.orders ?? '—'}
          action={
            <Link to="/admin/orders" className="text-blue-600 text-xs">
              View orders
            </Link>
          }
          icon={<IconBox className="w-5 h-5 text-green-600" />}
        />
        <MetricCard
          label="Revenue"
          value={typeof stats.revenue === 'number' ? `₹ ${stats.revenue.toLocaleString()}` : '—'}
          action={
            <Link to="/admin/analytics" className="text-blue-600 text-xs">
              Analytics
            </Link>
          }
          icon={<IconCurrency className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Active tables"
          value={stats.activeTables ?? '—'}
          action={<span className="text-xs text-gray-500">Live</span>}
          icon={<IconTable className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Restaurant profile */}
      {selectedRestaurant && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Banner */}
            {selectedRestaurant.bannerUrl && (
              <div className="w-full md:w-1/3">
                <div className="overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={selectedRestaurant.bannerUrl}
                    alt="Restaurant banner"
                    className="w-full h-40 object-cover"
                  />
                </div>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRestaurant.name}</h3>
                  <p className="text-xs text-gray-500">{selectedRestaurant.id}</p>
                </div>
                <Link
                  to={`/admin/restaurants/${selectedRestaurant.id}/edit`}
                  className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Edit
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Detail label="Plan" value={capitalize(selectedRestaurant.planId)} />
                <Detail label="Timezone" value={selectedRestaurant.timezone} />
                <Detail label="Currency" value={selectedRestaurant.currency} />
                <Detail label="Address" value={selectedRestaurant.address} />
                <Detail
                  label="Created At"
                  value={
                    selectedRestaurant.createdAt
                      ? new Date(selectedRestaurant.createdAt).toLocaleString()
                      : '—'
                  }
                />
              </div>

              {selectedRestaurant.description && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Description: </span>
                  {selectedRestaurant.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff summary */}
      {selectedRestaurant && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Staff Summary</h3>
            <Link
              to="/admin/staff"
              className="text-sm px-3 py-1 border border-gray-300 hover:border-gray-400 rounded-md"
            >
              Manage staff
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryStat label="Total Staff" value={staffList.length} />
            <SummaryStat label="Active Staff" value={staffList.filter((s) => s.enabled).length} />
            <SummaryStat label="Disabled" value={staffList.filter((s) => !s.enabled).length} />
            <SummaryStat
              label="Assigned"
              value={staffList.filter((s) => !!s.assignedRestaurantId).length}
            />
          </div>

          {staffList.length > 0 ? (
            <div className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
              {staffList.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <IconUser className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{s.name ?? '—'}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      s.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              ))}
              {staffList.length > 5 && (
                <div className="p-3">
                  <Link to="/admin/staff" className="text-xs text-blue-600">
                    View all staff →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-500">No staff yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------- UI helpers --------------------------- */

function MetricCard({
  label,
  value,
  action,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-start gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        {action && <div className="text-xs mt-2">{action}</div>}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value ?? '—'}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-md border border-gray-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function capitalize(v?: string) {
  if (!v) return '—';
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/* --------------------------- Inline icons --------------------------- */

function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 7h18l-1 4H4L3 7Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11v8h14v-8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconBox(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 9l9-6 9 6-9 6-9-6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9v6l9 6 9-6V9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconCurrency(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v18M8 7h6a4 4 0 110 8H8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconTable(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="6" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10v8M18 10v8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
