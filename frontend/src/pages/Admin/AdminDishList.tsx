// src/pages/Admin/AdminDishList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import DishCardAdmin from '../../components/DishCardAdmin';
import { downloadCsv } from '../../lib/csv';

type Dish = any;
type Category = any;

export default function AdminDishList() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRest, setSelectedRest] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters / pagination
  const [searchQ, setSearchQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState<number | null>(null);

  // bulk
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants')
      .then((res) => {
        if (!mounted) return;
        const data = res.data ?? {};
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : (data?.items ?? data?.restaurants ?? []);
        setRestaurants(arr);
        if (arr.length > 0) setSelectedRest((p) => p ?? arr[0].id);
      })
      .catch((err) => {
        console.warn('Failed load restaurants', err);
        setError('Failed to load restaurants');
      })
      .finally(() => {
        if (mounted) setLoadingRestaurants(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // load categories when restaurant selected
  useEffect(() => {
    if (!selectedRest) {
      setCategories([]);
      return;
    }
    api
      .get(`/api/${selectedRest}/categories`)
      .then((res) => {
        const d = res.data ?? {};
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.content)
            ? d.content
            : (d?.items ?? d?.categories ?? []);
        setCategories(arr);
      })
      .catch((e) => {
        console.warn('Failed load categories', e);
        setCategories([]);
      });
  }, [selectedRest]);

  const queryStr = useMemo(() => {
    const params: string[] = [];
    params.push(`includeUnavailable=true`);
    if (searchQ) params.push(`search=${encodeURIComponent(searchQ)}`);
    if (categoryFilter) params.push(`categoryId=${encodeURIComponent(categoryFilter)}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    return params.length ? `?${params.join('&')}` : '';
  }, [searchQ, categoryFilter, page, size]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!selectedRest) {
        setDishes([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // prefer restaurant-scoped path
        const urls = [
          `/api/${selectedRest}/dishes${queryStr}`,
          `/api/restaurants/${selectedRest}/dishes${queryStr}`,
          `/api/dishes?restaurantId=${selectedRest}${searchQ ? `&search=${encodeURIComponent(searchQ)}` : ''}&includeUnavailable=false&page=${page}&size=${size}`,
        ];
        let ok = false;
        for (const u of urls) {
          try {
            const res = await api.get(u);
            if (!mounted) return;
            const payload = res.data ?? {};
            const arr = Array.isArray(payload)
              ? payload
              : Array.isArray(payload.content)
                ? payload.content
                : (payload?.items ?? payload?.dishes ?? payload?.data ?? []);
            setDishes(arr);
            if (payload.totalElements !== undefined) setTotal(payload.totalElements);
            else if (payload.total !== undefined) setTotal(payload.total);
            else setTotal(null);
            ok = true;
            break;
          } catch (e) {
            // try next
          }
        }
        if (!ok) setError('No dishes endpoint available for this restaurant');
      } catch (err) {
        console.error('Failed to load dishes', err);
        setError('Failed to load dishes');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedRest, queryStr, page, size, categoryFilter, searchQ]);

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function selectAllVisible() {
    const map: Record<string, boolean> = {};
    dishes.forEach((d) => (map[d.id] = true));
    setSelected(map);
  }
  function clearSelection() {
    setSelected({});
  }

  async function bulkToggleAvailability(makeAvailable: boolean) {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return alert('No dishes selected');
    if (!selectedRest) return alert('No restaurant selected');
    if (!confirm(`Mark ${ids.length} dish(es) as ${makeAvailable ? 'available' : 'unavailable'}?`))
      return;
    setBulkBusy(true);
    try {
      await Promise.all(
        ids.map((id) =>
          api
            .patch(`/api/${selectedRest}/dishes/${id}/availability`, { isAvailable: makeAvailable })
            .catch((e) => {
              throw e;
            }),
        ),
      );
      alert('Updated');
      setSelected({});
      // refresh
      setTimeout(() => setSelectedRest((s) => (s ? s + '' : s)), 200);
    } catch (err) {
      console.error('Bulk update failed', err);
      alert('Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  }

  function exportVisible() {
    if (!dishes || dishes.length === 0) return alert('No dishes to export');
    const rows = dishes.map((d) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      available: d.available === undefined ? (d.isAvailable ?? true) : d.available,
      category: d.categoryName ?? d.category?.name ?? d.categoryId ?? '',
    }));
    downloadCsv(`dishes_${selectedRest ?? 'all'}_page${page}.csv`, rows);
  }

  async function doDelete(id: string) {
    if (!selectedRest) return alert('No restaurant selected');
    if (!confirm('Delete this dish? This is permanent.')) return;
    try {
      await api.delete(`/api/${selectedRest}/dishes/${id}`);
      setDishes((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Delete dish failed', err);
      alert('Delete failed');
    }
  }

  return (
    <div className="p-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Dishes</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/dishes/create')}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Create Dish
          </button>
          <button
            onClick={() => {
              setPage(0);
              setSelectedRest((s) => (s ? s + '' : s));
            }}
            className="px-3 py-1 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="text-sm block">Restaurant</label>
          {loadingRestaurants ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <select
              className="p-2 border rounded"
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
            >
              <option value="">-- select restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-sm block">Category</label>
          <select
            className="p-2 border rounded"
            value={categoryFilter ?? ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
          >
            <option value="">-- all --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm block">Search</label>
          <input
            className="p-2 border rounded w-full"
            placeholder="dish name or tag"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm block">Page size</label>
          <select
            className="p-2 border rounded"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={selectAllVisible} className="px-2 py-1 border rounded">
            Select all
          </button>
          <button onClick={clearSelection} className="px-2 py-1 border rounded">
            Clear
          </button>
          <button
            onClick={() => bulkToggleAvailability(true)}
            disabled={bulkBusy}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            Mark Available
          </button>
          <button
            onClick={() => bulkToggleAvailability(false)}
            disabled={bulkBusy}
            className="px-2 py-1 bg-yellow-600 text-white rounded"
          >
            Mark Unavailable
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportVisible} className="px-3 py-1 border rounded">
            Export CSV
          </button>
          <div className="text-sm text-gray-600">Total: {total ?? '—'}</div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading dishes…</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-2">
        {dishes.length === 0 && !loading ? (
          <div className="text-gray-600">No dishes found.</div>
        ) : (
          dishes.map((d) => {
            const id = d.id;
            return (
              <div
                key={id}
                className="p-3 bg-white rounded shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected[id]}
                    onChange={() => toggleSelect(id)}
                  />
                  <DishCardAdmin dish={d} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/dishes/${id}`)}
                    className="px-2 py-1 border rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => doDelete(id)}
                    className="px-2 py-1 border rounded text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1 border rounded mr-2"
          >
            Prev
          </button>
          <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Page: {page} • Showing: {dishes.length}
        </div>
      </div>
    </div>
  );
}
