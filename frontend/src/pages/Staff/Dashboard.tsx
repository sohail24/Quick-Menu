// src/pages/Staff/StaffDashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import useStomp from '../../hooks/useStomp';
import { IMessage } from '@stomp/stompjs';

/**
 * StaffDashboard - simplified authoritative approach
 *
 * - Treat backend as source-of-truth: after any action (PATCH) re-fetch authoritative data.
 * - Use STOMP messages only to upsert/replace items using server payloads (no optimistic merging).
 * - Ignore non-JSON or malformed frames.
 *
 * Requirements:
 * - GET /api/auth/me  -> user profile with assignedRestaurantId
 * - GET /api/{restaurantId}/orders    -> list (paged or array)
 * - GET /api/{restaurantId}/orders/{orderId} -> single order (optional; otherwise list refetch)
 * - PATCH /api/{restaurantId}/orders/{orderId} -> update status
 * - GET /api/{restaurantId}/bells     -> list (array or paged)
 * - GET /api/{restaurantId}/bells/{bellId} -> single bell (optional)
 * - PATCH /api/{restaurantId}/bells/{bellId}/ack -> ack endpoint
 * - STOMP topics: /topic/restaurants/{restaurantId}/orders and /topic/restaurants/{restaurantId}/bells
 */

type Order = any;
type Bell = any;
type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  assignedRestaurantId?: string;
  assignedRestaurantIds?: string[];
};

