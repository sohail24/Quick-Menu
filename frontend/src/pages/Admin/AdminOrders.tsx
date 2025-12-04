// src/pages/Admin/AdminOrders.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/api/orders?limit=50')
      .then((res) => {
        if (!mounted) return;
        const data = res.data;
        // handle different shapes
        setOrders(Array.isArray(data) ? data : (data?.items ?? data?.orders ?? []));
      })
      .catch((err) => {
        console.warn('Failed to load orders', err);
        setError('Failed to load orders');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>
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
                  {o.customerName ?? o.customer ?? ''} — {o.status}
                </div>
              </div>
              <div className="text-sm text-gray-700">{o.total ? `₹ ${o.total}` : ''}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
