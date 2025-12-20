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
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-semibold text-lg">{dish.name}</span>
          </div>
        )}

        {/* Gradient fade overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <h3 className="text-lg font-semibold text-white">{dish.name}</h3>
          <p className="text-sm text-gray-200">{dish.description}</p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-white font-bold text-base drop-shadow">₹ {dish.price}</span>
            <button
              onClick={() => onAdd(dish)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
