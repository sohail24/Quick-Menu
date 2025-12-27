import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { downloadCsv } from '../../lib/csv';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // stats
  const [ordersToday, setOrdersToday] = useState<number>(0);
  const [revenueToday, setRevenueToday] = useState<number>(0);

  // metrics
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

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

    const params: any = { restaurantId, timezone };
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();

    Promise.all([
      api.get(`/api/admin/stats`, { params }),
      api.get(`/api/admin/metrics`, { params }),
    ])
      .then(([statsRes, metricsRes]) => {
        /* ---- stats ---- */
        setOrdersToday(statsRes.data?.ordersToday ?? 0);
        setRevenueToday(statsRes.data?.revenueToday ?? 0);

        /* ---- top dishes ---- */
        setTopDishes(metricsRes.data?.topDishes ?? []);

        /* ---- category breakdown ---- */
        setCategoryStats(metricsRes.data?.categoryBreakdown ?? []);

        /* ---- hourly orders (normalize to 24h) ---- */
        const raw = metricsRes.data?.hourlyOrders ?? [];
        setHourly(normalizeHourly(raw, timezone));
      })
      .catch((e) => {
        console.error(e);
        setError('Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [restaurantId, timezone, startDate, endDate]);

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

    categoryStats.forEach((c) =>
      rows.push({
        category: c.categoryName,
        count: c.count,
      }),
    );

    downloadCsv(`analytics_${restaurantId}.csv`, rows);
  }

  const maxDishQty = Math.max(...topDishes.map((d) => d.totalQty), 1);

  // Colors for Pie Chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
          <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">USA Eastern (New York)</option>
          <option value="America/Los_Angeles">USA Pacific (Los Angeles)</option>
          <option value="Europe/London">UK (London)</option>
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-2 border p-1 rounded bg-white">
          <input
            type="datetime-local"
            className="text-sm px-1 border-r"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-400">to</span>
          <input
            type="datetime-local"
            className="text-sm px-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="ml-2 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard title="Total Orders" value={loading ? '…' : ordersToday} />
        <StatCard title="Total Revenue" value={loading ? '…' : `₹ ${revenueToday}`} />
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

        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-white rounded shadow p-4 lg:col-span-2">
          <h3 className="font-medium mb-3">Orders by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ height: 300 }}>
              {categoryStats.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="count"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No category data available
                </div>
              )}
            </div>
            {/* Text Summary */}
            <div className="flex flex-col justify-center">
              {categoryStats.map((c, i) => (
                <div key={i} className="flex justify-between p-2 border-b last:border-0">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    ></span>
                    {c.categoryName}
                  </span>
                  <span className="font-semibold">{c.count} orders</span>
                </div>
              ))}
            </div>
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
    // Use Intl to get the hour in the requested timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    const hStr = formatter.format(d);
    // hStr might be "24" in some locales/browsers for midnight, normalize to 0-23
    const hour = parseInt(hStr, 10) % 24;

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
