import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import DishCard from "../../components/DishCard";
import CartFloating from "../../components/CartFloating";

export default function RestaurantMenu() {
  const { restaurantId } = useParams<{ restaurantId?: string }>();
  const id = restaurantId ?? "demo";
  const [dishes, setDishes] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    api
      .get(`/api/${id}/menu?includeUnavailable=false`)
      .then((res) => {
        const ds = res.data?.dishes ?? [];
        setDishes(ds);
      })
      .catch((err) => console.error(err));
  }, [id]);

  function addToCart(dish: any) {
    setCart((prev) => {
      const found = prev.find((p) => p.dishId === dish.id);
      if (found)
        return prev.map((p) =>
          p.dishId === dish.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      return [
        ...prev,
        { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 },
      ];
    });
  }

  async function placeOrder() {
    if (!cart.length) return alert("Cart empty");
    const payload = {
      tableId: "demo-table",
      customerNote: "",
      items: cart.map((c: any) => ({ dishId: c.dishId, quantity: c.quantity })),
    };
    try {
      const res = await api.post(`/api/${id}/orders`, payload);
      alert("Order placed: " + res.data.id);
      setCart([]);
    } catch (err) {
      console.error(err);
      alert("Order failed");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Restaurant Menu ({id})</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dishes.map((d) => (
          <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
        ))}
      </div>
      <CartFloating items={cart} onCheckout={placeOrder} />
    </div>
  );
}
