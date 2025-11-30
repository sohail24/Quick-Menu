// src/pages/Order/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';

export default function OrderSuccess() {
  const { id } = useParams<{ id?: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/orders/${id}`) // try global endpoint; adjust if your path is /api/{restaurantId}/orders/{id}
      .then((res) => setOrder(res.data))
      .catch((err) => {
        console.error('Failed fetching order', err);
        setError('Failed to fetch order details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully</h1>
        <p className="text-sm text-gray-600 mb-4">
          Thank you — your order has been submitted to the kitchen.
        </p>

        {loading && <div>Loading order details...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {order && (
          <div className="space-y-3">
            <div>
              <strong>Order ID:</strong> {order.id}
            </div>
            <div>
              <strong>Table:</strong> {order.tableId}
            </div>
            <div>
              <strong>Customer:</strong> {order.customerName} • {order.customerPhone}
            </div>
            <div>
              <strong>Status:</strong> {order.status}
            </div>
            <div>
              <strong>Customer note:</strong> {order.customerNote}
            </div>
            <div>
              <strong>Items</strong>
              <ul className="mt-2 space-y-1">
                {order.items?.map((it: any) => (
                  <li key={it.id} className="flex justify-between">
                    <div>
                      <p>
                        {it.quantity} x {it.dishName ?? it.dishId}
                      </p>
                      <p className="text-sm text-gray-500">note: {it.note}</p>
                    </div>
                    <span>₹ {((it.priceAtOrder ?? it.price) * it.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <Link
                to={`/menu/${order.restaurantId}?tableId=${order.tableId}`}
                className="text-blue-600"
              >
                Back to menu
              </Link>
            </div>
          </div>
        )}

        {!order && !loading && !error && (
          <div className="text-sm text-gray-500">No extra details available.</div>
        )}
      </div>
    </div>
  );
}
