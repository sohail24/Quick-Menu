// src/pages/Order/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { CheckCircle2, ChevronLeft, MapPin, ClipboardList, Clock, ArrowRight, Home, Receipt, HelpCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OrderSuccess() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        console.error('Failed fetching order', err);
        setError('Failed to fetch order details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium italic">Fetching order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Banner / Celebration */}
      <div className="bg-blue-600 pt-16 pb-32 px-6 text-center">
        <div className="inline-flex p-4 bg-white/10 backdrop-blur-md rounded-[32px] text-white animate-bounce-subtle mb-6">
           <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Order Placed!</h1>
        <p className="text-blue-100 font-medium opacity-90">Thank you for dining with us. Your meal is being prepared.</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-20">
        {error ? (
          <div className="bg-white rounded-[32px] p-8 shadow-xl text-center border border-red-100">
             <div className="text-red-500 mb-4 font-bold">Oops! Something went wrong.</div>
             <p className="text-gray-500 mb-6">{error}</p>
             <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Quick Status Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Receipt className="w-32 h-32" />
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                     <div className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Order ID</div>
                     <div className="text-xl font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</div>
                  </div>
                  <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                     <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1 text-center">Status</div>
                     <div className="text-blue-600 font-black flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {order.status}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                     <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Table</span>
                     </div>
                     <div className="font-black text-gray-900">Table #{order.tableId}</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                     <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Placed At</span>
                     </div>
                     <div className="font-black text-gray-900">{new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
               </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="bg-gray-900 p-2 rounded-xl text-white">
                     <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Order Details</h3>
               </div>

               <div className="space-y-4 mb-8">
                  {order.items?.map((it: any) => (
                    <div key={it.id} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <span className="bg-gray-100 text-gray-900 text-xs font-black px-2 py-0.5 rounded-md">x{it.quantity}</span>
                             <span className="font-bold text-gray-900">{it.dishName ?? it.dishId}</span>
                          </div>
                          {it.note && <p className="text-xs text-gray-400 font-medium italic mt-1 pl-1">"{it.note}"</p>}
                       </div>
                       <div className="font-black text-gray-900">
                          ₹{((it.priceAtOrder ?? it.price) * it.quantity).toFixed(2)}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between text-2xl font-black">
                     <span className="text-gray-400">Total</span>
                     <span className="text-gray-900">₹{order.items?.reduce((s: number, it: any) => s + (it.priceAtOrder ?? it.price) * it.quantity, 0).toFixed(2)}</span>
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
               <Button 
                 size="lg" 
                 variant="primary" 
                 onClick={() => navigate(`/menu/${order.restaurantId}?tableId=${order.tableId}`)}
                 className="h-16 shadow-lg shadow-blue-600/20"
               >
                  <Home className="w-5 h-5 mr-2" /> Back to Menu
               </Button>
               <Button 
                  size="lg" 
                  variant="outline"
                  className="h-16 border-2 border-gray-200"
               >
                  <HelpCircle className="w-5 h-5 mr-2" /> Need Help?
               </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-12 shadow-xl text-center border border-gray-100">
             <p className="text-gray-500 font-medium italic">Pulling up your receipt...</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
           0%, 100% { transform: translateY(0); }
           50% { transform: translateY(-10px); }
        }
        .animate-bounce-subtle {
           animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