export default function StaffDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [bells, setBells] = useState<Bell[]>([]);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stomp = useStomp();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 1) load current user profile to discover assignedRestaurantId
  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((res) => {
        if (!mountedRef.current) return;
        setUser(res.data);
        const assigned =
          res.data?.assignedRestaurantId ??
          (Array.isArray(res.data?.assignedRestaurantIds) && res.data.assignedRestaurantIds[0]) ??
          null;
        if (assigned) setRestaurantId(assigned);
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
        setError('Failed to load profile. Are you logged in?');
      });
  }, []);

  // 2) fetch authoritative lists (orders + bells)
  async function fetchOrdersList() {
    if (!restaurantId) return;
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const res = await api.get(`/api/${restaurantId}/orders?${params.toString()}`);
      const payload = res.data;
      let list: Order[] = [];
      
      if (!payload) {
        list = [];
      } else if (payload.content && Array.isArray(payload.content)) {
        list = payload.content;
        setTotalPages(payload.totalPages ?? 0);
      } else if (Array.isArray(payload)) {
        // Fallback for non-paged response
        list = payload;
        setTotalPages(1);
      } else if (payload.id) {
        list = [payload];
      } else {
        list = payload.orders ?? payload.items ?? [];
      }
      setOrders(list);
    } catch (e) {
      console.error('fetchOrdersList failed', e);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBellsList() {
    if (!restaurantId) return;
    try {
      const res = await api.get(`/api/${restaurantId}/bells`);
      const payload = res.data;
      const list: Bell[] = Array.isArray(payload) ? payload : (payload?.content ?? []);
      setBells(list);
    } catch (e) {
      // some backends might not expose bells list; that's OK
      console.warn('fetchBellsList failed (may be optional)', e);
    }
  }

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      await fetchOrdersList();
      await fetchBellsList();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, page, size, startDate, endDate]);

  // safe JSON parse of STOMP message body
  function safeParseMsg(msg: IMessage | null): any | null {
    if (!msg) return null;
    const b = (msg as any).body;
    if (!b) return null;
    try {
      return JSON.parse(b);
    } catch (e) {
      console.warn('Ignored non-JSON STOMP frame', e, b);
      return null;
    }
  }

  // 3) STOMP subscriptions - replace/upsert authoritative payload
  useEffect(() => {
    if (!restaurantId) return;

    const ordersTopic = `/topic/restaurants/${restaurantId}/orders`;
    const bellsTopic = `/topic/restaurants/${restaurantId}/bells`;

    // Small delay to ensure STOMP client is connected before subscribing
    const timeoutId = setTimeout(() => {
      const orderSub = stomp.subscribe(ordersTopic, (msg) => {
        const payload = safeParseMsg(msg);
        if (!payload) return;
        // server should send full order object; otherwise ignore
        const orderObj = payload.id ? payload : payload.order || payload.data || null;
        if (!orderObj || !orderObj.id) return;
        console.log('[STOMP] order message received:', orderObj);
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === orderObj.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = orderObj;
            return copy;
          }
          return [orderObj, ...prev];
        });
      });

      const bellSub = stomp.subscribe(bellsTopic, (msg) => {
        const payload = safeParseMsg(msg);
        if (!payload) return;
        const bellObj = payload.id ? payload : payload.bell || payload.data || null;
        if (!bellObj || !bellObj.id) return;
        console.log('[STOMP] bell message received:', bellObj);
        setBells((prev) => {
          const idx = prev.findIndex((b) => b.id === bellObj.id);
          if (idx >= 0) {
            // Merge with existing data to preserve fields not in STOMP message
            const merged = { ...prev[idx], ...bellObj };
            const copy = [...prev];
            copy[idx] = merged;
            return copy;
          }
          return [bellObj, ...prev];
        });
      });

      return () => {
        try {
          orderSub?.unsubscribe();
        } catch {}
        try {
          bellSub?.unsubscribe();
        } catch {}
      };
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // 4) actions: change order status and ack bell
  async function changeOrderStatus(orderId: string, newStatus: string) {
    if (!restaurantId) {
      setError('No restaurant assigned');
      return;
    }
    try {
      setError(null);
      await api.patch(`/api/${restaurantId}/orders/${orderId}`, { status: newStatus });
      // authoritative: either re-fetch single order (if endpoint exists) or re-fetch list
      try {
        const res = await api.get(`/api/${restaurantId}/orders/${orderId}`);
        const updated = res.data;
        if (updated && updated.id) {
          // Preserve items if backend response doesn't include them
          const preservedItems = updated.items || 
            orders.find(o => o.id === orderId)?.items || [];
          const enriched = { ...updated, items: preservedItems };
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? enriched : o)));
          return;
        }
      } catch (e) {
        // fallback to refetch full list
      }
      await fetchOrdersList();
    } catch (err: any) {
      console.error('changeOrderStatus error', err);
      setError(err?.response?.data?.message || 'Failed to update order');
      // refetch to recover
      await fetchOrdersList();
    }
  }

  async function markOrderAsPaid(orderId: string) {
    if (!restaurantId) return;
    try {
      setError(null);
      await api.patch(`/api/${restaurantId}/orders/${orderId}`, { paymentStatus: 'PAID' });
      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'PAID' } : o)));
    } catch (err: any) {
      console.error('markOrderAsPaid error', err);
      setError(err?.response?.data?.message || 'Failed to update payment status');
    }
  }

  async function ackBell(bellId: string) {
    if (!restaurantId) {
      setError('No restaurant assigned');
      return;
    }
    try {
      setError(null);
      await api.patch(`/api/${restaurantId}/bells/${bellId}/ack`);
      await fetchBellsList();
    } catch (err: any) {
      console.error('ackBell error:', err?.response?.status);
      setError(err?.response?.data?.message || 'Failed to acknowledge bell');
      await fetchBellsList();
    }
  }

  // helpers
  function formatDate(d?: string | null) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleString();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Signed in as: {user?.name ?? user?.email ?? 'Unknown'}
        </div>
        <div className="text-sm text-gray-600">Restaurant: {restaurantId ?? 'Not assigned'}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
               Orders
               <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">{orders.length}</span>
            </h2>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-3">
             <div className="flex flex-col">
               <label className="text-xs text-gray-500">Start</label>
               <input 
                 type="datetime-local" 
                 className="border rounded px-2 py-1 text-sm"
                 value={startDate}
                 onChange={e => { setStartDate(e.target.value); setPage(0); }}
               />
             </div>
             <div className="flex flex-col">
               <label className="text-xs text-gray-500">End</label>
               <input 
                 type="datetime-local" 
                 className="border rounded px-2 py-1 text-sm"
                 value={endDate}
                 onChange={e => { setEndDate(e.target.value); setPage(0); }}
               />
             </div>
             <div className="flex flex-col">
               <label className="text-xs text-gray-500">Show</label>
               <select 
                 className="border rounded px-2 py-1 text-sm bg-white"
                 value={size}
                 onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
               >
                 <option value={5}>5 per page</option>
                 <option value={10}>10 per page</option>
                 <option value={20}>20 per page</option>
                 <option value={50}>50 per page</option>
                 <option value={100}>100 per page</option>
               </select>
             </div>
             {(startDate || endDate) && (
               <button 
                 onClick={() => { setStartDate(''); setEndDate(''); setPage(0); }}
                 className="mt-4 text-sm text-blue-600 underline"
               >
                 Clear
               </button>
             )}
          </div>

          {loading && <div>Loading...</div>}
          {!loading && orders.length === 0 && (
            <div className="text-sm text-gray-500">No orders yet</div>
          )}
          <div className="space-y-4">
            {orders.map((o: Order) => {
              const status = (o.status ?? '').toUpperCase();
              const isCompleted =
                status === 'SERVED' || status === 'COMPLETED' || status === 'DELIVERED';
              return (
                <div key={o.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/20 hover:shadow-xl hover:shadow-gray-200/30 transition-all duration-300">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">#{o.id}</div>
                      <div className="text-xs text-gray-500">
                        {o.orderType === 'TAKEAWAY' 
                          ? `Takeaway (Vehicle: ${o.vehicleNumber || 'Counter Pickup'})` 
                          : `Table: ${o.tableId ?? '—'}`
                        } • Placed: {formatDate(o.placedAt)}
                      </div>
                      <div className="mt-2 text-sm">
                        {o.customerName ?? ''} • {o.customerPhone ?? ''}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="mb-2">
                        Status: <strong>{status || '—'}</strong>
                      </div>
                      <div className="mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                          o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {o.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'} ({o.paymentMethod})
                        </span>
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="inline-block"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="#16a34a"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Completed
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {status !== 'PREPARING' && (
                            <button
                              onClick={() => changeOrderStatus(o.id, 'PREPARING')}
                              className="px-2 py-1 bg-yellow-400 rounded text-sm"
                            >
                              Start
                            </button>
                          )}
                          {status !== 'READY' && (
                            <button
                              onClick={() => changeOrderStatus(o.id, 'READY')}
                              className="px-2 py-1 bg-orange-400 rounded text-sm"
                            >
                              Ready
                            </button>
                          )}
                          {status !== 'SERVED' && (
                            <button
                              onClick={() => changeOrderStatus(o.id, 'SERVED')}
                              disabled={o.paymentStatus !== 'PAID'}
                              className={`px-2 py-1 rounded text-sm text-white transition-opacity ${
                                o.paymentStatus !== 'PAID' 
                                ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                : 'bg-green-600 hover:bg-green-700'
                              }`}
                              title={o.paymentStatus !== 'PAID' ? 'Order must be paid before serving' : ''}
                            >
                              Serve
                            </button>
                          )}
                          {o.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => markOrderAsPaid(o.id)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold mt-2 shadow-sm active:scale-95 transition-all"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-xs text-gray-500 mb-1">Items</div>
                    <ul className="space-y-1">
                      {Array.isArray(o.items) &&
                        o.items.map((it: any, idx: number) => (
                          <li key={idx} className="flex justify-between">
                            <span>
                              {it.quantity} × {it.dishName ?? it.dishId}
                            </span>
                            <span>
                              ₹ {((it.priceAtOrder ?? it.price ?? 0) * it.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {orders.length > 0 && (
            <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages || 1}
              </span>
              <button 
                onClick={() => setPage(p => p + 1)}
                 disabled={page >= totalPages - 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
               Bell Requests
               <span className="bg-yellow-100 text-yellow-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">{bells.length}</span>
            </h2>
          </div>
          {bells.length === 0 && <div className="text-sm text-gray-500">No bells</div>}
          <div className="space-y-4">
            {bells.map((b: Bell) => {
              const acked =
                !!b?.acked ||
                !!b?.acknowledged ||
                b?.status === 'ACKED' ||
                b?.status === 'acknowledged';
              return (
                <div key={b.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/20 hover:shadow-xl hover:shadow-gray-200/30 transition-all duration-300 flex justify-between items-start">
                  <div>
                    <div className="font-medium">{b.message ?? 'Bell'}</div>
                    <div className="text-xs text-gray-500">
                      Table: {b.tableId ?? '—'} • {formatDate(b.createdAt ?? b.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {acked ? 'Acked' : 'Pending'}
                    </div>
                  </div>
                  {!acked ? (
                    <button
                      onClick={() => ackBell(b.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Ack
                    </button>
                  ) : (
                    <div className="text-green-600 font-semibold">Acked</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
}
