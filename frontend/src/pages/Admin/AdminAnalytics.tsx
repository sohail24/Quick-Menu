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
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-gray-200/50 border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
      <div className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider">{title}</div>
      <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1 sm:mt-2 truncate">{value}</div>
    </div>
  );
}

function SparkBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="w-16 sm:w-28 h-2 bg-gray-200 rounded overflow-hidden">
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
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

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

  async function fetchAIInsights() {
    if (!restaurantId) return;
    setLoadingInsights(true);
    setAiInsights(null);
    
    // Aggregating analytics data for the AI
    const restaurantName = restaurants.find(r => r.id === restaurantId)?.name || 'This Restaurant';
    const topDishesText = topDishes.map(d => `${d.name} (${d.totalQty} sold)`).join(', ');
    const categoryText = categoryStats.map(c => `${c.categoryName}: ${c.count} orders`).join(', ');
    
    const analyticsSummary = `
      Total Orders Today: ${ordersToday}, 
      Total Revenue Today: ₹${revenueToday}. 
      Top Dishes: ${topDishesText || 'No sales yet'}. 
      Category Breakdown: ${categoryText || 'No data yet'}.
    `.trim();

    try {
      const res = await api.post('/api/ai/admin-insights', {
        restaurantName,
        analyticsData: analyticsSummary
      });
      setAiInsights(res.data.insights || res.data);
      setAiModel(res.data.modelName || 'Unknown AI');
    } catch (err) {
      console.error('AI Insights failed', err);
      setError('Failed to generate AI insights.');
    } finally {
      setLoadingInsights(false);
    }
  }

  // Colors for Pie Chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Admin Analytics</h1>
        <div className="flex gap-2">
          <button 
            onClick={fetchAIInsights} 
            disabled={loadingInsights || !restaurantId}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loadingInsights ? (
               <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : '✨ AI Insights'}
          </button>
          <button onClick={exportCsv} className="border border-gray-100 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
        <select
          className="border border-blue-100 p-2.5 rounded-xl bg-blue-50/20 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-full sm:w-auto flex-1 h-11"
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
          className="border border-gray-100 p-2.5 rounded-xl bg-gray-50 text-sm font-semibold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all w-full sm:w-auto h-11"
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-blue-50 p-2 rounded-xl bg-blue-50/10 w-full sm:w-auto overflow-hidden">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="datetime-local"
              className="text-[10px] sm:text-xs bg-transparent border-none outline-none p-1 font-bold text-gray-700 flex-1 min-w-0"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-300 font-black">→</span>
            <input
              type="datetime-local"
              className="text-[10px] sm:text-xs bg-transparent border-none outline-none p-1 font-bold text-gray-700 flex-1 min-w-0"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors self-end sm:self-auto"
            >
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Insights Card */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-indigo-100/30 relative overflow-hidden">
          <button 
            onClick={() => setAiInsights(null)}
            className="absolute top-4 right-4 p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-indigo-900 uppercase tracking-widest">AI Consultant Insights</h2>
            </div>
            {aiModel && (
              <span className="bg-white/50 border border-indigo-100 text-[9px] font-black text-indigo-500 px-2 py-1 rounded-full uppercase tracking-tighter">
                Model: {aiModel}
              </span>
            )}
          </div>
          <div className="prose prose-sm prose-indigo">
             <div className="text-indigo-900 font-bold space-y-3 leading-relaxed">
                {typeof aiInsights === 'string' ? aiInsights.split('\n').map((line, i) => (
                  <p key={i} className="flex gap-3">
                    {line.trim().startsWith('-') || line.trim().startsWith('•') || line.match(/^\d\./) ? (
                      <span className="min-w-0">{line}</span>
                    ) : (
                      line
                    )}
                  </p>
                )) : JSON.stringify(aiInsights)}
             </div>
          </div>
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Orders" value={loading ? '…' : ordersToday} />
        <StatCard title="Total Revenue" value={loading ? '…' : `₹ ${revenueToday}`} />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top dishes */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mb-4 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-lg">Top Dishes (Today)</h3>

          {topDishes.length === 0 ? (
            <div className="text-sm text-gray-500 italic font-medium">No orders yet</div>
          ) : (
            topDishes.map((d) => (
              <div key={d.dishId} className="flex items-center justify-between mb-3 last:mb-0">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-xs sm:text-sm font-black text-gray-800 truncate">{d.name}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-tighter">₹ {d.totalRevenue}</div>
                </div>
                <div className="flex items-center gap-3">
                  <SparkBar value={d.totalQty} max={maxDishQty} />
                  <div className="text-xs sm:text-sm font-black text-blue-600">{d.totalQty}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hourly orders */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mb-4 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-lg">Hourly Orders (Today)</h3>

          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{fontSize: 10}} />
                <YAxis allowDecimals={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-8 lg:col-span-2">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight mb-4 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-lg">Orders by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ height: 300 }} className="relative">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="count"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400 font-bold uppercase tracking-widest">
                  No data available
                </div>
              )}
            </div>
            {/* Text Summary */}
            <div className="flex flex-col justify-center space-y-1">
              {categoryStats.map((c, i) => (
                <div key={i} className="flex justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-sm">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    ></span>
                    {c.categoryName}
                  </span>
                  <span className="font-black text-gray-900 text-xs">{c.count} <span className="text-[10px] text-gray-400 font-medium">orders</span></span>
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
