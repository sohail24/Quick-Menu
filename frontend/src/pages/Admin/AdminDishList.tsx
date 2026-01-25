// src/pages/Admin/AdminDishList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import DishCardAdmin from '../../components/DishCardAdmin';
import { downloadCsv } from '../../lib/csv';
import { useAuthStore } from '../../app/store';

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
  const [debouncedSearchQ, setDebouncedSearchQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // bulk
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const loggedInUserEmail = useAuthStore((s) => s.user)?.email;

  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQ(searchQ);
      setPage(0);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQ]);

  useEffect(() => {
    let mounted = true;
    setLoadingRestaurants(true);
    api
      .get('/api/restaurants/owner/' + loggedInUserEmail)
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
    if (debouncedSearchQ) params.push(`search=${encodeURIComponent(debouncedSearchQ)}`);
    if (categoryFilter) params.push(`categoryId=${encodeURIComponent(categoryFilter)}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    return params.length ? `?${params.join('&')}` : '';
  }, [debouncedSearchQ, categoryFilter, page, size]);

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
          `/api/dishes?restaurantId=${selectedRest}${debouncedSearchQ ? `&search=${encodeURIComponent(debouncedSearchQ)}` : ''}&includeUnavailable=false&page=${page}&size=${size}`,
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
  }, [selectedRest, queryStr, page, size, categoryFilter, debouncedSearchQ, refreshKey]);

  function refreshData() {
    setRefreshKey((k) => k + 1);
  }


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
      refreshData();
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
      refreshData();
    } catch (err) {
      console.error('Delete dish failed', err);
      alert('Delete failed');
    }
  }

  return (
    <div className="p-4">
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
              refreshData();
            }}
            className="px-3 py-1 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 lg:grid-cols-5 gap-3 items-end bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Restaurant</label>
          {loadingRestaurants ? (
            <div className="text-[10px] text-gray-400 italic">Loading...</div>
          ) : (
            <select
              className="p-2 border border-blue-50 bg-blue-50/20 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all h-10"
              value={selectedRest ?? ''}
              onChange={(e) => setSelectedRest(e.target.value || null)}
            >
              <option value="">-- select --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name ?? r.restaurantName ?? r.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Category</label>
          <select
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
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

        <div className="flex flex-col gap-1 min-w-0 col-span-2 lg:col-span-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Search</label>
          <input
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
            placeholder="dish name or tag"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 min-w-0 col-span-2 lg:col-span-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Page size</label>
          <select
            className="p-2 border border-gray-100 bg-gray-50/50 rounded-xl w-full text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-10"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s} items
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={selectAllVisible} className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            All
          </button>
          <button onClick={clearSelection} className="px-3 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </button>
          <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />
          <button
            onClick={() => bulkToggleAvailability(true)}
            disabled={bulkBusy}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            Available
          </button>
          <button
            onClick={() => bulkToggleAvailability(false)}
            disabled={bulkBusy}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            Hidden
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
          <button onClick={exportVisible} className="px-3 py-1.5 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors h-8">
            Export CSV
          </button>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total: {total ?? dishes.length}</div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-4">{error}</div>}

      <div className="space-y-3">
        {dishes.length === 0 && !loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">No dishes found</div>
          </div>
        ) : (
          dishes.map((d) => {
            const id = d.id;
            return (
              <div
                key={id}
                className="p-4 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={!!selected[id]}
                        onChange={() => toggleSelect(id)}
                        className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DishCardAdmin dish={d} />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/dishes/${id}`)}
                      className="h-8 px-4 bg-gray-50 hover:bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => doDelete(id)}
                      className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-red-100/30"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="h-9 px-4 border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="h-9 px-4 border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Page {page} • Showing {dishes.length}
        </div>
      </div>
    </div>
  );
}
