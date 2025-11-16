import React from "react";

export default function DishCard({ dish, onAdd }: any) {
  return (
    <div className="border rounded p-3 bg-white">
      {dish.imageUrl && (
        <img
          src={dish.imageUrl}
          alt={dish.name}
          className="w-full h-36 object-cover mb-2 rounded"
        />
      )}
      <h3 className="font-semibold">{dish.name}</h3>
      <p className="text-sm text-gray-600">{dish.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="font-bold">₹ {dish.price}</span>
        <button
          onClick={() => onAdd(dish)}
          className="px-3 py-1 rounded bg-green-600 text-white"
        >
          Add
        </button>
      </div>
    </div>
  );
}
