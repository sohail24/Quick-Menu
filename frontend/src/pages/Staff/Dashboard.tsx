// src/pages/Staff/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { createStompClient } from '../../hooks/useStomp';
import { useAuthStore } from '../../app/store';

type EventItem = {
  id?: string;
  type?: string;
  tableId?: string;
  message?: string;
  ts?: string;
  raw?: any;
};

export default function StaffDashboard() {
  const token = useAuthStore((s) => s.token);
  const [client, setClient] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const restaurantId = 'demo'; // change to environment or select in UI

  useEffect(() => {
    const c = createStompClient(token || undefined);
    c.onConnect = () => {
      console.log('STOMP connected');
      c.subscribe(`/topic/restaurants/${restaurantId}/bells`, (msg: any) => {
        const payload = JSON.parse(msg.body);
        setEvents((prev) => [
          {
            id: payload.id,
            type: payload.type,
            tableId: payload.tableId,
            message: payload.message,
            ts: payload.createdAt,
            raw: payload,
          },
          ...prev,
        ]);
        // small audible alert
        try {
          new Audio('/click.mp3').play().catch(() => {});
        } catch {}
      });
      c.subscribe(`/topic/restaurants/${restaurantId}/orders`, (msg: any) => {
        const payload = JSON.parse(msg.body);
        setEvents((prev) => [
          {
            id: payload.id,
            type: payload.type || 'ORDER',
            tableId: payload.tableId,
            message: JSON.stringify(payload),
            ts: new Date().toISOString(),
            raw: payload,
          },
          ...prev,
        ]);
      });
    };
    c.activate();
    setClient(c);
    return () => {
      c.deactivate();
    };
  }, [token, restaurantId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Staff Dashboard (demo restaurant)</h1>
      <div className="space-y-2">
        {events.length === 0 && <div className="text-gray-600">No recent events.</div>}
        {events.map((e) => (
          <div key={e.id ?? Math.random()} className="p-3 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-600">{e.type}</div>
                <div className="font-medium">{e.message}</div>
                <div className="text-xs text-gray-500">Table: {e.tableId}</div>
              </div>
              <div className="text-xs text-gray-400">
                {e.ts ? new Date(e.ts).toLocaleTimeString() : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
