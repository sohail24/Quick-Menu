// src/components/OrderSummaryModal.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { getActiveOrderFor, setActiveOrder, removeActiveOrder } from '../lib/orderStorage';
import { X, User, Phone, ClipboardList, MapPin, Plus, Minus, Send, ExternalLink, Trash2, Clock, CheckCircle2, CreditCard, Wallet, ShoppingBasket, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
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
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(tableId ?? null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
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
    if (!restaurantId) {
      setExistingOrderId(null);
      setExistingOrderTableId(null);
      return;
    }
    const targetTableId = orderType === 'TAKEAWAY' ? null : selectedTable;
    if (!targetTableId) {
      setExistingOrderId(null);
      setExistingOrderTableId(null);
      return;
    }
    const ao = getActiveOrderFor(restaurantId, targetTableId);
    setExistingOrderId(ao?.orderId ?? null);
    setExistingOrderTableId(ao?.tableId ?? null);
  }, [restaurantId, selectedTable, orderType]);

  useEffect(() => {
    if (!isOpen || !restaurantId) return;
    setLoadingTables(true);
    api
      .get(`/api/restaurants/${restaurantId}/tables`)
      .then((res) => {
        const d = res.data ?? {};
        const arr: any[] = Array.isArray(d) ? d : Array.isArray(d.content) ? d.content : (d?.items ?? d?.tables ?? []);
        const available = arr.filter(t => !t.occupied || t.id === selectedTable);
        setTables(available);
        if (!selectedTable && available.length > 0) {
          setSelectedTable(available[0].id);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch tables', err);
        setTables([]);
      })
      .finally(() => setLoadingTables(false));
  }, [isOpen, restaurantId, selectedTable]);

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
    if (orderType === 'DINE_IN' && !selectedTable) return setError('Please select a table');
    if (!customerName) return setError('Please provide your name');
    if (!restaurantId) return setError('Missing restaurant');
    
    setSubmitting(true);
    setError(null);

    const payload = {
      tableId: orderType === 'TAKEAWAY' ? null : selectedTable,
      orderType,
      vehicleNumber: orderType === 'TAKEAWAY' ? vehicleNumber : null,
      customerName,
      customerPhone,
      customerNote,
      paymentMethod,
      items: localCart.map((c) => ({ dishId: c.dishId, quantity: c.quantity, note: c.note || '' })),
    };

    try {
      const res = await api.post(`/api/${restaurantId}/orders`, payload);
      const resp = res.data;
      
      const id = resp?.id ?? resp?.orderId ?? null;
      const orderToken = resp?.orderToken ?? null;
      if (id && orderToken) {
        try {
          const raw = localStorage.getItem('qm_order_tokens');
          const map = raw ? JSON.parse(raw) : {};
          map[id] = orderToken;
          localStorage.setItem('qm_order_tokens', JSON.stringify(map));
        } catch {}
      }

      if (id && paymentMethod === 'CASH') {
        const targetTable = orderType === 'TAKEAWAY' ? 'takeaway' : selectedTable;
        setActiveOrder(restaurantId, targetTable || 'takeaway', id, resp?.placedAt ?? new Date().toISOString(), resp?.tableName);
        localStorage.setItem('qm_last_order_id', id);
      }
      
      if (paymentMethod === 'ONLINE' && resp.stripeCheckoutUrl) {
         // Redirect to Stripe Hosted Checkout
         window.location.href = resp.stripeCheckoutUrl;
         return;
      }
      
      onClose();
      onOrderPlaced(resp);
    } catch (err: any) {
      console.error('Order submit failed', err);
      setError(err?.response?.data?.message || 'Failed to place order');
      setSubmitting(false);
    }
  }

  async function submitAppendOrder() {
    if (!existingOrderId) return;
    if (!restaurantId) return setError('Missing restaurant');
    
    setSubmitting(true);
    setError(null);

    const items = localCart.map((c) => ({ dishId: c.dishId, quantity: c.quantity, note: c.note || '' }));

    try {
      const res = await api.post(`/api/${restaurantId}/orders/${existingOrderId}/items`, items);
      const resp = res.data;
      
      const id = resp?.id ?? resp?.orderId ?? null;
      const orderToken = resp?.orderToken ?? null;
      if (id && orderToken) {
        try {
          const raw = localStorage.getItem('qm_order_tokens');
          const map = raw ? JSON.parse(raw) : {};
          map[id] = orderToken;
          localStorage.setItem('qm_order_tokens', JSON.stringify(map));
        } catch {}
      }
      
      onClose();
      onOrderPlaced(resp);
    } catch (err: any) {
      console.error('Order append failed', err);
      setError(err?.response?.data?.message || 'Failed to add items to active order');
      setSubmitting(false);
    }
  }

  function stopTracking() {
    if (!restaurantId || !selectedTable) return;
    removeActiveOrder(restaurantId, selectedTable);
    setExistingOrderId(null);
    setExistingOrderTableId(null);
    setSelectedTable(null);
    setTables([]);
    setCustomerName('');
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
                {step === 1 ? <ShoppingBasket className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                   {existingOrderId ? 'Order Progress' : step === 1 ? 'Order Details' : 'Payment Method'}
                </h3>
                {orderType === 'TAKEAWAY' && (
                  <div className="flex items-center gap-1.5 mt-1">
                     {[1, 2].map((s) => (
                       <div 
                         key={s} 
                         className={`h-1.5 rounded-full transition-all duration-300 ${
                           s === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'
                         }`}
                       />
                     ))}
                  </div>
                )}
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
          {existingOrderId && localCart.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-yellow-50 rounded-3xl text-yellow-600 mb-6">
                 <Clock className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-2">Active Order Found!</h4>
              <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                You already have an active order.
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
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {step === 1 && (
                <>
                  {existingOrderId && (
                    <div className="p-5 bg-blue-50/50 border-2 border-blue-100/50 rounded-3xl text-blue-800 text-sm font-medium flex flex-col gap-1.5 animate-in slide-in-from-top-4 duration-300">
                      <div className="font-black text-xs uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                         <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                         Active Order Detected
                      </div>
                      <div>
                        You are adding items to your active order. Extra amount will be settled at the counter.
                      </div>
                      <div className="text-xs font-black text-blue-500 mt-1 uppercase">
                        {existingOrderTableId === 'takeaway' ? 'Order Type: Takeaway' : `Table: #${existingOrderTableId}`}
                      </div>
                    </div>
                  )}
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
                              <button onClick={() => changeQty(idx, -1)} className="p-1 hover:bg-gray-50 rounded-full transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-black">{it.quantity}</span>
                              <button onClick={() => changeQty(idx, 1)} className="p-1 hover:bg-gray-50 rounded-full transition-colors">
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

                  {!existingOrderId && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Order Type</h4>
                         <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderType('DINE_IN')}
                          className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 text-center text-sm ${
                            orderType === 'DINE_IN'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                          }`}
                        >
                          Dine-In 🍽️
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('TAKEAWAY')}
                          className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 text-center text-sm ${
                            orderType === 'TAKEAWAY'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                          }`}
                        >
                          Takeaway 🛍️
                        </button>
                      </div>
                    </div>
                  )}

                  {!existingOrderId && orderType === 'DINE_IN' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Select Your Table</h4>
                         <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      {loadingTables ? (
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                           {[1,2,3,4].map(i => <div key={i} className="w-24 h-12 bg-gray-100 rounded-xl animate-pulse"></div>)}
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
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!existingOrderId && orderType === 'TAKEAWAY' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Delivery / Takeaway details</h4>
                         <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      <div className="relative group">
                        <input
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="Mention Car/Bike number OR type 'Counter Pickup'"
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {!existingOrderId && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                         <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</h4>
                         <div className="h-px flex-1 bg-gray-100"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
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
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                            <Phone className="w-5 h-5" />
                          </div>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                            placeholder="Phone Number"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                      <textarea
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder="Kitchen instructions (optional)..."
                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-medium min-h-[80px]"
                      />
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                     <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Select Payment Mode</h4>
                     <div className="h-px flex-1 bg-gray-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 ${
                        paymentMethod === 'CASH'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]'
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl ${paymentMethod === 'CASH' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-xl font-black mb-1">Pay at Counter</div>
                        <div className={`text-sm ${paymentMethod === 'CASH' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Cash, UPI or Card at restaurant</div>
                      </div>
                      {paymentMethod === 'CASH' && <CheckCircle2 className="w-6 h-6 text-white" />}
                    </button>

                    <button
                      onClick={() => setPaymentMethod('ONLINE')}
                      className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 ${
                        paymentMethod === 'ONLINE'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]'
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl ${paymentMethod === 'ONLINE' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-xl font-black mb-1">Pay Online Now</div>
                        <div className={`text-sm ${paymentMethod === 'ONLINE' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Fast, secure (via Stripe)</div>
                      </div>
                      {paymentMethod === 'ONLINE' && <CheckCircle2 className="w-6 h-6 text-white" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {existingOrderId && localCart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Additional Amount</div>
                <div className="text-4xl font-black text-gray-900 tracking-tight">₹{total.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  Appending Items
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               {error && (
                 <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2 flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0"></div>
                   {error}
                 </div>
               )}
               
               <Button 
                 onClick={submitAppendOrder}
                 disabled={submitting}
                 size="lg"
                 className="w-full h-16 text-xl shadow-xl shadow-blue-600/30 rounded-2xl font-black italic tracking-tight"
               >
                 {submitting ? (
                   <span className="flex items-center gap-3">
                     <Loader2 className="w-6 h-6 animate-spin" />
                     ADDING TO ORDER...
                   </span>
                 ) : (
                   <span className="flex items-center gap-2">
                     <Send className="w-6 h-6 mr-1" />
                     ADD TO ACTIVE ORDER
                   </span>
                 )}
               </Button>
            </div>
          </div>
        )}

        {!existingOrderId && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Total Amount</div>
                <div className="text-4xl font-black text-gray-900 tracking-tight">₹{total.toFixed(2)}</div>
              </div>
              <div className="text-right">
                {orderType === 'TAKEAWAY' ? (
                  <>
                    <div className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Step {step} of 2</div>
                    <div className="text-blue-600 font-black text-sm">{step === 1 ? 'Details' : 'Payment'}</div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Dine-In</div>
                    <div className="text-blue-600 font-black text-sm">Place Order</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
               {error && (
                 <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2 flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0"></div>
                   {error}
                 </div>
               )}
               
               <div className="flex gap-3">
                  {step > 1 && (
                    <Button 
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-16 px-8 rounded-2xl border-2 border-gray-200"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                  )}
                  <Button 
                    onClick={orderType === 'DINE_IN' ? submitNewOrder : (step < 2 ? () => setStep(2) : submitNewOrder)}
                    disabled={submitting || (step === 1 && ((orderType === 'DINE_IN' && !selectedTable) || !customerName))}
                    size="lg"
                    className="flex-1 h-16 text-xl shadow-xl shadow-blue-600/30 rounded-2xl font-black italic tracking-tight"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        PLACING ORDER...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {orderType === 'DINE_IN' ? <Send className="w-6 h-6 mr-1" /> : (step === 2 ? <Send className="w-6 h-6 mr-1" /> : <ChevronRight className="w-6 h-6 mr-1" />)}
                        {orderType === 'DINE_IN' ? 'CONFIRM ORDER' : (step === 2 ? (paymentMethod === 'ONLINE' ? 'PROCEED TO PAY' : 'CONFIRM ORDER') : 'PROCEED TO PAYMENT')}
                      </span>
                    )}
                  </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
