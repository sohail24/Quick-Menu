// src/components/CartFloating.tsx
import React from 'react';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
};

type Props = {
  items: CartItem[];
  onCheckout: () => void;
  onIncrement?: (dishId: string) => void;
  onDecrement?: (dishId: string) => void;
  onRemove?: (dishId: string) => void;
  className?: string;
  isOrderComplete?: boolean;
};

export default function CartFloating({
  items,
  onCheckout,
  onIncrement,
  onDecrement,
  onRemove,
  className = '',
  isOrderComplete = false,
}: Props) {
  const total = items.reduce((s, it) => s + it.quantity * it.price, 0);

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 max-w-full ${className}`}>
      <div className="bg-white rounded shadow-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Cart</div>
          <div className="text-sm text-gray-600">{items.length} items</div>
        </div>

        <div className="max-h-48 overflow-auto">
          {items.length === 0 && <div className="text-sm text-gray-500">Your cart is empty</div>}
          {items.map((it) => (
            <div
              key={it.dishId}
              className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-xs text-gray-500">
                  ₹ {it.price.toFixed(2)} • Subtotal ₹ {(it.price * it.quantity).toFixed(2)}
                </div>
                {it.note && <div className="text-xs text-gray-400 mt-1">Note: {it.note}</div>}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => onDecrement?.(it.dishId)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    -
                  </button>
                  <div className="text-sm">{it.quantity}</div>
                  <button
                    onClick={() => onIncrement?.(it.dishId)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove?.(it.dishId)}
                    className="ml-3 text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Total</div>
            <div className="text-lg font-semibold">₹ {total.toFixed(2)}</div>
          </div>

          <button
            onClick={onCheckout}
            disabled={items.length === 0 || isOrderComplete}
            className={`w-full py-2 rounded text-white ${items.length === 0 || isOrderComplete ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isOrderComplete ? 'Order Placed' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
