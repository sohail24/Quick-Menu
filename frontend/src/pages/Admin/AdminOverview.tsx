// src/pages/Admin/AdminOverview.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import RestaurantEditModal from '../../components/RestaurantEditModal';
import Button from '../../components/ui/Button';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;
  const selectedRestaurant = restaurants.find((r) => r.id === selectedRest);
  const [form, setForm] = useState<any>(selectedRestaurant ?? {});
  const [modalSubmitting, setModalSubmitting] = useState(false);

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
  }, [loggedInUserEmail, isEditModalOpen]);

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
        const activeTablesCount = d.activeTables ?? d.tablesActive ?? d.data?.activeTables;

        setStats({
          restaurants: d.restaurantsCount ?? d.totalRestaurants ?? undefined,
          orders,
          revenue,
          activeTables: activeTablesCount,
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
      <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-between p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
          <div className="w-full sm:w-auto flex-1">
            <label className="text-[10px] sm:text-sm text-gray-600 block mb-1 uppercase tracking-widest font-bold">Select restaurant</label>
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border border-blue-100 bg-blue-50/30 rounded-xl w-full sm:w-64 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            >
              <option value="">-- select a restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:ml-auto text-[10px] sm:text-sm text-gray-500 font-medium italic">
            {loadingStats ? 'Updating metrics...' : ''}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Active Orders"
          value={stats.raw?.activeOrders ?? '—'}
          action={
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">
              Statuses: PLACED, PENDING, PREPARING, READY
            </div>
          }
          icon={<IconBox className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Orders (today)"
          value={stats.orders ?? '—'}
          action={
            <Link to="/admin/orders" className="text-blue-600 text-xs">
              View all orders
            </Link>
          }
          icon={<IconBox className="w-5 h-5 text-green-600" />}
        />
        <MetricCard
          label="Revenue (today)"
          value={typeof stats.revenue === 'number' ? `₹ ${stats.revenue.toLocaleString()}` : '—'}
          action={
            <Link to="/admin/analytics" className="text-blue-600 text-xs">
              Analytics
            </Link>
          }
          icon={<IconCurrency className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Available Tables"
          value={stats.raw?.availableTables ?? '—'}
          action={<span className="text-xs text-green-500 font-medium">Ready for guests</span>}
          icon={<IconTable className="w-5 h-5 text-green-500" />}
        />
        <MetricCard
          label="Occupied Tables"
          value={stats.activeTables ?? '—'}
          action={<span className="text-xs text-purple-500 font-medium">Currently active</span>}
          icon={<IconTable className="w-5 h-5 text-purple-600" />}
        />
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
      </div>

      {/* Restaurant profile */}
      {selectedRestaurant && (
        <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            {/* Banner */}
            {selectedRestaurant.bannerUrl && (
              <div className="w-full md:w-1/3">
                <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/50">
                  <img
                    src={selectedRestaurant.bannerUrl}
                    alt="Restaurant banner"
                    className="w-full h-28 sm:h-40 object-cover"
                  />
                </div>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">{selectedRestaurant.name}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium font-mono uppercase tracking-tighter">{selectedRestaurant.id}</p>
                </div>
                <Button
                  onClick={() => {
                    setForm({
                      name: selectedRestaurant.name,
                      description: selectedRestaurant.description,
                      address: selectedRestaurant.address,
                      timezone: selectedRestaurant.timezone,
                      currency: selectedRestaurant.currency,
                      bannerUrl: selectedRestaurant.bannerUrl,
                      ownerUserId: selectedRestaurant.ownerUserId,
                    }); // preload form with restaurant data
                    setIsEditModalOpen(true);
                  }}
                  size="sm"
                  className="!px-4 !h-8 sm:!h-10 font-bold"
                >
                  Edit
                </Button>
                {isEditModalOpen && (
                  <RestaurantEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setModalSubmitting(true);
                      try {
                        await api.patch(`/api/restaurants/${selectedRestaurant.id}`, form);
                        setIsEditModalOpen(false);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setModalSubmitting(false);
                      }
                    }}
                    form={form}
                    setForm={setForm}
                    editing={true}
                    modalSubmitting={modalSubmitting}
                    onBannerUploaded={(url) => setForm({ ...form, bannerUrl: url })}
                    setError={(msg) => console.error(msg)}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-2 text-sm pt-2 sm:pt-0">
                <Detail label="Plan" value={capitalize(selectedRestaurant.planId)} />
                <Detail label="Timezone" value={selectedRestaurant.timezone} />
                <Detail label="Currency" value={selectedRestaurant.currency} />
                <Detail label="Address" value={selectedRestaurant.address} />
                <Detail
                  label="Created At"
                  value={
                    selectedRestaurant.createdAt
                      ? new Date(selectedRestaurant.createdAt).toLocaleDateString()
                      : '—'
                  }
                />
              </div>

              {selectedRestaurant.description && (
                <div className="text-xs sm:text-sm text-gray-600 border-t border-gray-50 pt-3 mt-3 italic font-medium">
                  <span className="text-gray-400 not-italic uppercase text-[10px] tracking-widest font-bold">About: </span>
                  {selectedRestaurant.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff summary */}
      {selectedRestaurant && (
        <div className="bg-white rounded-2xl sm:rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-black text-gray-900">Staff Summary</h3>
            <Link
              to="/admin/staff"
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Manage
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <SummaryStat label="Total Staff" value={staffList.length} />
            <SummaryStat label="Active Staff" value={staffList.filter((s) => s.enabled).length} />
            <SummaryStat label="Disabled" value={staffList.filter((s) => !s.enabled).length} />
            <SummaryStat
              label="Assigned"
              value={staffList.filter((s) => !!s.assignedRestaurantId).length}
            />
          </div>

          {staffList.length > 0 ? (
            <div className="mt-5 space-y-2">
              {staffList.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 text-sm bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                       <IconUser className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-xs sm:text-sm">{s.name ?? '—'}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-medium">{s.email}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      s.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              ))}
              {staffList.length > 5 && (
                <div className="text-center pt-2">
                  <Link to="/admin/staff" className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">
                    View all staff →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-400 font-medium italic">No staff yet.</div>
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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-3 sm:p-5 flex items-start sm:gap-4 gap-3 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex-shrink-0 sm:mt-1 scale-75 sm:scale-100">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-sm text-gray-500 truncate">{label}</div>
        <div className="text-xl sm:text-2xl font-bold leading-tight truncate">{value}</div>
        {action && <div className="text-[10px] sm:text-xs mt-1 sm:mt-2">{action}</div>}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</div>
      <div className="text-sm font-black text-gray-900 truncate" title={String(value)}>{value ?? '—'}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 shadow-sm">
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
