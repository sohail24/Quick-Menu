// src/pages/Order/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useStomp from '../../hooks/useStomp';
import { CheckCircle2, ChevronLeft, MapPin, ClipboardList, Clock, ArrowRight, Home, Receipt, HelpCircle, Wallet, CreditCard, Sparkles, ChefHat, UtensilsCrossed, PackageCheck, X } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OrderSuccess() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const stomp = useStomp();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${id}`);
        const orderData = res.data;
        
        // If it's an online payment and pending, but we have a session_id, verify it
        if (orderData.paymentMethod === 'ONLINE' && orderData.paymentStatus === 'PENDING' && sessionId) {
           try {
             const verifyRes = await api.post(`/api/${orderData.restaurantId}/orders/${id}/verify`, { sessionId });
             setOrder(verifyRes.data);
           } catch (err) {
             console.error('Auto-verification failed', err);
             setOrder(orderData);
           }
        } else {
          setOrder(orderData);
        }
        
        // Persist globally for OrderStatusFloating
        if (id) {
          localStorage.setItem('qm_last_order_id', id);
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
        }
      } catch (e) {}
    });

    return () => {
      try { sub?.unsubscribe(); } catch (e) {}
    };
  }, [id, stomp, order?.restaurantId]);

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
     return (
       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
             <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8" />
             </div>
             <h4 className="text-xl font-black text-gray-900 mb-2">Error Loading Order</h4>
             <p className="text-gray-500 mb-8 text-sm">{error}</p>
             <Button className="w-full" onClick={() => window.location.reload()}>Try Again</Button>
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
            <h1 className="text-4xl font-black mb-2 tracking-tight italic uppercase">Order Confirmed!</h1>
            <p className="text-blue-100 font-bold text-xs uppercase tracking-[0.2em] opacity-80">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
         </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-12 overflow-visible">
        <div className="space-y-6">
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

          {/* Clean Digital Receipt */}
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
             <div className="p-8 pb-0">
                <div className="flex justify-between items-end mb-8">
                   <div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Dine At</div>
                      <div className="text-2xl font-black text-gray-900 italic tracking-tight">Table #{order.tableId}</div>
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
                        <div className="flex gap-4">
                           <span className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center font-black text-gray-900 text-xs">
                             {it.quantity}x
                           </span>
                           <div>
                              <div className="font-bold text-gray-900 text-sm">{it.dishName ?? it.dishId}</div>
                              {it.note && <div className="text-[10px] text-blue-600 font-medium italic">"{it.note}"</div>}
                           </div>
                        </div>
                        <div className="font-black text-gray-900 text-sm">₹{((it.priceAtOrder || it.price) * it.quantity).toFixed(2)}</div>
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

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-4">
             <button 
               onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
               className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
             >
                <ArrowRight className="w-5 h-5" /> Order More Items
             </button>
             <button 
                onClick={() => navigate('/')}
                className="w-full h-16 bg-white border-2 border-gray-200 rounded-2xl font-black text-xs text-gray-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
             >
                <Home className="w-4 h-4" /> Go to Home
             </button>
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
