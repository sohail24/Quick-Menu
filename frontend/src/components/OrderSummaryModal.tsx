// src/components/OrderSummaryModal.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { getActiveOrderFor, setActiveOrder, removeActiveOrder } from '../lib/orderStorage';
import { X, User, Phone, ClipboardList, MapPin, Plus, Minus, Send, ExternalLink, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import Button from './ui/Button';

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
  tableId?: string | null;
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
  const [existingOrderTableId, setExistingOrderTableId] = useState<string | null>(null);

  useEffect(() => {
    setLocalCart(cart.map((c) => ({ ...c, note: c.note ?? '' })));
  }, [cart]);

  useEffect(() => {
    if (tableId) setSelectedTable(tableId);
  }, [tableId]);

  useEffect(() => {
    if (!restaurantId || !selectedTable) {
      setExistingOrderId(null);
      setExistingOrderTableId(null);
      return;
    }
    const ao = getActiveOrderFor(restaurantId, selectedTable);
    setExistingOrderId(ao?.orderId ?? null);
    setExistingOrderTableId(ao?.tableId ?? null);
  }, [restaurantId, selectedTable]);

  useEffect(() => {
    if (!isOpen || !restaurantId) return;
    setLoadingTables(true);
    // Fetch all tables instead of just available ones for better UX in demo/ordering flow
    api
      .get(`/api/restaurants/${restaurantId}/tables`)
      .then((res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.tables ?? []);
        
        setTables(arr);
        if (!selectedTable && arr.length > 0) {
          setSelectedTable(arr[0].id);
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
      const id = resp?.id ?? resp?.orderId ?? null;
      if (id) {
        setActiveOrder(restaurantId, selectedTable, id, resp?.placedAt ?? new Date().toISOString());
        // Also persist for global tracking
        try {
          localStorage.setItem('qm_last_order_id', id);
        } catch (e) {}
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

  function stopTracking() {
    if (!restaurantId || !selectedTable) return;
    removeActiveOrder(restaurantId, selectedTable);
    try {
      localStorage.removeItem('qm_last_order_id');
    } catch {}
    setExistingOrderId(null);
    setExistingOrderTableId(null);
    setSelectedTable(null);
    setTables([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNote('');
    onClose();
    onStopTracking?.();
  }

  if (!isOpen) return null;

  const total = localCart.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-[32px] max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                <ClipboardList className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  {existingOrderId ? 'Order Progress' : 'Checkout'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Summary & Details</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {existingOrderId ? (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-yellow-50 rounded-3xl text-yellow-600 mb-6">
                 <Clock className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-2">Active Order Found!</h4>
              <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                You already have an order placed for <span className="text-blue-600 font-bold">{tables.find(t => t.id === existingOrderTableId)?.name || 'Table'} ({existingOrderTableId})</span>.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = `/order/success/${existingOrderId}`}
                  className="w-full"
                >
                  <ExternalLink className="w-5 h-5 mr-2" /> View Order Status
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={stopTracking}
                  className="w-full"
                >
                  <Trash2 className="w-5 h-5 mr-2" /> Start New Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                   <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Your Items</h4>
                   <div className="h-px flex-1 bg-gray-100"></div>
                </div>
                {localCart.map((it, idx) => (
                  <div key={it.dishId} className="bg-gray-50 rounded-3xl p-4 flex items-start gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900 truncate">{it.name}</span>
                        <span className="font-black text-blue-600 whitespace-nowrap">₹{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-bold mt-1">₹{it.price} per item</div>
                      
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center bg-white rounded-full border border-gray-200 p-1 shadow-sm">
                          <button
                            onClick={() => changeQty(idx, -1)}
                            className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-black">{it.quantity}</span>
                          <button
                            onClick={() => changeQty(idx, 1)}
                            className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          value={it.note}
                          onChange={(e) => setItemNote(idx, e.target.value)}
                          placeholder="Add special instructions..."
                          className="flex-1 bg-transparent text-xs text-gray-500 border-none focus:ring-0 italic"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</h4>
                   <div className="h-px flex-1 bg-gray-100"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="relative group">
                   <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Kitchen instructions (optional)..."
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium min-h-[80px]"
                   />
                </div>
              </div>

              {/* Table Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Select Your Table</h4>
                   <div className="h-px flex-1 bg-gray-100"></div>
                </div>
                
                {loadingTables ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                     {[1,2,3,4].map(i => <div key={i} className="w-24 h-12 bg-gray-100 rounded-xl animate-pulse"></div>)}
                  </div>
                ) : tables.length === 0 && !selectedTable ? (
                  <div className="p-6 bg-red-50 text-red-600 rounded-3xl text-center font-bold">
                    No tables available at this time.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tables.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTable(t.id)}
                        className={`px-4 py-3 rounded-2xl font-bold transition-all border-2 flex items-center gap-2 ${
                          selectedTable === t.id
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105'
                          : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 ${selectedTable === t.id ? 'text-white' : 'text-blue-500'}`} />
                        <span>{t.name} ({t.id})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!existingOrderId && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-500 font-medium">Total Amount</div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">₹{total.toFixed(2)}</div>
            </div>

            <div className="flex flex-col gap-3">
               {error && (
                 <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold animate-in slide-in-from-top-2">
                   {error}
                 </div>
               )}
               <Button 
                 onClick={submitNewOrder}
                 disabled={submitting || !selectedTable}
                 size="lg"
                 className="w-full h-16 text-lg shadow-xl shadow-blue-600/30"
               >
                 {submitting ? (
                   <span className="flex items-center gap-2">
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Placing Order...
                   </span>
                 ) : (
                   <span className="flex items-center gap-2">
                     <Send className="w-5 h-5" />
                     Confirm & Place Order
                   </span>
                 )}
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
