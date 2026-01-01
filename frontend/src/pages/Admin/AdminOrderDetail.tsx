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
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className=" mx-auto">
        {/* Header with Back and Print buttons */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{orderId}</h1>
            <p className="text-gray-600 mt-1">
              {order?.customerName ?? 'Customer'} • {order?.customerPhone ?? ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              onClick={printReceipt}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Print
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-1">Current Status</p>
              <p className="text-3xl font-black text-gray-900 mt-1">
                {order.status ?? order.orderStatus}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={saving}
                onClick={() => changeStatus('PREPARING')}
                className="px-6 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-95"
              >
                Start Preparing
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('READY')}
                className="px-6 py-3 bg-green-500 text-white rounded-2xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 shadow-lg shadow-green-500/20 transition-all active:scale-95"
              >
                Mark Ready
              </button>
              <button
                disabled={saving}
                onClick={() => changeStatus('SERVED')}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                Mark Served
              </button>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-10">
          {/* Header Section */}
          <div className="border-b-4 border-gray-900 pb-6 mb-8">
            <p className="text-2xl font-bold text-gray-900 mb-2">Restaurant: {restaurantId}</p>
            <p className="text-gray-600 mb-1">Order ID: #{orderId}</p>
            <p className="text-gray-600 mb-4">Table ID: #{order?.tableId ?? 'N/A'}</p>
            <p className="text-gray-900">
              <strong>{order?.customerName ?? 'Customer'}</strong> • {order?.customerPhone ?? ''}
            </p>
            <p className="text-gray-600 mt-1">Customer note: {order?.customerNote ?? 'N/A'}</p>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Item
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Price
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {(order?.items ?? []).map((it: LineItem, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900 font-medium">
                      {it.name ?? it.dishName}{' '}
                      {it.note && <div className="text-xs text-gray-500 mt-1">Note: {it.note}</div>}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">{it.quantity ?? 1}</td>
                    <td className="py-4 px-4 text-right text-gray-700">
                      ₹ {(it.priceAtOrder ?? 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900 font-semibold">
                      ₹ {((it.priceAtOrder ?? 0) * (it.quantity ?? 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="">
            <div className="flex justify-between pb-3">
              <span className="text-gray-700">Subtotal</span>
              <span className="text-gray-700">
                ₹ {order?.total ?? order?.amount ?? order?.grandTotal ?? order?.totalAmount ?? 0}
              </span>
            </div>
            <div className="flex justify-between border-t-4 border-gray-900 pt-4">
              <span className="text-xl font-bold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                ₹ {order?.total ?? order?.amount ?? order?.grandTotal ?? order?.totalAmount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Timeline</h3>
          <div className="space-y-4">
            {timeline.map((t: any, i: number) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">{t.label}</p>
                  <p className="text-sm text-gray-600">{t.at ?? t.time ?? ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
