// src/pages/Admin/AdminOrders.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AdminOrders() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load restaurants (and auto-select first) on mount
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

        if (arr.length > 0) {
          // auto-select first restaurant so orders page shows scoped orders immediately
          setSelectedRest((prev) => prev ?? arr[0].id);
        }
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

  // fetch orders whenever selectedRest changes
  useEffect(() => {
    let mounted = true;
    setOrders([]);
    setError(null);

    if (!selectedRest) {
      // nothing selected — do not attempt restaurant-scoped call
      return;
    }

    setLoading(true);

    const fetchRestaurantOrders = async () => {
      try {
        // primary: restaurant-scoped endpoint (common shapes: /api/{restaurantId}/orders or /api/restaurants/{id}/orders)
        // try both variants if needed. First try /api/{restaurantId}/orders
        let tried = false;
        try {
          const res = await api.get(`/api/${selectedRest}/orders?limit=50`);
          if (!mounted) return;
          const payload = res.data ?? {};
          const arr = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.content)
              ? payload.content
              : (payload?.items ?? payload?.orders ?? payload?.data ?? []);
          setOrders(arr);
          console.debug('AdminOrders: got orders from /api/{restaurantId}/orders', payload);
          tried = true;
          return;
        } catch (e) {
          console.debug(
            '/api/{restaurantId}/orders failed, trying /api/restaurants/{id}/orders',
            e,
          );
        }

        // try /api/restaurants/{id}/orders
        try {
          const res2 = await api.get(`/api/restaurants/${selectedRest}/orders?limit=50`);
          if (!mounted) return;
          const payload = res2.data ?? {};
          const arr = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.content)
              ? payload.content
              : (payload?.items ?? payload?.orders ?? payload?.data ?? []);
          setOrders(arr);
          console.debug('AdminOrders: got orders from /api/restaurants/{id}/orders', payload);
          tried = true;
          return;
        } catch (e) {
          console.debug('/api/restaurants/{id}/orders failed, will try global fallback', e);
        }

        // fallback: try global orders endpoint with restaurantId query param
        try {
          const res3 = await api.get(`/api/orders?restaurantId=${selectedRest}&limit=50`);
          if (!mounted) return;
          const payload = res3.data ?? {};
          const arr = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.content)
              ? payload.content
              : (payload?.items ?? payload?.orders ?? payload?.data ?? []);
          setOrders(arr);
          console.debug('AdminOrders: got orders from /api/orders?restaurantId=...', payload);
          tried = true;
          return;
        } catch (e) {
          console.error('All attempts to fetch restaurant-scoped orders failed', e);
          if (!mounted) return;
          setError('Failed to load orders for selected restaurant');
        }

        if (!tried) {
          setError('No orders endpoint available for this restaurant');
        }
      } catch (err) {
        console.error('Unexpected error fetching orders', err);
        if (!mounted) return;
        setError('Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRestaurantOrders();

    return () => {
      mounted = false;
    };
  }, [selectedRest]);

  return (
    <div className="p-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // simple refresh
              if (selectedRest) setSelectedRest((s) => (s ? s + '' : null));
            }}
            className="px-3 py-1 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-3">
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

      {loading && <div className="text-sm text-gray-600">Loading orders…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-3">
        {orders.length === 0 && !loading ? (
          <div className="text-gray-600">No orders found.</div>
        ) : (
          orders.map((o: any) => (
            <div
              key={o.id ?? o.orderId}
              className="p-3 bg-white rounded shadow flex items-center justify-between"
            >
              <div>
                <div className="font-medium">#{o.id ?? o.orderId}</div>
                <div className="text-sm text-gray-500">
                  {o.customerName ?? o.customer ?? ''} — {o.status ?? o.orderStatus ?? ''}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                {o.total ? `₹ ${o.total}` : o.amount ? `₹ ${o.amount}` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
