// src/pages/Menu/RestaurantMenu.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import DishCard from '../../components/DishCard';
import CartFloating from '../../components/CartFloating';
import OrderSummaryModal from '../../components/OrderSummaryModal';
import OrderStatusFloating from '../../components/OrderStatusFloating';
import BellButton from '../../components/BellButton';
import { getActiveOrderFor } from '../../lib/orderStorage';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
};

export default function RestaurantMenu() {
  const params = useParams<{ restaurantId?: string }>();
  const { restaurantId: paramRestaurantId } = params;
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') ?? undefined;
  const navigate = useNavigate();

  const [effectiveRestaurantId, setEffectiveRestaurantId] = useState<string | null>(
    paramRestaurantId ?? null,
  );
  const [effectiveTableId, setEffectiveTableId] = useState<string | null>(queryTableId ?? null);

  const [demoInfo, setDemoInfo] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dishes, setDishes] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('qm_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [existingOrderForTable, setExistingOrderForTable] = useState<string | null>(null);
  const [existingOrderTableId, setExistingOrderTableId] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // resolve demo restaurant (if paramRestaurantId === 'demo')
  useEffect(() => {
    async function resolveDemo() {
      if (!paramRestaurantId) return;
      if (paramRestaurantId !== 'demo') {
        setEffectiveRestaurantId(paramRestaurantId);
        return;
      }
      setLoadingDemo(true);
      setError(null);
      try {
        const res = await api.get('/api/demo/info', { headers: { 'x-skip-401-redirect': '1' } });
        const data = res.data;
        setDemoInfo(data);
        if (data?.restaurantId) setEffectiveRestaurantId(data.restaurantId);
        if (queryTableId) setEffectiveTableId(queryTableId);
        else if (data?.tableId) setEffectiveTableId(data.tableId);
      } catch (err: any) {
        console.error('Failed to fetch demo info:', err);
        setError(err?.response?.data?.message || 'Failed to resolve demo restaurant');
      } finally {
        setLoadingDemo(false);
      }
    }
    resolveDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRestaurantId]);

  // Fetch Restaurant Details (Name)
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    // If it's the demo restaurant, we already have info in demoInfo (but we can still fetch if we want consistent structure, though demoInfo is usually sufficient)
    // However, for normal restaurants, we need to fetch info.
    
    // Guard: don't fetch if it's strictly a demo ID unless we decide to. 
    // The previous logic for demo handled it. 
    
    api.get(`/api/restaurants/${effectiveRestaurantId}`)
       .then(res => setRestaurant(res.data))
       .catch(err => console.warn("Failed to fetch restaurant details", err));
  }, [effectiveRestaurantId]);

  // load menu
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    setLoadingMenu(true);
    setError(null);
    api
      .get(
        `/api/${effectiveRestaurantId}/menu?includeUnavailable=false${
          effectiveTableId ? '&tableId=' + effectiveTableId : ''
        }`,
      )
      .then((res) => {
        // Handle new structure: { categories: [...], dishes: [...] }
        const data = res.data || {};
        const ds = data.dishes ?? (Array.isArray(data) ? data : []);
        const cats = data.categories ?? [];
        
        setDishes(ds);
        setCategories(cats);
      })
      .catch((err) => {
        console.error('Failed loading menu:', err);
        setError('Failed to load menu');
      })
      .finally(() => setLoadingMenu(false));
  }, [effectiveRestaurantId, effectiveTableId]);

  // persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qm_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // track active order for the current restaurant+table
  useEffect(() => {
    if (!effectiveRestaurantId || !effectiveTableId) {
      setExistingOrderForTable(null);
      setExistingOrderTableId(null);
      return;
    }
    const ao = getActiveOrderFor(effectiveRestaurantId, effectiveTableId);
    setExistingOrderForTable(ao?.orderId ?? null);
    setExistingOrderTableId(ao?.tableId ?? null);
  }, [effectiveRestaurantId, effectiveTableId]);

  // cart operations
  function addToCart(dish: any) {
    setCart((prev) => {
      const found = prev.find((p) => p.dishId === dish.id);
      if (found)
        return prev.map((p) => (p.dishId === dish.id ? { ...p, quantity: p.quantity + 1 } : p));
      return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  }

  function handleIncrement(dishId: string) {
    setCart((prev) =>
      prev.map((p) => (p.dishId === dishId ? { ...p, quantity: p.quantity + 1 } : p)),
    );
  }
  function handleDecrement(dishId: string) {
    setCart((prev) =>
      prev.map((p) => (p.dishId === dishId ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p)),
    );
  }
  function handleRemove(dishId: string) {
    setCart((prev) => prev.filter((p) => p.dishId !== dishId));
  }

  function onCheckoutClick() {
    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }

    // prevent checkout if order already placed
    if (orderComplete) {
      alert('You have already placed an order. Wait for it to be completed.');
      return;
    }

    // if there is already an active order for this table, open the modal (it will show existing-order view)
    if (effectiveRestaurantId && effectiveTableId) {
      const ao = getActiveOrderFor(effectiveRestaurantId, effectiveTableId);
      if (ao?.orderId) {
        // open modal — modal will show the "existing order" message
        setOrderModalOpen(true);
        return;
      }
    }

    // otherwise open modal for normal new order flow
    setOrderModalOpen(true);
  }

  function handleOrderPlaced(responseData: any) {
    const id = responseData?.id ?? (responseData && responseData.orderId) ?? null;
    setLastOrderId(id);
    setCart([]);
    setOrderComplete(true);
    try {
      localStorage.removeItem('qm_cart');
    } catch {}

    if (id) {
      try {
        localStorage.setItem('qm_last_order_id', id);
      } catch {}
      // Note: setActiveOrder is already called in OrderSummaryModal.submitNewOrder
      // so we don't duplicate it here to avoid creating multiple entries
      navigate(`/order/success/${id}`);
    } else alert('Order placed');
  }

  function handleStopTracking() {
    // Clear the existing order banner when user stops tracking
    setExistingOrderForTable(null);
    setExistingOrderTableId(null);
    // Also clear the last order ID display
    setLastOrderId(null);
  }

  // --- Render Helpers ---

  // Sort categories by orderIndex
  const sortedCategories = [...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  // If we have categories, we group dishes.
  // Any dish not in a valid category goes to "Others" or similar? 
  // For now, let's just dump them at the bottom if we want, OR just show categories.
  // The user requirement implies we should segregate by category.
  
  const dishesByCategoryId = dishes.reduce((acc, dish) => {
    const cid = dish.categoryId || 'uncategorized';
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(dish);
    return acc;
  }, {} as Record<string, any[]>);

  // Uncategorized dishes
  const uncategorizedDishes = dishesByCategoryId['uncategorized'] || [];

  return (
    <div className="p-4 bg-gray-50 min-h-screen"> 
      <header className="mb-6 bg-white p-4 roundedshadow-sm shadow border-b">
        <h1 className="text-3xl font-bold text-gray-800">
          {restaurant?.name ?? demoInfo?.restaurantName ?? 'Restaurant Menu'}
        </h1>
        {paramRestaurantId && !restaurant && !demoInfo && (
           <span className="text-xs text-gray-400">ID: {paramRestaurantId}</span>
        )}
        {demoInfo && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
            Viewing Demo: <strong>{demoInfo.restaurantName}</strong>
          </div>
        )}
         {effectiveTableId && (
          <div className="mt-1 text-sm text-gray-500">
             Table: <strong>{effectiveTableId}</strong>
          </div>
        )}
      </header>

      <BellButton
        restaurantId={effectiveRestaurantId}
        tableId={effectiveTableId}
        onSuccess={(id) => {
          /* optionally show toast */
        }}
      />

      <OrderStatusFloating />

      <div className="mb-4">
        {loadingDemo && <div className="text-sm text-gray-600">Resolving demo restaurant...</div>}
        {loadingMenu && <div className="text-sm text-gray-600">Loading menu...</div>}
        {error && <div className="text-sm text-red-600">Error: {error}</div>}
        {lastOrderId && <div className="text-sm text-green-700">Last order id: {lastOrderId}</div>}
        {existingOrderForTable && (
          <div className="mt-2 p-2 bg-yellow-50 border rounded text-sm">
            You placed an order for this table: <strong>#{existingOrderTableId}</strong>.
            <button className="ml-3 text-blue-600" onClick={() => setOrderModalOpen(true)}>
              View / Manage
            </button>
          </div>
        )}
      </div>

      {loadingMenu && dishes.length === 0 && (
          <div className="text-center py-8 text-gray-500">Loading delicious dishes...</div>
      )}

      {/* Render Categories */}
      {categories.length > 0 ? (
        <div className="space-y-8">
           {sortedCategories.map(cat => {
             const catDishes = dishesByCategoryId[cat.id];
             if (!catDishes || catDishes.length === 0) return null;
             return (
               <div key={cat.id}>
                 <h2 className="text-xl font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-3">
                   {cat.name}
                 </h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {catDishes.map((d: any) => (
                      <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
                   ))}
                 </div>
               </div>
             )
           })}

           {/* Uncategorized Section (if any) */}
           {uncategorizedDishes.length > 0 && (
              <div>
                 <h2 className="text-xl font-bold text-gray-800 mb-3 border-l-4 border-gray-400 pl-3">
                   Other Items
                 </h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {uncategorizedDishes.map((d: any) => (
                      <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
                   ))}
                 </div>
              </div>
           )}
        </div>
      ) : (
        /* Fallback / Flat list if no categories found */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {dishes.length === 0 && !loadingMenu && (
            <div className="text-gray-600">No dishes available.</div>
          )}
          {dishes.map((d) => (
            <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
          ))}
        </div>
      )}

      <CartFloating
        items={cart}
        onCheckout={onCheckoutClick}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        isOrderComplete={orderComplete}
      />

      <OrderSummaryModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        cart={cart}
        restaurantId={effectiveRestaurantId}
        tableId={effectiveTableId}
        onOrderPlaced={handleOrderPlaced}
        onStopTracking={handleStopTracking}
      />
    </div>
  );
}
