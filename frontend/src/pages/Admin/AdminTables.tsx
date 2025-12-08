// src/pages/Admin/AdminTables.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

type TableItem = {
  id: string;
  name?: string;
  qrUrl?: string;
  qrCodeDataUrl?: string;
  occupied?: boolean;
};

export default function AdminTables() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/restaurants')
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
      .then((res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.tables ?? []);
        setTables(
          arr.map((t: any) => ({ ...t, qrCodeDataUrl: makeQrDataUrl(selectedRest, t.id) })),
        );
      })
      .catch((e) => {
        console.warn('Failed load tables', e);
        setTables([]);
      })
      .finally(() => setLoading(false));
  }, [selectedRest]);

  function makeQrDataUrl(restaurantId: string | null, tableId: string) {
    // build a simple QR using google chart API data url? but better to construct a small SVG QR stub for offline.
    // For simplicity produce a link (you can use a real QR generator later). We'll create a tiny SVG with the URL text.
    const url = `${window.location.origin}/menu/${restaurantId}?tableId=${encodeURIComponent(tableId)}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="#fff"/><text x="10" y="90" font-size="10" fill="#000">${url}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  async function createTable() {
    if (!selectedRest) return alert('Choose restaurant');
    if (!newName.trim()) return alert('Enter table name');
    try {
      const res = await api.post(`/api/restaurants/${selectedRest}/tables`, { name: newName });
      const t = res.data;
      setTables((s) => [...s, { ...t, qrCodeDataUrl: makeQrDataUrl(selectedRest, t.id) }]);
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
        const name = `Table ${i}`;
        // note: API might have batch endpoint; we create iteratively
        const res = await api.post(`/api/restaurants/${selectedRest}/tables`, { name });
        created.push(res.data);
      }
      setTables((s) => [
        ...s,
        ...created.map((t) => ({ ...t, qrCodeDataUrl: makeQrDataUrl(selectedRest, t.id) })),
      ]);
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

  return (
    <div>
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
              <div className="w-12 h-12 border rounded overflow-hidden flex items-center justify-center">
                {t.qrCodeDataUrl ? (
                  <img src={t.qrCodeDataUrl} alt="qr" style={{ width: 48, height: 48 }} />
                ) : (
                  <div className="text-xs text-gray-500">QR</div>
                )}
              </div>
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">ID: {t.id}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`${window.location.origin}/menu/${selectedRest}?tableId=${encodeURIComponent(t.id)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600"
              >
                Open menu
              </a>
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
