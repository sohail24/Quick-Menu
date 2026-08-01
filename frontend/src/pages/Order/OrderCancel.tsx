// src/pages/Order/OrderCancel.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { removeActiveOrder } from '../../lib/orderStorage';
import { XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OrderCancel() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const tableId = searchParams.get('tableId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !restaurantId) {
      setLoading(false);
      return;
    }

    const performCleanup = async () => {
      try {
        // Call backend to delete the unpaid order and free the table
        await api.delete(`/api/${restaurantId}/orders/${id}/cancel`);
        
        // Also remove from local tracking
        if (tableId) {
           removeActiveOrder(restaurantId, tableId);
        }
      } catch (err) {
        console.error('Cleanup failed', err);
      } finally {
        setLoading(false);
      }
    };

    performCleanup();
  }, [id, restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold animate-pulse">CLEANING UP ORDER...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
        <div className="inline-flex p-5 bg-red-50 rounded-[24px] text-red-600 mb-8 border border-red-100 shadow-lg shadow-red-600/10">
          <XCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-4 italic tracking-tight uppercase">Payment Cancelled</h1>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
          Your order has been cancelled and table session was cleared. No charges were made.
        </p>

        <Button 
          onClick={() => navigate(`/menu/${restaurantId}`)}
          size="lg"
          className="w-full h-16 text-xl shadow-xl shadow-blue-600/30 rounded-2xl font-black italic tracking-tight"
        >
          <ArrowLeft className="w-6 h-6 mr-2" /> RETURN TO MENU
        </Button>
      </div>
      
      <p className="mt-8 text-gray-400 text-xs font-black uppercase tracking-[0.2em]">QuickMenu Checkout</p>
    </div>
  );
}
