import React from 'react';

interface DishCardProps {
  dish: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };
  onAdd: (dish: any) => void;
}

export default function DishCard({ dish, onAdd }: DishCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300">
      <div className="relative">
        {dish.imageUrl && (
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-52 object-cover" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <h3 className="text-lg font-semibold text-white">{dish.name}</h3>
          <p className="text-sm text-gray-200">{dish.description}</p>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
        <span className="text-green-700 font-bold text-base">₹ {dish.price}</span>
        <button
          onClick={() => onAdd(dish)}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
