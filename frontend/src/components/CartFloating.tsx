// src/components/CartFloating.tsx
import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

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
  const [isOpen, setIsOpen] = useState(false);
  const total = items.reduce((s, it) => s + it.quantity * it.price, 0);
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);

  if (items.length === 0 && !isOpen) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 ${className}`}>
      {/* Drawer / Modal */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-4 px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                   <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                      <ShoppingBag className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto no-scrollbar space-y-4">
                {items.map((it) => (
                  <div
                    key={it.dishId}
                    className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{it.name}</div>
                      <div className="text-xs font-semibold text-blue-600 mt-0.5">₹{it.price}</div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white rounded-full border border-gray-200 p-1 shadow-sm">
                        <button
                          onClick={() => onDecrement?.(it.dishId)}
                          className="p-1.5 hover:bg-gray-50 rounded-full transition text-gray-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{it.quantity}</span>
                        <button
                          onClick={() => onIncrement?.(it.dishId)}
                          className="p-1.5 hover:bg-gray-50 rounded-full transition text-gray-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove?.(it.dishId)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-500 font-medium">Grand Total</div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight">₹{total.toFixed(2)}</div>
                </div>
                <Button 
                  onClick={onCheckout}
                  disabled={isOrderComplete}
                  className="w-full h-14 text-lg"
                >
                  {isOrderComplete ? 'Order Placed' : 'Checkout Now'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-16 rounded-full shadow-2xl shadow-blue-600/30 flex items-center justify-between px-6 transition-all duration-300 transform active:scale-95 ${
          isOpen ? 'bg-gray-900' : 'bg-blue-600'
        }`}
      >
        <div className="flex items-center gap-3 text-white">
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-blue-600">
              {itemCount}
            </span>
          </div>
          <div className="hidden sm:block text-left">
             <div className="text-xs opacity-70 font-bold uppercase tracking-widest leading-none">View Cart</div>
             <div className="font-bold">{itemCount} items added</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-xs opacity-70 font-bold uppercase tracking-widest leading-none text-white">Total</div>
             <div className="text-lg font-black text-white leading-none">₹{total.toFixed(2)}</div>
          </div>
          <div className="bg-white/20 p-2 rounded-full text-white">
            {isOpen ? <X className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </div>
        </div>
      </button>
    </div>
  );
}
