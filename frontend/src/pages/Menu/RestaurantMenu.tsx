// src/pages/Menu/RestaurantMenu.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import DishCard from '../../components/DishCard';
import CartFloating from '../../components/CartFloating';

type CartItem = { dishId: string; name: string; price: number; quantity: number };

export default function RestaurantMenu() {
  const params = useParams<{ restaurantId?: string }>();
  const { restaurantId: paramRestaurantId } = params;
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') ?? undefined;

  const [effectiveRestaurantId, setEffectiveRestaurantId] = useState<string | null>(
    paramRestaurantId ?? null,
  );
  const [effectiveTableId, setEffectiveTableId] = useState<string | null>(queryTableId ?? null);

  const [loadingDemo, setLoadingDemo] = useState(false);
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

  // If the route param is "demo", fetch mapping info
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
        const res = await api.get('/api/demo/info');
        const data = res.data;
        if (data && data.restaurantId) {
          setEffectiveRestaurantId(data.restaurantId);
          // prefer query param tableId if present, otherwise use demo table id returned
          if (queryTableId) setEffectiveTableId(queryTableId);
          else if (data.tableId) setEffectiveTableId(data.tableId);
        } else {
          setError('Demo info not available');
        }
      } catch (err: any) {
        console.error('Failed to resolve demo info', err);
        setError(err?.response?.data?.message || 'Failed to load demo info');
      } finally {
        setLoadingDemo(false);
      }
    }

    resolveDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRestaurantId]);

  // Fetch menu once we have an effective restaurant id
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    setError(null);
    api
      .get(
        `/api/${effectiveRestaurantId}/menu?includeUnavailable=false${effectiveTableId ? '&tableId=' + effectiveTableId : ''}`,
      )
      .then((res) => {
        const ds = res.data?.dishes ?? res.data ?? [];
        setDishes(ds);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load menu');
      });
  }, [effectiveRestaurantId, effectiveTableId]);

  useEffect(() => {
    localStorage.setItem('qm_cart', JSON.stringify(cart));
  }, [cart]);

  function addToCart(dish: any) {
    setCart((prev) => {
      const found = prev.find((p) => p.dishId === dish.id);
      if (found)
        return prev.map((p) => (p.dishId === dish.id ? { ...p, quantity: p.quantity + 1 } : p));
      return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  }

  async function placeOrder() {
    if (!cart.length) return alert('Cart empty');
    if (!effectiveRestaurantId) return alert('Restaurant not resolved');
    const payload = {
      tableId: effectiveTableId ?? 'unknown-table',
      customerNote: '',
      items: cart.map((c) => ({ dishId: c.dishId, quantity: c.quantity })),
    };
    try {
      const res = await api.post(`/api/${effectiveRestaurantId}/orders`, payload);
      alert('Order placed: ' + res.data.id);
      setCart([]);
      localStorage.removeItem('qm_cart');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Order failed');
    }
  }

  if (loadingDemo) {
    return <div className="p-4">Resolving demo restaurant...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        Restaurant Menu ({paramRestaurantId ?? effectiveRestaurantId})
      </h1>
      {!effectiveRestaurantId && <div className="text-gray-600">No restaurant selected</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dishes.map((d) => (
          <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
        ))}
      </div>
      <CartFloating items={cart} onCheckout={placeOrder} />
    </div>
  );
}
