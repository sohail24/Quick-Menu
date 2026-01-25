import React from 'react';
import { Plus, Clock } from 'lucide-react';
import Button from './ui/Button';
import { getOptimizedUrl } from '../lib/imageUtils';

interface DishCardProps {
  dish: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    prepTimeMins: number;
  };
  onAdd: (dish: any) => void;
}

export default function DishCard({ dish, onAdd }: DishCardProps) {
  const optimizedImageUrl = getOptimizedUrl(dish.imageUrl);

  return (
    <div className="group bg-white sm:rounded-2xl rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-row sm:flex-col h-full min-h-[160px] sm:min-h-0">
      {/* Content Section (Mobile Left, Desktop Bottom) */}
      <div className="p-4 flex flex-col flex-1 order-1 sm:order-2">
        <div className="mb-auto">
          <div className="flex items-center gap-2 mb-1">
             <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Classic</div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 sm:hidden">
               <Clock className="w-3 h-3 text-blue-400" />
               {dish.prepTimeMins} min
             </div>
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {dish.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed font-medium">
            {dish.description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-lg font-black text-gray-900">₹{dish.price}</div>
          <div className="hidden sm:block">
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

      {/* Image Section (Mobile Right, Desktop Top) */}
      <div className="relative w-[130px] sm:w-full aspect-square sm:aspect-[4/3] overflow-hidden order-2 sm:order-1 m-3 sm:m-0 rounded-xl sm:rounded-none bg-gray-50">
        {dish.imageUrl ? (
          <img 
            src={optimizedImageUrl} 
            alt={dish.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
             <span className="text-2xl sm:text-4xl font-bold opacity-10 uppercase tracking-tighter">{dish.name[0]}</span>
          </div>
        )}
        
        {/* Prep Time Overlay (Desktop Only) */}
        <div className="absolute top-2 right-2 hidden sm:block">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-white/50 font-bold text-gray-900 text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-700" />
            {dish.prepTimeMins} min
          </div>
        </div>

        {/* Mobile Add Button - Floating over image or attached */}
        <div className="absolute bottom-1 inset-x-0 flex justify-center sm:hidden">
          <Button 
            onClick={() => onAdd(dish)}
            size="sm"
            className="!px-3 !h-8 bg-blue-600 text-white font-black shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all scale-90 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> ADD
          </Button>
        </div>
      </div>
    </div>
  );
}

