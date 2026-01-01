// src/components/DishCardAdmin.tsx
import React from 'react';

export default function DishCardAdmin({ dish }: { dish: any }) {
  const banner = dish.imageUrl ?? dish.bannerUrl ?? dish.photo ?? dish.image ?? null;
  const price = dish.price ?? dish.amount ?? dish.priceAtOrder ?? 0;
  const category = dish.categoryName ?? dish.category?.name ?? dish.categoryId ?? '';
  const available = dish.available === undefined ? (dish.isAvailable ?? true) : dish.available;

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {banner ? (
          <img
            src={banner}
            alt={dish.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="text-xs text-gray-500 p-2">No image</div>
        )}
      </div>
      <div>
        <div className="font-medium">{dish.name}</div>
        <div className="text-xs text-gray-500">
          {category} • ₹ {price}
        </div>
        <div className="text-xs mt-1">
          {available ? (
            <span className="text-green-600">Available</span>
          ) : (
            <span className="text-yellow-700">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
