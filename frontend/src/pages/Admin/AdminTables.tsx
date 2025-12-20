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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tables</h1>
      </div>

      <div className="mb-3">
        <label className="text-sm block">Select restaurant</label>
        <select
          value={selectedRest ?? ''}
          onChange={(e) => setSelectedRest(e.target.value || null)}
          className="p-2 border rounded"
        >
          <option value="">-- select --</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name ?? r.restaurantName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          placeholder="Table name (e.g. Table 1)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="p-2 border rounded"
        />
        <button onClick={createTable} className="px-3 py-1 bg-blue-600 text-white rounded">
          Create
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bulkCount}
            onChange={(e) => setBulkCount(Number(e.target.value))}
            className="p-2 border rounded w-28"
          />
          <button onClick={bulkCreate} className="px-3 py-1 border rounded">
            Bulk create
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading tables...</div>}

      <div className="space-y-2">
        {tables.map((t) => (
          <div key={t.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-28 h-28 border rounded overflow-hidden flex items-center justify-center bg-white">
                {t.qrPngDataUrl ? (
                  <img
                    src={t.qrPngDataUrl}
                    alt={`QR ${t.name}`}
                    style={{ width: 120, height: 120, objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-xs text-gray-500 p-2">QR generating…</div>
                )}
              </div>

              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">ID: {t.id}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`${window.location.origin}/menu/${selectedRest}?tableId=${encodeURIComponent(t.id)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600"
              >
                Open menu
              </a>

              <button
                onClick={() =>
                  downloadPng(t.qrPngDataUrl, `qm_qr_${selectedRest}_${t.name ?? t.id}.png`)
                }
                className="px-2 py-1 border rounded"
              >
                Download QR (PNG)
              </button>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!t.occupied}
                  onChange={(e) => toggleOccupied(t.id, e.target.checked)}
                />
                <span>{t.occupied ? 'Occupied' : 'Free'}</span>
              </label>

              <button
                onClick={() => doDelete(t.id)}
                className="px-2 py-1 border rounded text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
