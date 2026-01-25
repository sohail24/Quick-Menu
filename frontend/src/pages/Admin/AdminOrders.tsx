// src/pages/Admin/AdminOrders.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { downloadCsv } from '../../lib/csv';
import { useAuthStore } from '../../app/store';

type Order = any;

const STATUS_OPTIONS = ['ALL', 'PLACED', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

export default function AdminOrders() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtering & pagination
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQ, setSearchQ] = useState<string>('');
  const [debouncedSearchQ, setDebouncedSearchQ] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [total, setTotal] = useState<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // selection for bulk actions
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  const navigate = useNavigate();

  // Debounce search: only update debouncedSearchQ after 300ms of inactivity
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQ(searchQ);
      setPage(0);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQ]);

  // load restaurants
  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
      .then((res) => {
        if (!mounted) return;
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setSelectedRest((prev) => prev ?? arr[0].id);
      })
      .catch((err) => {
        console.warn('Failed to load restaurants for orders view', err);
        setError('Failed to load restaurants');
      })
      .finally(() => {
        if (mounted) setLoadingRestaurants(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // build query params (use debounced search)
  const queryParams = useMemo(() => {
    const params: string[] = [];
    if (statusFilter && statusFilter !== 'ALL')
      params.push(`status=${encodeURIComponent(statusFilter)}`);
    if (debouncedSearchQ) params.push(`search=${encodeURIComponent(debouncedSearchQ)}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    return params.length ? `?${params.join('&')}` : '';
  }, [statusFilter, debouncedSearchQ, page, size]);

  useEffect(() => {
    let mounted = true;
    fetchOrders(mounted);
    return () => {
      mounted = false;
    };
  }, [selectedRest, queryParams, page, size, statusFilter, debouncedSearchQ]);

  async function fetchOrders(mounted: boolean = true) {
    if (!selectedRest) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    setOrders([]);
    setSelected({});
    //if (debouncedSearchQ !== '') {
    try {
      // try restaurant-scoped endpoints in priority order (same approach as before)
      const tryList = [
        `/api/${selectedRest}/orders/search?restaurantId=${selectedRest}&page=${page}&size=${size}${statusFilter && statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}${debouncedSearchQ ? `&search=${encodeURIComponent(debouncedSearchQ)}` : ''}`,
        `/api/${selectedRest}/orders${queryParams}`,
        `/api/restaurants/${selectedRest}/orders${queryParams}`,
      ];
      let got = false;
      for (let url of tryList) {
        if (debouncedSearchQ === '') url = `/api/${selectedRest}/orders${queryParams}`; // skip search endpoint if no search
        try {
          const res = await api.get(url);
          if (!mounted) return;
          const payload = res.data ?? {};
          // server could be pageable: { content: [], totalElements }
          const items = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.content)
              ? payload.content
              : (payload?.items ?? payload?.orders ?? payload?.data ?? []);
          setOrders(items);
          // try to infer total
          if (payload.totalElements !== undefined) setTotal(payload.totalElements);
          else if (payload.total !== undefined) setTotal(payload.total);
          else setTotal(null);
          got = true;
          break;
        } catch (e) {
          // try next
        }
      }
      if (!got) {
        setError('Failed to fetch orders for selected restaurant');
      }
    } catch (err) {
      console.error('Unexpected error fetching orders', err);
      setError('Failed to load orders');
    } finally {
      if (mounted) setLoading(false);
      //}
    }
  }

  // selection helpers
  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function selectAllVisible() {
    const map: Record<string, boolean> = {};
    orders.forEach((o) => {
      map[o.id ?? o.orderId] = true;
    });
    setSelected(map);
  }
  function clearSelection() {
    setSelected({});
  }

  async function bulkUpdateStatus(newStatus: string) {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return alert('No orders selected');
    if (!selectedRest) return alert('No restaurant selected');
    if (!confirm(`Mark ${ids.length} orders as ${newStatus}?`)) return;
    setBulkBusy(true);
    try {
      // PATCH each (you could batch on server if available)
      await Promise.all(
        ids.map((id) =>
          api.patch(`/api/${selectedRest}/orders/${id}`, { status: newStatus }).catch((e) => {
            throw e;
          }),
        ),
      );
      alert('Bulk update success');
      setSelected({});
      setPage(0);
      fetchOrders(true);
    } catch (err: any) {
      console.error('Bulk update error', err);
      alert('Bulk update failed: ' + (err?.response?.data?.message ?? err?.message ?? 'unknown'));
    } finally {
      setBulkBusy(false);
    }
  }

  function exportVisibleCsv() {
    if (!orders || orders.length === 0) return alert('No orders to export');
    // flatten relevant fields
    const rows = orders.map((o: any) => ({
      id: o.id ?? o.orderId,
      status: o.status ?? o.orderStatus,
      customer: o.customerName ?? o.customer ?? '',
      phone: o.customerPhone ?? o.phone ?? '',
      tableId: o.tableId ?? o.table?.id ?? '',
      total: o.total ?? o.amount ?? o.totalAmount ?? 0,
      placedAt: o.placedAt ?? o.createdAt ?? '',
    }));
    downloadCsv(`orders_${selectedRest ?? 'global'}_page${page}.csv`, rows);
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOrders();
            }}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 items-end bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
          {loadingRestaurants ? (
            <div className="text-[10px] text-gray-400 italic">Loading...</div>
          ) : (
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
            >
              <option value="">-- select --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0 col-span-2 lg:col-span-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Search</label>
          <input
            placeholder="ID or Customer..."
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setPage(0);
            }}
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0 col-span-2 lg:col-span-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Page size</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} items
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={selectAllVisible} className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            All
          </button>
          <button onClick={clearSelection} className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </button>
          <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />
          <button
            onClick={() => bulkUpdateStatus('READY')}
            disabled={bulkBusy}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            Ready
          </button>
          <button
            onClick={() => bulkUpdateStatus('SERVED')}
            disabled={bulkBusy}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            Served
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
          <button onClick={exportVisibleCsv} className="px-3 py-1.5 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors h-8">
            Export CSV
          </button>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total: {total ?? orders.length}</div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-4">{error}</div>}

      <div className="space-y-3">
        {orders.length === 0 && !loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No orders found</div>
          </div>
        ) : (
          orders.map((o: any) => {
            const id = o.id ?? o.orderId;
            const status = o.status ?? o.orderStatus;
            const customerName = o.customerName ?? o.customer ?? 'Guest';
            const customerPhone = o.customerPhone ?? o.phone ?? '';
            const orderItems = o.items ?? o.orderItems ?? o.itemsOrdered ?? [];
            const itemsSummary = orderItems.length > 0 
              ? orderItems.map((it: any) => `${it.name ?? it.dishName ?? 'Item'} x${it.quantity ?? 1}`).join(', ')
              : 'No items details';

            return (
              <div
                key={id}
                className="p-4 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={!!selected[id]}
                      onChange={() => toggleSelect(id)}
                      className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{id}</span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                         status === 'PLACED' ? 'bg-amber-50 text-amber-700 border-amber-100/50' :
                         status === 'READY' ? 'bg-green-50 text-green-700 border-green-100/50' :
                         status === 'SERVED' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                         'bg-blue-50 text-blue-700 border-blue-100/50'
                       }`}>
                         {status}
                       </span>
                       {o.tableId && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-widest border border-indigo-100/50">T-{o.tableId}</span>}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 mb-2">
                      <div className="text-sm font-black text-gray-900 truncate flex items-center gap-2">
                        {customerName}
                        {customerPhone && <span className="text-xs font-bold text-gray-400">• {customerPhone}</span>}
                      </div>
                      <div className="text-[11px] text-gray-500 font-bold line-clamp-1 italic">
                        {itemsSummary}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-black text-gray-900">
                      ₹{o.total ?? o.amount ?? o.totalAmount ?? 0}
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {orderItems.length} items
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/orders/${id}?restaurantId=${selectedRest}`)}
                    className="h-9 px-5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-blue-100/30"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="h-9 px-4 border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <button 
            onClick={() => setPage((p) => p + 1)} 
            className="h-9 px-4 border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Page {page} • Showing {orders.length}
        </div>
      </div>
    </div>
  );
}
