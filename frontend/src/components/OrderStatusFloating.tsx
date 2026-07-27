// src/components/OrderStatusFloating.tsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import useStomp from '../hooks/useStomp';
import { removeActiveOrder } from '../lib/orderStorage';
import { Clock, CheckCircle2, Navigation, ChefHat, PackageCheck, Utensils, X, ChevronRight, ExternalLink, ClipboardList } from 'lucide-react';

type OrderStatus = {
  id: string;
  restaurantId?: string;
  tableId?: string;
  status?: string; // PLACED / PREPARING / READY / SERVED / COMPLETED / CANCELLED
  placedAt?: string;
  estimatedPrepMins?: number | null;
  items?: Array<{ dishId: string; dishName?: string; quantity: number }>;
  positionInQueue?: number | null;
};

const STATUS_STEPS = [
  { id: 'PLACED', label: 'Ordered', icon: ClipboardList },
  { id: 'PREPARING', label: 'Cooking', icon: ChefHat },
  { id: 'READY', label: 'Ready', icon: PackageCheck },
  { id: 'SERVED', label: 'Served', icon: Utensils },
];

export default function OrderStatusFloating({ restaurantId }: { restaurantId?: string | null }) {
  const stomp = useStomp();
  const storedOrderId = typeof window !== 'undefined' ? localStorage.getItem('qm_last_order_id') : null;
  const [orderId, setOrderId] = useState<string | null>(storedOrderId);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const newId = localStorage.getItem('qm_last_order_id');
      if (newId !== orderId) setOrderId(newId);
    };

    window.addEventListener('storage', handleStorage);
    // Also poll slightly for local changes which don't trigger 'storage' in same tab
    const interval = setInterval(handleStorage, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    let pollTimer: any = null;
    let active = true;

    async function fetchStatus() {
      if (!orderId) return;
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        if (active) setOrder(res.data);
      } catch (err) {
        console.error('Order status fetch failed', err);
      }
    }

    fetchStatus();

    // Subscribe to restaurant-specific orders topic (Server pushes full enriched payload)
    const topic = `/topic/restaurants/${restaurantId || '*'}/orders`;
    const sub = stomp.subscribe(topic, (msg) => {
      try {
        const payload = JSON.parse(msg.body);
        // Only update if it's our orderId
        if (payload?.id === orderId && active) {
          console.debug('[STOMP] Order status updated:', payload.status);
          setOrder(payload);
          // If status is completed (SERVED) or cancelled (CANCELLED), clear tracking
          if (payload.status === 'SERVED' || payload.status === 'CANCELLED') {
             const trackingTableId = payload.orderType === 'TAKEAWAY' ? 'takeaway' : payload.tableId;
             if (payload.restaurantId && trackingTableId) {
                removeActiveOrder(payload.restaurantId, trackingTableId);
             }
             localStorage.removeItem('qm_last_order_id');
             setOrderId(null);
             setOrder(null);
          }
        }
      } catch (e) {}
    });

    // No more polling needed as we now get full updates via STOMP

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderId, stomp, restaurantId]);

  function clearTracking() {
    localStorage.removeItem('qm_last_order_id');
    setOrderId(null);
    setOrder(null);
  }

  if (!orderId || !order) return null;

  const currentStatus = order.status || 'PLACED';
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
  const displayStatus = STATUS_STEPS[currentIndex] || STATUS_STEPS[0];

  return (
    <div className={`fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 transition-all duration-500 transform ${isExpanded ? 'translate-y-0' : 'translate-y-0'}`}>
      <div className={`bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden transition-all duration-500 ${isExpanded ? 'w-full md:w-80' : 'w-full md:w-64'}`}>
        
        {/* Header / Summary Pill */}
        <div 
          className={`p-4 cursor-pointer flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                <displayStatus.icon className="w-5 h-5" />
             </div>
             <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Live Status</div>
                <div className="font-black text-sm tracking-tight">{displayStatus.label}</div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             {!isExpanded && (
               <div className="bg-white/10 px-2 py-1 rounded-lg text-[10px] font-black backdrop-blur-sm">
                  #{orderId.slice(-4).toUpperCase()}
               </div>
             )}
             <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 space-y-6">
            {/* Progress Stepper */}
            <div className="flex justify-between items-center relative px-2">
               <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
               <div 
                 className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-1000"
                 style={{ width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
               ></div>
               
               {STATUS_STEPS.map((step, idx) => {
                 const Icon = step.icon;
                 const isActive = idx <= currentIndex;
                 const isCurrent = idx === currentIndex;
                 
                 return (
                   <div key={idx} className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-blue-50' : ''}`}>
                         {isActive && idx < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                   </div>
                 );
               })}
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Order ID</span>
                  <span className="text-gray-900 font-black">#{orderId.toUpperCase()}</span>
               </div>
               {order.estimatedPrepMins ? (
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Est. Ready In</span>
                    <span className="text-blue-600 font-black">{order.estimatedPrepMins} mins</span>
                 </div>
               ) : null}
               {typeof order.positionInQueue === 'number' && (
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Queue Pos</span>
                    <span className="text-gray-900 font-black">#{order.positionInQueue}</span>
                 </div>
               )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
               <a 
                 href={`/order/success/${orderId}`}
                 className="flex-1 bg-gray-900 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
               >
                  <ExternalLink className="w-4 h-4" /> Full Receipt
               </a>
               <button 
                 onClick={clearTracking}
                 className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
               >
                  <X className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
