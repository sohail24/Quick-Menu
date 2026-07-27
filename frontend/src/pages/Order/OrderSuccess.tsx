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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8 text-blue-600">
           <Receipt className="w-16 h-16 animate-pulse" />
        </div>
        <h4 className="text-xl font-black text-gray-900 mb-2 uppercase italic tracking-tight">Printing Receipt...</h4>
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
       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-[32px] p-10 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                {isConflict ? <UtensilsCrossed className="w-10 h-10" /> : <X className="w-10 h-10" />}
             </div>
             <h4 className="text-2xl font-black text-gray-900 mb-4 italic uppercase tracking-tight">
                {isConflict ? 'Seating Conflict' : 'Oops! Error'}
             </h4>
             <p className="text-gray-500 mb-10 text-sm font-medium leading-relaxed leading-relaxed">{error}</p>
             {isConflict ? (
                <Button 
                  className="w-full h-16 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20" 
                  onClick={() => navigate('/')}
                >
                  <ArrowRight className="w-5 h-5 mr-1" /> Pick Another Table
                </Button>
             ) : (
                <Button 
                  className="w-full h-16 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20" 
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Simplified Header */}
      <div className="bg-blue-600 pt-16 pb-24 px-6 text-center text-white">
         <div className="max-w-xl mx-auto">
            <div className="inline-flex p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 scale-animation">
               <CheckCircle2 className="w-12 h-12" />
            </div>
             <h1 className="text-4xl font-black mb-2 tracking-tight italic uppercase">{order.paymentStatus === 'PAID' ? 'Order Paid! 🎉' : 'Order Confirmed!'}</h1>
            <p className="text-blue-100 font-bold text-xs uppercase tracking-[0.2em] opacity-80">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
         </div>
      </div>      <div className="max-w-5xl mx-auto px-6 -mt-12 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
           
           {/* Left/Main Column: Progress Card & Checkout Actions */}
           <div className="md:col-span-2 space-y-6">
              {/* Clean Progress Card */}
              <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
                 <div className="flex justify-between relative mb-8">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000"
                      style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    ></div>

                    {[
                      { icon: Receipt, label: 'Placed' },
                      { icon: ChefHat, label: 'Kitchen' },
                      { icon: PackageCheck, label: 'Ready' },
                      { icon: UtensilsCrossed, label: 'Served' }
                    ].map((s, idx) => {
                      const stepNum = idx + 1;
                      const isActive = stepNum <= currentStep;
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                             isActive 
                             ? 'bg-blue-600 border-white text-white shadow-lg' 
                             : 'bg-white border-gray-100 text-gray-300'
                           }`}>
                             <s.icon className="w-4 h-4" />
                           </div>
                           <div className={`absolute top-12 text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-300'}`}>
                             {s.label}
                           </div>
                        </div>
                      );
                    })}
                 </div>
                 
                 <div className="text-center pt-6 border-t border-gray-50 flex items-center justify-center gap-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    <span className="text-sm font-black text-gray-900 uppercase italic">
                       {order.status === 'PLACED' ? 'Waiting for confirmation' : order.status === 'PREPARING' ? 'Cooking in progress' : order.status === 'READY' ? 'Ready for pickup' : order.status}
                    </span>
                 </div>
              </div>

              {/* Action / Checkout Buttons */}
              {order.orderType === 'DINE_IN' && order.paymentStatus === 'PENDING' ? (
                 <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 space-y-6">
                    {counterPaymentConfirmed ? (
                       /* Counter Payment Requested guidance */
                       <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
                             <Wallet className="w-8 h-8" />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-gray-900 mb-2 italic uppercase tracking-tight">Counter Payment Requested</h4>
                             <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Please visit the counter to make your payment of <span className="text-blue-600 font-bold">₹{(order.totalAmount || 0).toFixed(2)}</span>.
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                             <button 
                               onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
                               className="w-full h-16 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-black uppercase italic tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                             >
                                <ArrowRight className="w-5 h-5" /> Order More Items
                             </button>
                             <button 
                                onClick={() => navigate('/')}
                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                             >
                                <Home className="w-4 h-4" /> Go to Home
                             </button>
                          </div>
                       </div>
                    ) : !showPaymentSelection ? (
                       <>
                          <div className="text-center">
                             <h4 className="text-xl font-black text-gray-900 mb-2 italic uppercase tracking-tight">Active Dine-In Session</h4>
                             <p className="text-gray-500 text-sm font-medium">
                                You can add more items to your order or complete your meal and check out.
                             </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                             <button 
                               onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
                               className="w-full h-16 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/5 transition-all flex items-center justify-center gap-3 active:scale-95 animate-in slide-in-from-bottom-2 duration-300"
                             >
                                <ArrowRight className="w-5 h-5" /> Order More Items
                             </button>
                             <button 
                               onClick={() => setShowPaymentSelection(true)}
                               className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 animate-in slide-in-from-bottom-3 duration-300"
                             >
                                <CreditCard className="w-5 h-5" /> Complete Order & Pay
                             </button>
                             <button 
                                onClick={() => navigate('/')}
                                className="w-full h-14 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                             >
                                <Home className="w-4 h-4" /> Go to Home
                             </button>
                          </div>
                       </>
                    ) : (
                       <div className="space-y-6 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                             <button 
                               onClick={() => setShowPaymentSelection(false)}
                               className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-gray-600"
                             >
                                <ChevronLeft className="w-4 h-4" /> Back
                             </button>
                             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Select Payment</h4>
                          </div>

                          {paymentError && (
                             <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                {paymentError}
                             </div>
                          )}

                          <div className="grid grid-cols-1 gap-4">
                             <button
                               onClick={() => setSelectedPaymentMethod('CASH')}
                               className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                 selectedPaymentMethod === 'CASH'
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                                 : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                               }`}
                             >
                               <div className={`p-3 rounded-xl ${selectedPaymentMethod === 'CASH' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                 <Wallet className="w-6 h-6" />
                               </div>
                               <div className="text-left flex-1">
                                 <div className="text-sm font-black uppercase tracking-tight">Pay at Counter</div>
                                 <div className={`text-[10px] ${selectedPaymentMethod === 'CASH' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Cash, UPI or Card at restaurant</div>
                               </div>
                               {selectedPaymentMethod === 'CASH' && <CheckCircle2 className="w-5 h-5 text-white" />}
                             </button>

                             <button
                               onClick={() => setSelectedPaymentMethod('ONLINE')}
                               className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                 selectedPaymentMethod === 'ONLINE'
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20'
                                 : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                               }`}
                             >
                               <div className={`p-3 rounded-xl ${selectedPaymentMethod === 'ONLINE' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                 <CreditCard className="w-6 h-6" />
                               </div>
                               <div className="text-left flex-1">
                                 <div className="text-sm font-black uppercase tracking-tight">Pay Online Now</div>
                                 <div className={`text-[10px] ${selectedPaymentMethod === 'ONLINE' ? 'text-blue-100' : 'text-gray-400'} font-bold`}>Fast, secure (via Stripe)</div>
                               </div>
                               {selectedPaymentMethod === 'ONLINE' && <CheckCircle2 className="w-5 h-5 text-white" />}
                             </button>
                          </div>

                          <button 
                            onClick={handleCompletePayment}
                            disabled={completingPayment}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 rounded-2xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
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
                 /* Standard Action Buttons */
                 <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => navigate(`/menu/${order.restaurantId}${order.orderType === 'TAKEAWAY' ? '' : `?tableId=${order.tableId}`}`)}
                      className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                       <ArrowRight className="w-5 h-5" /> {order.status === 'SERVED' || order.status === 'CANCELLED' || order.orderType === 'TAKEAWAY' || order.paymentStatus === 'PAID' ? 'Place New Order' : 'Order More Items'}
                    </button>
                    <button 
                       onClick={() => navigate('/')}
                       className="w-full h-16 bg-white border-2 border-gray-200 rounded-2xl font-black text-xs text-gray-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                       <Home className="w-4 h-4" /> Go to Home
                    </button>
                 </div>
              )}
           </div>

           {/* Right Column: Receipt */}
           <div className="md:col-span-1">
              {/* Clean Digital Receipt */}
              <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                 <div className="p-8 pb-0">
                    <div className="flex justify-between items-end mb-8">
                       <div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                              {order.orderType === 'TAKEAWAY' ? 'Order Mode' : 'Dine At'}
                           </div>
                           <div className="text-2xl font-black text-gray-900 italic tracking-tight">
                              {order.orderType === 'TAKEAWAY' 
                                 ? (order.vehicleNumber ? `Takeaway (${order.vehicleNumber})` : 'Takeaway (Counter)')
                                 : `Table #${order.tableId}${order.tableName ? ` (${order.tableName})` : ''}`
                              }
                           </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Time</div>
                          <div className="text-lg font-bold text-gray-900">
                             {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       {order.items?.map((it: any) => (
                         <div key={it.id} className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{it.dishName}</p>
                               {it.note && <p className="text-[10px] text-gray-400 italic font-bold">"{it.note}"</p>}
                               <p className="text-[10px] text-gray-400 font-black">QTY: {it.quantity} • ₹{it.priceAtOrder.toFixed(2)}</p>
                            </div>
                            <span className="text-sm font-black text-gray-900 italic">₹{(it.priceAtOrder * it.quantity).toFixed(2)}</span>
                         </div>
                       ))}
                    </div>

                    <div className="py-6 border-t-2 border-dashed border-gray-100 space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal</span>
                          <span className="font-bold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xl font-black pt-2">
                          <span className="text-gray-900 uppercase italic">Total</span>
                          <span className="text-blue-600 italic">₹{(order.totalAmount || 0).toFixed(2)}</span>
                       </div>
                    </div>
                 </div>

                 {/* Payment Footer */}
                 <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                          {order.paymentMethod === 'ONLINE' ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                       </div>
                       <div>
                          <div className="text-[10px] text-gray-400 font-black uppercase">Payment</div>
                          <div className="text-xs font-black text-gray-900">{order.paymentMethod === 'ONLINE' ? 'Online Paid' : 'Counter Payment'}</div>
                       </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                       {order.paymentStatus}
                    </div>
                 </div>
              </div>
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
