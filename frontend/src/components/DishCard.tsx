import React from 'react';
import { Plus } from 'lucide-react';
import Button from './ui/Button';

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
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {dish.imageUrl ? (
          <img 
            src={dish.imageUrl} 
            alt={dish.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
             <span className="text-4xl font-bold opacity-10 uppercase tracking-tighter">{dish.name[0]}</span>
          </div>
        )}
        
        {/* Prep Time Overlay */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-white/50 font-bold text-gray-900 text-xs">
            Prep Time: {dish.prepTimeMins} min
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-auto">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {dish.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {dish.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
             <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Classic</div>
             <div className="text-lg font-black text-gray-900">₹{dish.price}</div>
          </div>
          <Button 
            onClick={() => onAdd(dish)}
            size="sm"
            className="shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
