// src/pages/Menu/RestaurantMenu.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import DishCard from '../../components/DishCard';
import CartFloating from '../../components/CartFloating';
import OrderSummaryModal from '../../components/OrderSummaryModal';
import OrderStatusFloating from '../../components/OrderStatusFloating';
import BellButton from '../../components/BellButton';
import { getActiveOrderFor, setActiveOrder } from '../../lib/orderStorage';

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
  const [orderComplete, setOrderComplete] = useState(false);

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
        const ds = res.data?.dishes ?? res.data ?? [];
        setDishes(ds);
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
      return;
    }
    const ao = getActiveOrderFor(effectiveRestaurantId, effectiveTableId);
    setExistingOrderForTable(ao?.orderId ?? null);
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
      // persist active order mapping (minimum-effort client side)
      if (effectiveRestaurantId && effectiveTableId) {
        try {
          setActiveOrder(
            effectiveRestaurantId,
            effectiveTableId,
            id,
            responseData?.placedAt ?? new Date().toISOString(),
          );
        } catch (e) {
          // ignore
        }
      }
      navigate(`/order/success/${id}`);
    } else alert('Order placed');
  }

  function handleStopTracking() {
    // Clear the existing order banner when user stops tracking
    setExistingOrderForTable(null);
  }

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          Restaurant Menu {paramRestaurantId ? `(${paramRestaurantId})` : ''}
        </h1>
        {demoInfo && (
          <div className="mt-2 text-sm text-gray-600">
            Demo: <strong>{demoInfo.restaurantName}</strong>
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
            You already placed an order for this table: <strong>#{existingOrderForTable}</strong>.
            <button className="ml-3 text-blue-600" onClick={() => setOrderModalOpen(true)}>
              View / Manage
            </button>
          </div>
        )}
      </div>

      {demoInfo && (
        <div className="mb-4 p-3 bg-white rounded shadow">
          <div className="text-xs text-gray-500">Demo info</div>
          <pre className="text-xs mt-2 overflow-auto max-h-28">
            {JSON.stringify(demoInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {dishes.length === 0 && !loadingMenu && (
          <div className="text-gray-600">No dishes available.</div>
        )}
        {dishes.map((d) => (
          <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
        ))}
      </div>

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
