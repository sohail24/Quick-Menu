// src/pages/Admin/AdminTables.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import QRCode from 'qrcode';
import { useAuthStore } from '../../app/store';

type TableItem = {
  id: string;
  name?: string;
  qrUrl?: string;
  qrPngDataUrl?: string; // PNG data URL
  occupied?: boolean;
};

export default function AdminTables() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [bulkCount, setBulkCount] = useState<number>(5);
  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;
  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
      .then((res) => {
        if (!mounted) return;
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.restaurants ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setSelectedRest(arr[0].id);
      })
      .catch((e) => console.warn('Failed load restaurants', e));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRest) {
      setTables([]);
      return;
    }
    setLoading(true);
    api
      .get(`/api/restaurants/${selectedRest}/tables`)
      .then(async (res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.tables ?? []);
        // ensure each table has a qrPngDataUrl
        const enriched: TableItem[] = arr.map((t: any) => ({ ...t, qrPngDataUrl: undefined }));
        setTables(enriched);
        // generate PNG data URLs in parallel
        try {
          const generated = await Promise.all(
            enriched.map(async (t) => {
              const url = buildMenuUrl(selectedRest, t.id);
              const png = await generateQrPngDataUrl(url);
              return { ...t, qrPngDataUrl: png };
            }),
          );
          setTables(generated);
        } catch (e) {
          console.warn('QR generation failed', e);
        }
      })
      .catch((e) => {
        console.warn('Failed load tables', e);
        setTables([]);
      })
      .finally(() => setLoading(false));
  }, [selectedRest]);

  function buildMenuUrl(restaurantId: string | null, tableId: string) {
    // the URL that customer will scan: mobile-friendly route
    const origin = window.location.origin;
    // Use /menu/demo?tableId=... or /menu/:restaurantId?tableId=... depending on your frontend routing
    // We'll use /menu/<restaurantId>?tableId=... which your RestaurantMenu expects if restaurantId is not 'demo'.
    return `${origin}/menu/${restaurantId}?tableId=${encodeURIComponent(tableId)}`;
  }

  async function generateQrPngDataUrl(text: string) {
    // Using qrcode package to create PNG data URL
    // options: type=image/png, width controls size. Adjust width for printing (e.g. 400).
    try {
      const dataUrl = await QRCode.toDataURL(text, { type: 'image/png', width: 400, margin: 1 });
      return dataUrl; // data:image/png;base64,...
    } catch (err) {
      console.error('QRCode generation error', err);
      throw err;
    }
  }

  async function createTable() {
    if (!selectedRest) return alert('Choose restaurant');
    if (!newName.trim()) return alert('Enter table name');
    try {
      const res = await api.post(`/api/restaurants/${selectedRest}/tables`, { name: newName });
      const t = res.data;
      const url = buildMenuUrl(selectedRest, t.id);
      const png = await generateQrPngDataUrl(url).catch(() => undefined);
      setTables((s) => [...s, { ...t, qrPngDataUrl: png }]);
      setNewName('');
    } catch (err) {
      console.error('Create table failed', err);
      alert('Failed to create table');
    }
  }

  async function bulkCreate() {
    if (!selectedRest) return alert('Choose restaurant');
    if (!Number.isInteger(bulkCount) || bulkCount <= 0) return alert('Invalid count');
    if (!confirm(`Create ${bulkCount} tables named Table 1..${bulkCount}?`)) return;
    try {
      const created: any[] = [];
      for (let i = 1; i <= bulkCount; i++) {
        const name = `Table Bulk #${i}`;
        const res = await api.post(`/api/restaurants/${selectedRest}/tables`, { name });
        const t = res.data;
        created.push(t);
      }
      // generate QR PNGs
      const withPng = await Promise.all(
        created.map(async (t) => {
          const url = buildMenuUrl(selectedRest, t.id);
          const png = await generateQrPngDataUrl(url).catch(() => undefined);
          return { ...t, qrPngDataUrl: png };
        }),
      );
      setTables((s) => [...s, ...withPng]);
      alert('Bulk created');
    } catch (err) {
      console.error('Bulk create failed', err);
      alert('Bulk create failed');
    }
  }

  async function doDelete(id: string) {
    if (!selectedRest) return;
    if (!confirm('Delete this table?')) return;
    try {
      await api.delete(`/api/restaurants/${selectedRest}/tables/${id}`);
      setTables((s) => s.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete table failed', err);
      alert('Failed to delete table');
    }
  }

  async function toggleOccupied(id: string, val: boolean) {
    if (!selectedRest) return;
    try {
      await api.patch(`/api/restaurants/${selectedRest}/tables/${id}`, { occupied: val });
      setTables((s) => s.map((t) => (t.id === id ? { ...t, occupied: val } : t)));
    } catch (err) {
      console.error('Toggle occupied failed', err);
      alert('Failed to update');
    }
  }

  function downloadPng(dataUrl: string | undefined, filename: string) {
    if (!dataUrl) return alert('No QR available');
    // create anchor and trigger download
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Table QR Codes</h1>
        <div className="flex flex-col gap-1 min-w-0 sm:w-64">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
          <select
            value={selectedRest ?? ''}
            onChange={(e) => setSelectedRest(e.target.value || null)}
            className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
          >
            <option value="">-- select --</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name ?? r.restaurantName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Single Table</label>
          <div className="flex gap-2">
            <input
              placeholder="e.g. Table 1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl flex-1 text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
            />
            <button onClick={createTable} className="h-10 px-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Bulk Create</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-24 text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10 text-center"
            />
            <button onClick={bulkCreate} className="h-10 px-4 border border-blue-100 text-blue-600 bg-blue-50/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex-1">
              Create Bulk
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      <div className="space-y-4">
        {tables.length === 0 && !loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No tables created yet</div>
          </div>
        ) : (
          tables.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner shrink-0 p-2">
                    {t.qrPngDataUrl ? (
                      <img
                        src={t.qrPngDataUrl}
                        alt={`QR ${t.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-300 font-black uppercase tracking-tighter text-center leading-tight">Generating...</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-black text-gray-900 truncate mb-1">{t.name || 'Unnamed Table'}</div>
                    <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest mb-3">ID: {t.id}</div>
                    <label className="inline-flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={!!t.occupied}
                          onChange={(e) => toggleOccupied(t.id, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${t.occupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${t.occupied ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${t.occupied ? 'text-red-600' : 'text-green-600'}`}>
                        {t.occupied ? 'Occupied' : 'Available'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50 w-full sm:w-auto">
                  <button
                    onClick={() => window.open(`${window.location.origin}/menu/${selectedRest}?tableId=${encodeURIComponent(t.id)}`, '_blank')}
                    className="h-9 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-blue-100/30 flex-1 sm:flex-none"
                  >
                    Open Menu
                  </button>
                  <button
                    onClick={() => downloadPng(t.qrPngDataUrl, `qm_qr_${selectedRest}_${t.name ?? t.id}.png`)}
                    className="h-9 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-gray-100 flex-1 sm:flex-none"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => doDelete(t.id)}
                    className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-red-100/30 ml-auto sm:ml-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
