// src/components/BellButton.tsx
import React, { useState } from 'react';
import api from '../lib/api';
import { Bell } from 'lucide-react';

type Props = {
  restaurantId: string | null | undefined;
  tableId: string | null | undefined;
  onSuccess?: (bellId: string) => void;
  className?: string;
};

export default function BellButton({ restaurantId, tableId, onSuccess, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ringBell() {
    setError(null);
    setMsg(null);
    if (!restaurantId || !tableId) {
      setError('Invalid table or restaurant');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/api/restaurants/${restaurantId}/tables/${tableId}/bell`, {
        message: 'Customer needs assistance',
      });
      const id = res.data?.id ?? res.data?.bellId ?? null;
      setMsg('Waiter notified');
      if (onSuccess && id) onSuccess(id);
    } catch (err: any) {
      console.error('bell error', err);
      setError(err?.response?.data?.message || 'Failed to ring bell');
    } finally {
      setLoading(false);
    }
  }

  const defaultClasses = "fixed top-14 right-6 z-50 transition-all duration-300 transform active:scale-95";

  return (
    <div className={className || defaultClasses}>
      <button
        onClick={ringBell}
        disabled={loading}
        className={`flex items-center justify-center p-3 rounded-full shadow-lg transition-colors ${
          loading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
        }`}
      >
        <Bell className={`w-6 h-6 ${loading ? 'animate-bounce' : ''}`} />
      </button>
      {(msg || error) && (
        <div className="absolute right-0 mt-2 whitespace-nowrap">
          {msg && <div className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded shadow-sm">{msg}</div>}
          {error && <div className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded shadow-sm">{error}</div>}
        </div>
      )}
    </div>
  );
}
