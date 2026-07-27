// src/pages/Order/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useStomp from '../../hooks/useStomp';
import { CheckCircle2, ChevronLeft, MapPin, ClipboardList, Clock, ArrowRight, Home, Receipt, HelpCircle, Wallet, CreditCard, Sparkles, ChefHat, UtensilsCrossed, PackageCheck, X, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { setActiveOrder, removeActiveOrder } from '../../lib/orderStorage';

export default function OrderSuccess() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const stomp = useStomp();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [completingPayment, setCompletingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [counterPaymentConfirmed, setCounterPaymentConfirmed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`qm_counter_payment_requested_${id}`) === 'true';
    }
    return false;
  });

  const verifyingRef = React.useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${id}`);
        const orderData = res.data;
        
        const urlTableId = searchParams.get('tableId');
        if (orderData.orderType === 'DINE_IN' && orderData.tableId && orderData.tableId !== urlTableId) {
          setError('Table mismatch or session hijacked. Please scan the QR code at your table.');
          setLoading(false);
          return;
        }
        
        // Also save order token if it is returned
        if (id && orderData.orderToken) {
          try {
            const raw = localStorage.getItem('qm_order_tokens');
            const map = raw ? JSON.parse(raw) : {};
            map[id] = orderData.orderToken;
            localStorage.setItem('qm_order_tokens', JSON.stringify(map));
          } catch {}
        }
        
        // If it's an online payment and pending, but we have a session_id, verify it
        if (orderData.paymentMethod === 'ONLINE' && orderData.paymentStatus === 'PENDING' && sessionId) {
           if (verifyingRef.current) return;
           verifyingRef.current = true;
           try {
             const verifyRes = await api.post(`/api/${orderData.restaurantId}/orders/${id}/verify`, { sessionId });
             const verifiedOrder = verifyRes.data;
             setOrder(verifiedOrder);
             
             // Also save order token if returned from verify
             if (id && verifiedOrder.orderToken) {
               try {
                 const raw = localStorage.getItem('qm_order_tokens');
                 const map = raw ? JSON.parse(raw) : {};
                 map[id] = verifiedOrder.orderToken;
                 localStorage.setItem('qm_order_tokens', JSON.stringify(map));
               } catch {}
             }

             // Clean up tracking since the order is paid
             if (id && verifiedOrder.paymentStatus === 'PAID') {
               const trackingTableId = verifiedOrder.orderType === 'TAKEAWAY' ? 'takeaway' : verifiedOrder.tableId;
               removeActiveOrder(verifiedOrder.restaurantId, trackingTableId || 'takeaway');
               localStorage.removeItem('qm_last_order_id');
               localStorage.removeItem(`qm_counter_payment_requested_${id}`);
             }
           } catch (err: any) {
             console.error('Auto-verification failed', err);
             if (err.response?.status === 409) {
               setError(err.response.data.message || 'Table was taken while you were paying.');
               setOrder(null);
               return;
             }
             setOrder(orderData);
           }
        } else {
          setOrder(orderData);
          // Persist globally for OrderStatusFloating (CASH/PENDING) or clean up if PAID/SERVED/CANCELLED
          if (id) {
            const trackingTableId = orderData.orderType === 'TAKEAWAY' ? 'takeaway' : orderData.tableId;
            if (orderData.paymentStatus === 'PAID' || orderData.status === 'SERVED' || orderData.status === 'CANCELLED') {
              removeActiveOrder(orderData.restaurantId, trackingTableId || 'takeaway');
              localStorage.removeItem('qm_last_order_id');
              localStorage.removeItem(`qm_counter_payment_requested_${id}`);
            } else if (orderData.paymentMethod === 'CASH') {
              setActiveOrder(orderData.restaurantId, trackingTableId || 'takeaway', id, orderData.placedAt || new Date().toISOString());
              localStorage.setItem('qm_last_order_id', id);
            }
          }
        }
      } catch (err) {
        console.error('Failed fetching order', err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!id || !order?.restaurantId) return;

    const topic = `/topic/restaurants/${order.restaurantId}/orders`;
    const sub = stomp.subscribe(topic, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        if (payload?.id === id) {
          console.debug('[STOMP] Order status updated:', payload.status);
          setOrder(payload);
          // Clean up if completed (SERVED), cancelled (CANCELLED), or paid (PAID)
          if (payload.paymentStatus === 'PAID' || payload.status === 'SERVED' || payload.status === 'CANCELLED') {
            const trackingTableId = payload.orderType === 'TAKEAWAY' ? 'takeaway' : payload.tableId;
            removeActiveOrder(payload.restaurantId, trackingTableId || 'takeaway');
            localStorage.removeItem('qm_last_order_id');
            localStorage.removeItem(`qm_counter_payment_requested_${id}`);
          }
        }
      } catch (e) {}
    });

    return () => {
      try { sub?.unsubscribe(); } catch (e) {}
    };
  }, [id, stomp, order?.restaurantId, order?.tableId, order?.orderType]);

  const handleCompletePayment = async () => {
    if (!id || !order?.restaurantId) return;
    if (order.paymentStatus === 'PAID') {
      setPaymentError('Order is already paid.');
      return;
    }
    setCompletingPayment(true);
    setPaymentError(null);
    try {
      const res = await api.post(`/api/${order.restaurantId}/orders/${id}/complete`, {
        paymentMethod: selectedPaymentMethod,
      });
      const updatedOrder = res.data;
      if (selectedPaymentMethod === 'ONLINE' && updatedOrder.stripeCheckoutUrl) {
        window.location.href = updatedOrder.stripeCheckoutUrl;
        return;
      }
      if (selectedPaymentMethod === 'CASH') {
        localStorage.setItem(`qm_counter_payment_requested_${id}`, 'true');
        setCounterPaymentConfirmed(true);
      }
      setOrder(updatedOrder);
      setShowPaymentSelection(false);
    } catch (err: any) {
      console.error('Failed to complete payment selection', err);
      setPaymentError(err.response?.data?.message || 'Failed to complete payment selection');
    } finally {
      setCompletingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8 text-blue-600">
           <Receipt className="w-16 h-16 animate-pulse" />
        </div>
        <h4 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">Printing Receipt...</h4>
      </div>
    );
  }

  const getStatusStep = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PLACED' || s === 'PENDING') return 1;
    if (s === 'PREPARING' || s === 'IN_PROGRESS') return 2;
    if (s === 'READY') return 3;
    if (s === 'SERVED') return 4;
    return 1;
  };

  const currentStep = order ? getStatusStep(order.status) : 1;

  if (error) {
     const isConflict = error.toLowerCase().includes('table') || error.toLowerCase().includes('taken');
     return (
       <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
          <div className="bg-white rounded-[32px] p-10 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-500 border border-slate-100">
             <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                {isConflict ? <UtensilsCrossed className="w-10 h-10" /> : <X className="w-10 h-10" />}
             </div>
             <h4 className="text-2xl font-black text-slate-900 mb-4 italic uppercase tracking-tight">
                {isConflict ? 'Seating Conflict' : 'Oops! Error'}
             </h4>
             <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">{error}</p>
             {isConflict ? (
                <Button 
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20 border-0" 
                  onClick={() => navigate('/')}
                >
                  <ArrowRight className="w-5 h-5 mr-1" /> Pick Another Table
                </Button>
             ) : (
                <Button 
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20 border-0" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
             )}
          </div>
       </div>
     );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 font-sans">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 py-16 px-6 text-center text-white border-b border-indigo-800">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-red-500 to-indigo-900 pointer-events-none"></div>
         <div className="relative max-w-6xl mx-auto flex flex-col items-center">
            <div className="inline-flex p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-5 scale-animation shadow-lg border border-white/10">
               <CheckCircle2 className="w-12 h-12 text-green-300" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight uppercase italic">{order.paymentStatus === 'PAID' ? 'Order Paid! 🎉' : 'Order Confirmed!'}</h1>
            <p className="text-blue-100 font-bold text-xs uppercase tracking-[0.2em] opacity-80">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           <div className="lg:col-span-7 space-y-8">
              
              <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Order Status</h3>
                 <div className="flex justify-between relative mb-8 px-2">
                    <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -translate-y-1/2"></div>
                    <div 
                      className="absolute top-5 left-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 -translate-y-1/2 transition-all duration-1000"
                      style={{ width: `${Math.max(0, Math.min(100, ((currentStep - 1) / 3) * 100))}%` }}
                    ></div>

                    {[
                      { icon: Receipt, label: 'Placed' },
                      { icon: ChefHat, label: 'Kitchen' },
                      { icon: PackageCheck, label: 'Ready' },
                      { icon: UtensilsCrossed, label: 'Served' }
                    ].map((s, idx) => {
                      const stepNum = idx + 1;
                      const isActive = stepNum <= currentStep;
                      const isCurrent = stepNum === currentStep;
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                             isCurrent
                             ? 'bg-indigo-600 border-white text-white shadow-lg ring-4 ring-indigo-100 scale-110'
                             : isActive 
                             ? 'bg-blue-600 border-white text-white shadow-md' 
                             : 'bg-white border-slate-100 text-slate-300'
                           }`}>
                             <s.icon className="w-4 h-4" />
                           </div>
                           <div className={`absolute top-12 text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                             {s.label}
                           </div>
                        </div>
                      );
                    })}
                 </div>
                 
                 <div className="text-center pt-6 border-t border-slate-50 flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                    <span className="text-sm font-black text-slate-900 uppercase italic tracking-wide">
                       {order.status === 'PLACED' ? 'Waiting for confirmation' : order.status === 'PREPARING' ? 'Cooking in progress' : order.status === 'READY' ? 'Ready for pickup' : order.status}
                    </span>
                 </div>
              </div>

              {/* Premium Digital Receipt Card */}
              <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                 {/* Receipt Decorative Top Bar */}
                 <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
                 
                 <div className="p-8">
                    <div className="flex justify-between items-start pb-6 border-b border-slate-100 mb-6">
                       <div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                              {order.orderType === 'TAKEAWAY' ? 'Order Mode' : 'Dine At'}
                           </div>
                           <div className="text-2xl font-black text-slate-900 italic tracking-tight">
                              {order.orderType === 'TAKEAWAY' 
                                 ? (order.vehicleNumber ? `Takeaway (${order.vehicleNumber})` : 'Takeaway (Counter)')
                                 : `Table #${order.tableId}${order.tableName ? ` (${order.tableName})` : ''}`
                              }
                           </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Time</div>
                          <div className="text-lg font-bold text-slate-800">
                             {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                    </div>

                    {/* Receipt Items List */}
                    <div className="space-y-4 mb-8">
                       {order.items?.map((it: any) => (
                         <div key={it.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-b-0">
                            <div className="flex-1 min-w-0 flex gap-4">
                               <span className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center font-black text-slate-800 text-xs border border-slate-100">
                                 {it.quantity}x
                               </span>
                               <div>
                                  <div className="font-bold text-slate-800 text-sm tracking-tight">{it.dishName ?? it.dishId}</div>
                                  {it.note && <div className="text-[10px] text-blue-600 font-medium italic mt-0.5">"{it.note}"</div>}
                               </div>
                            </div>
                            <div className="font-black text-slate-900 text-sm">₹{((it.priceAtOrder || it.price) * it.quantity).toFixed(2)}</div>
                         </div>
                       ))}
                    </div>

                    {/* Receipt Totals Summary */}
                    <div className="py-6 border-t-2 border-dashed border-slate-100 space-y-3">
                       <div className="flex justify-between text-sm font-medium text-slate-500">
                          <span className="uppercase tracking-widest">Subtotal</span>
                          <span>₹{(order.totalAmount || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-2xl font-black pt-2 border-t border-slate-50">
                          <span className="text-slate-900 uppercase italic tracking-tight">Total</span>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">₹{(order.totalAmount || 0).toFixed(2)}</span>
                       </div>
                    </div>
                 </div>

                 {/* Premium Footer Info */}
                 <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                          {order.paymentMethod === 'ONLINE' ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                       </div>
                       <div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Payment</div>
                          <div className="text-xs font-black text-slate-800">{order.paymentMethod === 'ONLINE' ? 'Online Paid' : 'Counter Payment'}</div>
                       </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      order.paymentStatus === 'PAID' 
                      ? 'bg-green-50 text-green-600 border-green-200' 
                      : 'bg-yellow-50 text-yellow-600 border-yellow-200 animate-pulse'
                    }`}>
                       {order.paymentStatus}
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Section (Lg: col-span-5) - Checkout & Active Session */}
           <div className="lg:col-span-5 space-y-8">
              
              {/* Interactive Dine-In Actions Panel */}
              {order.orderType === 'DINE_IN' && order.paymentStatus === 'PENDING' ? (
                 <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 space-y-6">
                    {counterPaymentConfirmed ? (
                       /* Counter Payment Requested Mode */
                       <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
                             <Wallet className="w-8 h-8" />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-900 mb-2 italic uppercase tracking-tight">Counter Payment Requested</h4>
                             <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Please visit the counter to make your payment of <span className="text-blue-600 font-bold">₹{(order.totalAmount || 0).toFixed(2)}</span>.
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 pt-2">
                             <button 
                               onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
                               className="w-full h-16 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black uppercase italic tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
                             >
                                <ArrowRight className="w-5 h-5 text-blue-500" /> Order More Items
                             </button>
                             <button 
                                onClick={() => navigate('/')}
                                className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                             >
                                <Home className="w-4 h-4" /> Go to Home
                             </button>
                          </div>
                       </div>
                    ) : !showPaymentSelection ? (
                       /* Prompt to Pay / Order More */
                       <>
                          <div className="text-center">
                             <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Sparkles className="w-8 h-8" />
                             </div>
                             <h4 className="text-xl font-black text-slate-900 mb-2 italic uppercase tracking-tight">Active Session</h4>
                             <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                You can add more items to your bill or complete your meal and check out.
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 pt-2">
                             <button 
                               onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
                               className="w-full h-16 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black uppercase italic tracking-widest hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-md shadow-indigo-600/5"
                             >
                                <ArrowRight className="w-5 h-5" /> Order More Items
                             </button>
                             <button 
                               onClick={() => setShowPaymentSelection(true)}
                               className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                             >
                                <CreditCard className="w-5 h-5" /> Complete Order & Pay
                             </button>
                             <button 
                                onClick={() => navigate('/')}
                                className="w-full h-14 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-100/80 transition-colors border border-slate-100"
                             >
                                <Home className="w-4 h-4" /> Go to Home
                             </button>
                          </div>
                       </>
                    ) : (
                       /* Payment Selection Mode */
                       <div className="space-y-6 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                             <button 
                               onClick={() => setShowPaymentSelection(false)}
                               className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-600 transition-colors"
                             >
                                <ChevronLeft className="w-4 h-4" /> Back
                             </button>
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Payment</h4>
                          </div>

                          {paymentError && (
                             <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-red-100">
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                {paymentError}
                             </div>
                          )}

                          <div className="grid grid-cols-1 gap-4">
                             <button
                               onClick={() => setSelectedPaymentMethod('CASH')}
                               className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                                 selectedPaymentMethod === 'CASH'
                                 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                 : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:shadow-sm'
                               }`}
                             >
                               <div className={`p-3 rounded-xl ${selectedPaymentMethod === 'CASH' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                 <Wallet className="w-6 h-6" />
                               </div>
                               <div className="flex-1">
                                 <div className="text-sm font-black uppercase tracking-tight">Pay at Counter</div>
                                 <div className={`text-[10px] ${selectedPaymentMethod === 'CASH' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Cash, UPI or Card at cashier</div>
                               </div>
                               {selectedPaymentMethod === 'CASH' && <CheckCircle2 className="w-5 h-5 text-white" />}
                             </button>

                             <button
                               onClick={() => setSelectedPaymentMethod('ONLINE')}
                               className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                                 selectedPaymentMethod === 'ONLINE'
                                 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                 : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:shadow-sm'
                               }`}
                             >
                               <div className={`p-3 rounded-xl ${selectedPaymentMethod === 'ONLINE' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                 <CreditCard className="w-6 h-6" />
                               </div>
                               <div className="flex-1">
                                 <div className="text-sm font-black uppercase tracking-tight">Pay Online Now</div>
                                 <div className={`text-[10px] ${selectedPaymentMethod === 'ONLINE' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Instant online checkout (Stripe)</div>
                               </div>
                               {selectedPaymentMethod === 'ONLINE' && <CheckCircle2 className="w-5 h-5 text-white" />}
                             </button>
                          </div>

                          <button 
                            onClick={handleCompletePayment}
                            disabled={completingPayment}
                            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-blue-300 disabled:to-indigo-300 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                          >
                             {completingPayment ? (
                                <span className="flex items-center gap-2">
                                   <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                </span>
                             ) : (
                                <span>
                                   {selectedPaymentMethod === 'ONLINE' ? 'PROCEED TO PAY' : 'CONFIRM COUNTER PAYMENT'}
                                </span>
                             )}
                          </button>
                       </div>
                    )}
                 </div>
              ) : (
                 /* Standard Action Buttons (Paid / Takeaway orders) */
                 <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 space-y-6 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                       <CheckCircle2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-slate-800 mb-2 italic uppercase tracking-tight">Payment Completed</h4>
                       <p className="text-slate-500 text-sm font-medium leading-relaxed">
                          Your payment of <span className="text-slate-950 font-black">₹{(order.totalAmount || 0).toFixed(2)}</span> was processed successfully. Thank you for dining with us!
                       </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                       <button 
                         onClick={() => navigate(`/menu/${order.restaurantId}${order.orderType === 'TAKEAWAY' ? '' : `?tableId=${order.tableId}`}`)}
                         className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                       >
                          <ArrowRight className="w-5 h-5" /> Place New Order
                       </button>
                       <button 
                          onClick={() => navigate('/')}
                          className="w-full h-16 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                       >
                          <Home className="w-4 h-4 text-blue-600" /> Go to Home
                       </button>
                    </div>
                 </div>
              )}
           </div>
           
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-in {
           0% { transform: scale(0.5); opacity: 0; }
           100% { transform: scale(1); opacity: 1; }
        }
        .scale-animation {
           animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  );
}
