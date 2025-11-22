// src/components/BellButton.tsx
import React, { useState } from 'react';
import api from '../lib/api';

type Props = {
  restaurantId: string | null | undefined;
  tableId: string | null | undefined;
  onSuccess?: (bellId: string) => void;
};

export default function BellButton({ restaurantId, tableId, onSuccess }: Props) {
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
      setMsg('Waiter has been notified');
      if (onSuccess && id) onSuccess(id);
    } catch (err: any) {
      console.error('bell error', err);
      setError(err?.response?.data?.message || 'Failed to ring bell');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed top-14 right-6 w-50 flex flex-col items-end space-y-1 z-50">
      <button
        onClick={ringBell}
        disabled={loading}
        className="px-3 py-2 bg-yellow-500 rounded-full text-sm shadow"
      >
        {loading ? (
          'Ringing...'
        ) : (
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            "Ring Bell"
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            ></path>
          </svg>
        )}
      </button>
      {msg && <div className="text-xs text-green-600 mt-1">{msg}</div>}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
