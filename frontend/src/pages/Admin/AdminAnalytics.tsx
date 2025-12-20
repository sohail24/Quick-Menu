import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { downloadCsv } from '../../lib/csv';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../app/store';

/* ---------------- Small UI helpers ---------------- */

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded p-4 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function SparkBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="w-28 h-2 bg-gray-200 rounded">
      <div className="h-full bg-blue-600 rounded" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------------- Main Page ---------------- */

export default function AdminAnalytics() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // stats
  const [ordersToday, setOrdersToday] = useState<number>(0);
  const [revenueToday, setRevenueToday] = useState<number>(0);

  // metrics
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  /* -------- load restaurants -------- */
  useEffect(() => {
    api.get('/api/restaurants/owner/' + loggedInUserEmail).then((res) => {
      const list = res.data?.content ?? [];
      setRestaurants(list);
      if (list.length > 0) setRestaurantId(list[0].id);
    });
  }, []);

  /* -------- load analytics -------- */
  useEffect(() => {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/api/admin/stats`, {
        params: { restaurantId, timezone },
      }),
      api.get(`/api/admin/metrics`, {
        params: { restaurantId, timezone },
      }),
    ])
      .then(([statsRes, metricsRes]) => {
        /* ---- stats ---- */
        setOrdersToday(statsRes.data?.ordersToday ?? 0);
        setRevenueToday(statsRes.data?.revenueToday ?? 0);

        /* ---- top dishes ---- */
        setTopDishes(metricsRes.data?.topDishes ?? []);

        /* ---- hourly orders (normalize to 24h) ---- */
        const raw = metricsRes.data?.hourlyOrders ?? [];
        setHourly(normalizeHourly(raw, timezone));
      })
      .catch((e) => {
        console.error(e);
        setError('Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [restaurantId, timezone]);

  /* -------- CSV export -------- */
  function exportCsv() {
    const rows: any[] = [
      { metric: 'ordersToday', value: ordersToday },
      { metric: 'revenueToday', value: revenueToday },
    ];

    topDishes.forEach((d, i) =>
      rows.push({
        metric: `topDish_${i + 1}`,
        name: d.name,
        qty: d.totalQty,
        revenue: d.totalRevenue,
      }),
    );

    hourly.forEach((h) =>
      rows.push({
        hour: h.hour,
        orders: h.orders,
      }),
    );

    downloadCsv(`analytics_${restaurantId}.csv`, rows);
  }

  const maxDishQty = Math.max(...topDishes.map((d) => d.totalQty), 1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Analytics</h1>
        <button onClick={exportCsv} className="border px-3 py-1 rounded">
          Export CSV
        </button>
      </div>

      {/* controls */}
      <div className="flex gap-3">
        <select
          className="border p-2 rounded"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          <option>Asia/Kolkata</option>
          <option>UTC</option>
        </select>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard title="Orders Today" value={loading ? '…' : ordersToday} />
        <StatCard title="Revenue Today" value={loading ? '…' : `₹ ${revenueToday}`} />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top dishes */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">Top Dishes (Today)</h3>

          {topDishes.length === 0 ? (
            <div className="text-sm text-gray-600">No orders yet</div>
          ) : (
            topDishes.map((d) => (
              <div key={d.dishId} className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">₹ {d.totalRevenue}</div>
                </div>
                <div className="flex items-center gap-2">
                  <SparkBar value={d.totalQty} max={maxDishQty} />
                  <div className="text-sm">{d.totalQty}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hourly orders */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">Hourly Orders (Today)</h3>

          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function normalizeHourly(raw: any[], timezone: string) {
  const map = new Map<number, number>();

  raw.forEach((r) => {
    const d = new Date(r.hourStart);
    const hour = d.getUTCHours(); // backend already applied timezone
    map.set(hour, r.ordersCount);
  });

  const out = [];
  for (let i = 0; i < 24; i++) {
    out.push({
      hour: `${String(i).padStart(2, '0')}:00`,
      orders: map.get(i) ?? 0,
    });
  }
  return out;
}
