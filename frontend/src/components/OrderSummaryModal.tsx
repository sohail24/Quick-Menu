// src/components/OrderSummaryModal.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { getActiveOrderFor, setActiveOrder, removeActiveOrder } from '../lib/orderStorage';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  restaurantId: string | null;
  tableId?: string | null; // if null -> modal will fetch available tables
  onOrderPlaced: (resp: any) => void;
  onStopTracking?: () => void;
};

export default function OrderSummaryModal({
  isOpen,
  onClose,
  cart,
  restaurantId,
  tableId,
  onOrderPlaced,
  onStopTracking,
}: Props) {
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(tableId ?? null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  useEffect(() => {
    setLocalCart(cart.map((c) => ({ ...c, note: c.note ?? '' })));
  }, [cart]);

  // watch prop tableId changes
  useEffect(() => {
    setSelectedTable(tableId ?? null);
  }, [tableId]);

  // detect existing order for this restaurant + selected table
  useEffect(() => {
    if (!restaurantId || !selectedTable) {
      setExistingOrderId(null);
      return;
    }
    const ao = getActiveOrderFor(restaurantId, selectedTable);
    setExistingOrderId(ao?.orderId ?? null);
  }, [restaurantId, selectedTable]);

  // fetch available tables for selection (always fetch, don't skip if selectedTable exists)
  useEffect(() => {
    if (!isOpen) return;
    if (!restaurantId) return;
    setLoadingTables(true);
    api
      .get(`/api/restaurants/${restaurantId}/tables/available`)
      .then((res) => {
        setTables(res.data || []);
        // only auto-select first table if no selectedTable yet
        if (!selectedTable && (res.data || []).length > 0) {
          setSelectedTable(res.data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch tables', err);
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

  async function submitNewOrder() {
    if (!selectedTable) return setError('Please select a table');
    if (!customerName || !customerPhone) return setError('Please provide your name and phone');
    if (!restaurantId) return setError('Missing restaurant');
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
      const resp = res.data;
      // persist mapping: restaurant+table -> orderId
      const id = resp?.id ?? resp?.orderId ?? null;
      if (id) {
        try {
          setActiveOrder(
            restaurantId,
            selectedTable,
            id,
            resp?.placedAt ?? new Date().toISOString(),
          );
        } catch (e) {
          // ignore
        }
      }
      onOrderPlaced(resp);
      onClose();
    } catch (err: any) {
      console.error('Order submit failed', err);
      setError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  // if an existing order exists, present a simple view (no full checkout).
  // Offer "View order" and "Stop tracking" actions.
  function stopTracking() {
    if (!restaurantId || !selectedTable) return;
    removeActiveOrder(restaurantId, selectedTable);
    setExistingOrderId(null);
    // Reset selectedTable so available tables will be fetched again
    setSelectedTable(null);
    // Clear tables to force fresh fetch
    setTables([]);
    // Don't clear localCart - keep it so user can place a new order with their items
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNote('');
    onClose();
    // Notify parent to refresh existing order state
    onStopTracking?.();
  }

  if (!isOpen) return null;

  // compute total
  const total = localCart.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded max-w-2xl w-full p-4 shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            {existingOrderId ? 'Existing order' : 'Order summary'}
          </h3>
          <button onClick={onClose} className="text-gray-600">
            Close
          </button>
        </div>

        {existingOrderId ? (
          <div>
            <div className="mb-3 text-sm">
              You already placed an order for this table: <strong>#{existingOrderId}</strong>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  try {
                    window.location.href = `/order/success/${existingOrderId}`;
                  } catch {}
                }}
              >
                View order
              </button>
              <button className="px-4 py-2 border rounded" onClick={stopTracking}>
                Stop tracking
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-3 max-h-72 overflow-auto">
              {localCart.map((it, idx) => (
                <div key={it.dishId} className="flex items-start gap-3 border-b pb-2">
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-gray-600">₹ {it.price}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => changeQty(idx, -1)}
                        className="px-2 py-1 border rounded"
                      >
                        -
                      </button>
                      <div>{it.quantity}</div>
                      <button
                        onClick={() => changeQty(idx, +1)}
                        className="px-2 py-1 border rounded"
                      >
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
                <strong>Total:</strong> ₹ {total.toFixed(2)}
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
                ) : tables.length === 0 && !selectedTable ? (
                  <div className="text-sm text-gray-600">No available tables right now</div>
                ) : (
                  <select
                    value={selectedTable ?? ''}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="p-2 border rounded w-full"
                  >
                    {tables.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
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
                  onClick={submitNewOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={submitting}
                >
                  {submitting ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
