// src/pages/Admin/AdminOrders.tsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { downloadCsv } from '../../lib/csv';

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
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [total, setTotal] = useState<number | null>(null);

  // selection for bulk actions
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const navigate = useNavigate();

  // load restaurants
  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants')
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

  // build query params
  const queryParams = useMemo(() => {
    const params: string[] = [];
    if (statusFilter && statusFilter !== 'ALL')
      params.push(`status=${encodeURIComponent(statusFilter)}`);
    if (searchQ) params.push(`search=${encodeURIComponent(searchQ)}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    return params.length ? `?${params.join('&')}` : '';
  }, [statusFilter, searchQ, page, size]);

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      if (!selectedRest) {
        setOrders([]);
        return;
      }
      setLoading(true);
      setError(null);
      setOrders([]);
      setSelected({});
      try {
        // try restaurant-scoped endpoints in priority order (same approach as before)
        const tryList = [
          `/api/${selectedRest}/orders${queryParams}`,
          `/api/restaurants/${selectedRest}/orders${queryParams}`,
          `/api/orders?restaurantId=${selectedRest}&page=${page}&size=${size}${statusFilter && statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}${searchQ ? `&search=${encodeURIComponent(searchQ)}` : ''}`,
        ];
        let got = false;
        for (const url of tryList) {
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
      }
    }

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [selectedRest, queryParams, page, size, statusFilter, searchQ]);

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
      // refresh list
      setPage(0);
      // small delay to let backend persist
      setTimeout(() => {
        setSelected({});
        // trigger reload by toggling selectedRest (cheap)
        setSelectedRest((s) => (s ? s + '' : s));
      }, 300);
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
    <div className="p-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPage(0);
              setSelectedRest((s) => (s ? s + '' : s));
            }}
            className="px-3 py-1 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="text-sm block">Restaurant</label>
          {loadingRestaurants ? (
            <div className="text-sm text-gray-600">Loading restaurants...</div>
          ) : (
            <select
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
              className="p-2 border rounded w-full"
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

        <div>
          <label className="text-sm block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded w-full"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block">Search</label>
          <input
            placeholder="order id or customer"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="text-sm block">Page size</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="p-2 border rounded w-full"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={selectAllVisible} className="px-2 py-1 border rounded">
            Select all
          </button>
          <button onClick={clearSelection} className="px-2 py-1 border rounded">
            Clear
          </button>
          <button
            onClick={() => bulkUpdateStatus('READY')}
            disabled={bulkBusy}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            Mark Ready
          </button>
          <button
            onClick={() => bulkUpdateStatus('SERVED')}
            disabled={bulkBusy}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            Mark Served
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportVisibleCsv} className="px-3 py-1 border rounded">
            Export CSV
          </button>
          <div className="text-sm text-gray-600">Total: {total ?? '—'}</div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading orders…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-2">
        {orders.length === 0 && !loading ? (
          <div className="text-gray-600">No orders found.</div>
        ) : (
          orders.map((o: any) => {
            const id = o.id ?? o.orderId;
            const status = o.status ?? o.orderStatus;
            return (
              <div
                key={id}
                className="p-3 bg-white rounded shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected[id]}
                    onChange={() => toggleSelect(id)}
                  />
                  <div>
                    <div className="font-medium">#{id}</div>
                    <div className="text-sm text-gray-500">
                      {o.customerName ?? o.customer ?? ''} — {status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-700">
                    {o.total ? `₹ ${o.total}` : o.amount ? `₹ ${o.amount}` : ''}
                  </div>
                  <button
                    onClick={() => navigate(`/admin/orders/${id}?restaurantId=${selectedRest}`)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1 border rounded mr-2"
          >
            Prev
          </button>
          <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Page: {page} • Showing: {orders.length}
        </div>
      </div>
    </div>
  );
}
