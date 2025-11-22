// src/components/OrderSummaryModal.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function OrderSummaryModal({
  isOpen,
  onClose,
  cart,
  restaurantId,
  onOrderPlaced,
}: any) {
  const [localCart, setLocalCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalCart(cart.map((c: any) => ({ ...c, note: c.note ?? '' })));
  }, [cart]);

  useEffect(() => {
    if (!isOpen) return;
    if (!restaurantId) return;
    setLoadingTables(true);
    setError(null);
    api
      .get(`/api/restaurants/${restaurantId}/tables/available`)
      .then((res) => {
        setTables(res.data || []);
        if ((res.data || []).length > 0) setSelectedTable(res.data[0].id);
      })
      .catch((err) => {
        console.error('Failed to fetch tables', err);
        setError(err?.response?.data?.message || 'Failed to fetch available tables');
        setTables([]);
      })
      .finally(() => setLoadingTables(false));
  }, [isOpen, restaurantId]);

  function changeQty(index: number, delta: number) {
    setLocalCart((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it,
      ),
    );
  }
  function setItemNote(index: number, note: string) {
    setLocalCart((prev) => prev.map((it, i) => (i === index ? { ...it, note } : it)));
  }

  async function submitOrder() {
    if (!selectedTable) return setError('Please select a table');
    if (!customerName || !customerPhone) return setError('Please provide your name and phone');
    setSubmitting(true);
    setError(null);

    const payload = {
      tableId: selectedTable,
      customerName,
      customerPhone,
      customerNote,
      items: localCart.map((c) => ({ dishId: c.dishId, quantity: c.quantity, note: c.note || '' })),
    };

    try {
      const res = await api.post(`/api/${restaurantId}/orders`, payload);
      // important: persist last order id so OrderStatusFloating and other UI can pick it up
      const id = res.data?.id ?? res.data?.orderId ?? null;
      if (id) {
        try {
          localStorage.setItem('qm_last_order_id', id);
        } catch (e) {}
      }
      // call parent (which will navigate to success page or show toast)
      onOrderPlaced(res.data);
      onClose();
    } catch (err: any) {
      console.error('Order error', err);
      const status = err?.response?.status;
      if (status === 409) {
        setError('Selected table was just occupied. Please choose another table.');
      } else if (status === 401) {
        setError('Session expired. Please login or retry.');
      } else {
        setError(err?.response?.data?.message || 'Order failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded max-w-2xl w-full p-4 shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <button onClick={onClose} className="text-gray-600">
            Close
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-auto">
          {localCart.map((it, idx) => (
            <div key={it.dishId} className="flex items-start gap-3 border-b pb-2">
              <div className="flex-1">
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-gray-600">₹ {it.price}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => changeQty(idx, -1)} className="px-2 py-1 border rounded">
                    -
                  </button>
                  <div>{it.quantity}</div>
                  <button onClick={() => changeQty(idx, +1)} className="px-2 py-1 border rounded">
                    +
                  </button>
                </div>
                <div className="mt-2">
                  <input
                    value={it.note}
                    onChange={(e) => setItemNote(idx, e.target.value)}
                    placeholder="Item note (e.g. no onions)"
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-700">
                Subtotal: ₹ {(it.price * it.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-2">
            <strong>Total:</strong> ₹{' '}
            {localCart.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="p-2 border rounded"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
              className="p-2 border rounded"
            />
          </div>

          <div className="mt-2">
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Additional note for the kitchen"
              className="w-full p-2 border rounded"
              rows={2}
            ></textarea>
          </div>

          <div className="mt-2">
            <label className="block text-sm mb-1">Select table</label>
            {loadingTables ? (
              <div>Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="text-sm text-gray-600">No available tables right now</div>
            ) : (
              <select
                value={selectedTable ?? ''}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="p-2 border rounded w-full"
              >
                {tables.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.qrUrl ? `(${t.qrUrl})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <div className="text-red-600 mt-2">{error}</div>}

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>
            <button
              onClick={submitOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={submitting || tables.length === 0}
            >
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
