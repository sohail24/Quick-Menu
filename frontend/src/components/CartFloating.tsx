import React from "react";

export default function CartFloating({ items, onCheckout }: any) {
  const total = items.reduce(
    (s: number, it: any) => s + it.quantity * it.price,
    0
  );
  return (
    <div className="fixed bottom-4 right-4 p-3 bg-white rounded shadow-xl w-64">
      <div className="flex justify-between">
        <div>Items: {items.length}</div>
        <div className="font-bold">₹ {total.toFixed(2)}</div>
      </div>
      <button
        onClick={onCheckout}
        className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
      >
        Place Order
      </button>
    </div>
  );
}
