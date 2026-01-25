// src/pages/Admin/AdminOrderDetail.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

type LineItem = {
  dishId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  note?: string;
  priceAtOrder?: number;
  dishName?: string;
};

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, restaurantId]);

  async function loadOrder() {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      // try restaurant-scoped get first
      let res;
      try {
        if (restaurantId) res = await api.get(`/api/${restaurantId}/orders/${orderId}`);
        else throw new Error('no restaurantId');
      } catch (e) {
        try {
          res = await api.get(`/api/restaurants/${restaurantId}/orders/${orderId}`);
        } catch (e2) {
          res = await api.get(`/api/orders/${orderId}`);
        }
      }
      setOrder(res.data);
    } catch (err: any) {
      console.error('Failed to load order', err);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(newStatus: string) {
    if (!orderId || !restaurantId) return alert('Missing restaurantId');
    if (!confirm(`Mark order ${orderId} as ${newStatus}?`)) return;
    setSaving(true);
    try {
      // PATCH to update status (payload shape might be { status } or { orderStatus })
      const payload = { status: newStatus };
      await api.patch(`/api/${restaurantId}/orders/${orderId}`, payload);
      // optimistic update: refresh order
      await loadOrder();
      alert('Status updated');
    } catch (err: any) {
      console.error('Failed to change status', err);
      alert('Failed to change status: ' + (err?.response?.data?.message ?? err?.message));
    } finally {
      setSaving(false);
    }
  }

  function printReceipt() {
    const w = window.open('', '_blank');
    if (!w) return alert('Unable to open print window');
    const html = `
      <html><head><title>Order ${orderId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f9f9f9; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        .hdr { border-bottom: 3px solid black; padding-bottom: 20px; margin-bottom: 30px; }
        .restaurant-name { font-size: 24px; font-weight: bold; color: black; margin-bottom: 5px; }
        .order-number, .table-number { font-size: 14px; color: #666; margin-bottom: 10px; }
        .customer-info { font-size: 13px; color: #555; line-height: 1.6; }
        
        .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items thead { background: #6666662c; }
        .items th { padding: 12px; text-align: left; font-weight: 600; color: black; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid black; }
        .items td { padding: 14px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .items tbody tr:hover { background: #f9fafb; }
        .items .item-name { font-weight: 500; color: black; }
        .items .item-note { font-size: 12px; color: #555; margin-top: 4px; }
        .items .qty { text-align: center; color: black; }
        .items .price { text-align: right; color: black; }
        .items .subtotal { text-align: right; font-weight: 600; color: black; }
        
        .totals { margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
        .total-row.final { border-bottom: 2px solid black; border-top: 2px solid black; padding: 16px 0; font-size: 18px; font-weight: bold; color: black; }
        
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #999; }
        .divider { border-top: 2px dashed #ddd; margin: 20px 0; }
      </style>
      </head><body>
      <div class="invoice">
        <div class="hdr">
          <div class="restaurant-name">Restaurant: ${restaurantId}</div>
          <div class="order-number">Order ID: #${orderId}</div>
          <div class="table-number">Table ID: #${order?.tableId ?? 'N/A'}</div>
          <div class="customer-info">
            <strong>${order?.customerName ?? 'Customer'}</strong> • ${order?.customerPhone ?? ''}
            <p class="text-gray-600 mt-1">Customer note: ${order?.customerNote ?? 'N/A'}</p>
          </div>
        </div>
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th class="qty">Qty</th>
              <th class="price">Price</th>
              <th class="subtotal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(order?.items ?? []).map((it: LineItem) => `<tr><td class="item-name">${it.name ?? it.dishName} ${it.note ? `<div class="item-note">(Note: ${it.note})</div>` : ''}</td><td class="qty">${it.quantity ?? 1}</td><td class="price">₹ ${(it.priceAtOrder ?? 0).toFixed(2)}</td><td class="subtotal">₹ ${((it.priceAtOrder ?? 0) * (it.quantity ?? 1)).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹ ${order?.total ?? order?.amount ?? order?.grandTotal ?? order?.totalAmount ?? 0}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount</span>
            <span>₹ ${order?.total ?? order?.amount ?? order?.grandTotal ?? order?.totalAmount ?? 0}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="footer">
          <div>Placed: ${order?.placedAt ?? order?.createdAt ?? 'N/A'}</div>
          <div style="margin-top: 10px;">Thank you for your order!</div>
        </div>
      </div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading order...</div>;
  if (!order) return <div className="p-4">No order found</div>;

  const items: LineItem[] = order.items ?? order.orderItems ?? order.itemsOrdered ?? [];

  // Build timeline: prefer server-provided history, else infer
  const timeline = order.history ??
    order.timeline ??
    order.audit ?? [
      { label: 'Placed', at: order.placedAt ?? order.createdAt },
      ...(order.status ? [{ label: order.status, at: order.updatedAt ?? null }] : []),
    ];

  return (
    <div className="p-4 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back and Print buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
             <button
                onClick={() => navigate(-1)}
                className="h-10 w-10 flex items-center justify-center border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ←
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">Order #{orderId}</h1>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 truncate">
                  {order?.customerName ?? 'Guest'} • {order?.customerPhone ?? ''}
                </p>
              </div>
          </div>
          <button
            onClick={printReceipt}
            className="h-10 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            Print Receipt
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/20 border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Current Status</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">
                {order.status ?? order.orderStatus}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
              <button
                disabled={saving}
                onClick={() => changeStatus('PREPARING')}
                className="h-11 px-6 border border-gray-100 bg-gray-50/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-all active:scale-95 flex-1 sm:flex-none"
              >
                Prepare
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('READY')}
                className="h-11 px-6 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 disabled:opacity-50 shadow-lg shadow-green-500/20 transition-all active:scale-95 flex-1 sm:flex-none"
              >
                Ready
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('SERVED')}
                className="h-11 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex-1 sm:flex-none"
              >
                Served
              </button>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/20 border border-gray-100 p-6 sm:p-8">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                Order Items
                <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{items.length}</span>
              </h2>

              {/* Mobile Card List */}
              <div className="sm:hidden space-y-4">
                {items.map((it: LineItem, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-gray-900">{it.name ?? it.dishName}</div>
                        {it.note && <div className="text-[10px] font-bold text-gray-500 mt-1 italic">"{it.note}"</div>}
                      </div>
                      <div className="text-sm font-black text-gray-900">₹{((it.priceAtOrder ?? 0) * (it.quantity ?? 1)).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       <span>Qty: {it.quantity ?? 1}</span>
                       <span>Rate: ₹{(it.priceAtOrder ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                      <th className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                      <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                      <th className="text-right py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((it: LineItem, idx: number) => (
                      <tr key={idx} className="group">
                        <td className="py-4 min-w-0">
                          <div className="text-sm font-black text-gray-900 leading-tight truncate">{it.name ?? it.dishName}</div>
                          {it.note && <div className="text-[10px] font-bold text-gray-500 mt-1 italic italic">Note: {it.note}</div>}
                        </td>
                        <td className="py-4 text-center text-sm font-black text-gray-700">{it.quantity ?? 1}</td>
                        <td className="py-4 text-right text-sm font-bold text-gray-500">₹{(it.priceAtOrder ?? 0).toFixed(2)}</td>
                        <td className="py-4 text-right text-sm font-black text-gray-900">₹{((it.priceAtOrder ?? 0) * (it.quantity ?? 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-black text-gray-700">₹{(order?.total ?? order?.amount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-gray-900 uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">₹{(order?.total ?? order?.amount ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/20 border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Customer Details</h3>
              <div className="space-y-4">
                 <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Customer Name</p>
                    <p className="text-sm font-black text-gray-900">{order?.customerName ?? 'Guest'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Table Info</p>
                    <p className="text-sm font-black text-gray-900">Table #{order?.tableId ?? 'Counter'}</p>
                 </div>
                 {order?.customerPhone && (
                   <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Phone Number</p>
                      <p className="text-sm font-black text-gray-900">{order?.customerPhone}</p>
                   </div>
                 )}
                 {order?.customerNote && (
                   <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Instructions</p>
                      <p className="text-sm font-bold text-gray-600 italic leading-relaxed">"{order?.customerNote}"</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/20 border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Timeline</h3>
              <div className="space-y-6">
                {(timeline ?? []).map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="relative flex-shrink-0 mt-1">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50" />
                       {i < (timeline.length - 1) && <div className="absolute top-2.5 left-1 w-0.5 h-10 bg-blue-100" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide leading-none">{t.label}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{t.at ?? t.time ?? ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
