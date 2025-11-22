// src/components/OrderStatusFloating.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';

// If you have a createStompClient hook (used in StaffDashboard), import it.
// If not, this component will gracefully fallback to polling.
import useStomp from '../hooks/useStomp'; // optional; keep if exists

type OrderStatus = {
  id: string;
  restaurantId?: string;
  tableId?: string;
  status?: string; // PLACED / PREPARING / READY / SERVED / COMPLETED / CANCELLED
  placedAt?: string;
  estimatedPrepMins?: number | null;
  items?: Array<{ dishId: string; dishName?: string; quantity: number }>;
  positionInQueue?: number | null;
};

export default function OrderStatusFloating() {
  const storedOrderId =
    typeof window !== 'undefined' ? localStorage.getItem('qm_last_order_id') : null;
  const [orderId, setOrderId] = useState<string | null>(storedOrderId);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stompClient, setStompClient] = useState<any>(null);

  useEffect(() => {
    setOrderId(storedOrderId);
  }, [storedOrderId]);

  useEffect(() => {
    if (!orderId) return;

    let pollTimer: any = null;
    let active = true;

    async function fetchStatus() {
      setLoading(true);
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        if (!active) return;
        setOrder(res.data);
      } catch (err: any) {
        console.error('Order status fetch failed', err);
        setError(err?.response?.data?.message || 'Failed to fetch order status');
      } finally {
        if (active) setLoading(false);
      }
    }

    // try WS subscription if createStompClient is available
    let c: any = null;
    try {
      c = useStomp?.();
    } catch (e) {
      c = null;
    }

    if (c) {
      c.onConnect = () => {
        console.debug('OrderStatus: STOMP connected');
        setWsConnected(true);
        // subscribe to either order-specific topic or restaurant orders topic (both handled)
        // try order-specific first
        try {
          c.subscribe(`/topic/orders/${orderId}`, (msg: any) => {
            const payload = JSON.parse(msg.body);
            setOrder(payload);
          });
        } catch (e) {
          // fallback to restaurant-level topic if order contains restaurantId
          // we'll subscribe to the generic orders topic and filter in callback
          c.subscribe(`/topic/restaurants/*/orders`, (msg: any) => {
            try {
              const payload = JSON.parse(msg.body);
              if (payload?.id === orderId) setOrder(payload);
            } catch (err) {}
          });
        }
      };
      c.activate();
      setStompClient(c);
    } else {
      // no stomp, do polling
      fetchStatus();
      pollTimer = setInterval(fetchStatus, 7000);
    }

    // also start polling as a fallback even with WS active (infrequent)
    pollTimer = setInterval(fetchStatus, 15000);

    return () => {
      active = false;
      try {
        if (pollTimer) clearInterval(pollTimer);
      } catch {}
      try {
        if (c) c.deactivate();
      } catch {}
    };
  }, [orderId]);

  function clearTracking() {
    localStorage.removeItem('qm_last_order_id');
    setOrderId(null);
    setOrder(null);
  }

  if (!orderId) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded shadow p-3 w-80">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600">Order Tracking</div>
            <div className="font-medium">Order #{orderId}</div>
          </div>
          <div>
            <button onClick={clearTracking} className="text-xs text-red-600">
              Close
            </button>
          </div>
        </div>

        {loading && <div className="text-xs text-gray-500 mt-2">Loading...</div>}

        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}

        {order && (
          <div className="mt-2 text-sm">
            <div>
              <strong>Status:</strong> {order.status ?? '—'}
            </div>
            {order.estimatedPrepMins != null && (
              <div className="text-xs text-gray-600">ETA: ~{order.estimatedPrepMins} mins</div>
            )}
            {typeof order.positionInQueue === 'number' && (
              <div className="text-xs text-gray-600">Position: {order.positionInQueue}</div>
            )}

            {order.items && order.items.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500">Items</div>
                <ul className="text-sm mt-1">
                  {order.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>
                        {it.quantity} × {it.dishName ?? it.dishId}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3">
              <a href={`/order/success/${orderId}`} className="text-blue-600 text-sm">
                View details
              </a>
            </div>
          </div>
        )}

        {!order && !loading && <div className="text-xs text-gray-500 mt-2">No details yet</div>}
      </div>
    </div>
  );
}
