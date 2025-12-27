// src/pages/Menu/RestaurantMenu.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import DishCard from '../../components/DishCard';
import CartFloating from '../../components/CartFloating';
import OrderSummaryModal from '../../components/OrderSummaryModal';
import OrderStatusFloating from '../../components/OrderStatusFloating';
import BellButton from '../../components/BellButton';
import { getActiveOrderFor } from '../../lib/orderStorage';
import { Search, ChevronLeft, MapPin, Star, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';

type CartItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
};

export default function RestaurantMenu() {
  const params = useParams<{ restaurantId?: string }>();
  const { restaurantId: paramRestaurantId } = params;
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get('tableId') ?? undefined;
  const navigate = useNavigate();

  const [effectiveRestaurantId, setEffectiveRestaurantId] = useState<string | null>(
    paramRestaurantId ?? null,
  );
  const [effectiveTableId, setEffectiveTableId] = useState<string | null>(queryTableId ?? null);

  const [demoInfo, setDemoInfo] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dishes, setDishes] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('qm_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [existingOrderForTable, setExistingOrderForTable] = useState<string | null>(null);
  const [existingOrderTableId, setExistingOrderTableId] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // resolve demo restaurant (if paramRestaurantId === 'demo')
  useEffect(() => {
    async function resolveDemo() {
      if (!paramRestaurantId) return;
      if (paramRestaurantId !== 'demo') {
        setEffectiveRestaurantId(paramRestaurantId);
        return;
      }
      setLoadingDemo(true);
      setError(null);
      try {
        const res = await api.get('/api/demo/info', { headers: { 'x-skip-401-redirect': '1' } });
        const data = res.data;
        setDemoInfo(data);
        if (data?.restaurantId) setEffectiveRestaurantId(data.restaurantId);
        if (queryTableId) setEffectiveTableId(queryTableId);
        else if (data?.tableId) setEffectiveTableId(data.tableId);
      } catch (err: any) {
        console.error('Failed to fetch demo info:', err);
        setError(err?.response?.data?.message || 'Failed to resolve demo restaurant');
      } finally {
        setLoadingDemo(false);
      }
    }
    resolveDemo();
  }, [paramRestaurantId, queryTableId]);

  // Fetch Restaurant Details
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    api.get(`/api/restaurants/${effectiveRestaurantId}`)
       .then(res => setRestaurant(res.data))
       .catch(err => console.warn("Failed to fetch restaurant details", err));
  }, [effectiveRestaurantId]);

  // load menu
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    setLoadingMenu(true);
    setError(null);
    api
      .get(
        `/api/${effectiveRestaurantId}/menu?includeUnavailable=false${
          effectiveTableId ? '&tableId=' + effectiveTableId : ''
        }`,
      )
      .then((res) => {
        const data = res.data || {};
        const ds = data.dishes ?? (Array.isArray(data) ? data : []);
        const cats = data.categories ?? [];
        
        setDishes(ds);
        setCategories(cats);
        if (cats.length > 0) setActiveCategoryId(cats[0].id);
      })
      .catch((err) => {
        console.error('Failed loading menu:', err);
        setError('Failed to load menu');
      })
      .finally(() => setLoadingMenu(false));
  }, [effectiveRestaurantId, effectiveTableId]);

  // persist cart
  useEffect(() => {
    try {
      localStorage.setItem('qm_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // track active order
  useEffect(() => {
    if (!effectiveRestaurantId || !effectiveTableId) {
      setExistingOrderForTable(null);
      setExistingOrderTableId(null);
      return;
    }
    const ao = getActiveOrderFor(effectiveRestaurantId, effectiveTableId);
    setExistingOrderForTable(ao?.orderId ?? null);
    setExistingOrderTableId(ao?.tableId ?? null);
  }, [effectiveRestaurantId, effectiveTableId]);

  // scroll to category
  function scrollToCategory(id: string) {
    setActiveCategoryId(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 140; // Approx height of sticky header + category bar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // cart operations
  function addToCart(dish: any) {
    setCart((prev) => {
      const found = prev.find((p) => p.dishId === dish.id);
      if (found)
        return prev.map((p) => (p.dishId === dish.id ? { ...p, quantity: p.quantity + 1 } : p));
      return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  }

  function handleIncrement(dishId: string) {
    setCart((prev) =>
      prev.map((p) => (p.dishId === dishId ? { ...p, quantity: p.quantity + 1 } : p)),
    );
  }
  function handleDecrement(dishId: string) {
    setCart((prev) =>
      prev.map((p) => (p.dishId === dishId ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p)),
    );
  }
  function handleRemove(dishId: string) {
    setCart((prev) => prev.filter((p) => p.dishId !== dishId));
  }

  function onCheckoutClick() {
    if (!cart.length) return;
    if (orderComplete) return;
    setOrderModalOpen(true);
  }

  function handleOrderPlaced(responseData: any) {
    const id = responseData?.id ?? (responseData && responseData.orderId) ?? null;
    setLastOrderId(id);
    setCart([]);
    setOrderComplete(true);
    try {
      localStorage.removeItem('qm_cart');
    } catch {}
    if (id) navigate(`/order/success/${id}`);
  }

  function handleStopTracking() {
    setExistingOrderForTable(null);
    setExistingOrderTableId(null);
    setLastOrderId(null);
  }

  const sortedCategories = React.useMemo(() => 
    [...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    [categories]
  );
  
  const filteredDishes = React.useMemo(() => {
    if (!searchQuery.trim()) return dishes;
    const q = searchQuery.toLowerCase();
    return dishes.filter(d => 
      d.name?.toLowerCase().includes(q) || 
      d.description?.toLowerCase().includes(q)
    );
  }, [dishes, searchQuery]);

  const dishesByCategoryId = React.useMemo(() => filteredDishes.reduce((acc, dish) => {
    const cid = dish.categoryId || 'uncategorized';
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(dish);
    return acc;
  }, {} as Record<string, any[]>), [filteredDishes]);

  const visibleCategories = React.useMemo(() => 
    sortedCategories.filter(cat => dishesByCategoryId[cat.id]?.length > 0),
    [sortedCategories, dishesByCategoryId]
  );

  const uncategorizedDishes = dishesByCategoryId['uncategorized'] || [];

  return (
    <div className="bg-gray-50 min-h-screen pb-32"> 
      {/* Premium Hero Header */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {/* Restaurant Cover Image */}
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Restaurant" 
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`flex items-center transition-all duration-500 ease-in-out ${isSearchOpen ? 'w-48 sm:w-64 bg-white/20 backdrop-blur-md rounded-2xl px-4' : 'w-12 bg-white/20 backdrop-blur-md rounded-full justify-center'} h-12`}>
               <Search 
                 className="w-6 h-6 text-white cursor-pointer shrink-0" 
                 onClick={() => setIsSearchOpen(!isSearchOpen)}
               />
               {isSearchOpen && (
                 <input 
                   autoFocus
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search dishes..."
                   className="bg-transparent border-none text-white text-sm placeholder:text-white/60 focus:ring-0 focus:outline-none outline-none w-full ml-3 p-0"
                 />
               )}
            </div>
             <BellButton
                restaurantId={effectiveRestaurantId}
                tableId={effectiveTableId}
                className="!relative !bottom-0 !right-0 !bg-white/20 !backdrop-blur-md !rounded-full !text-white hover:!bg-white/40 !shadow-none ring-0 border-0 transition-all active:scale-90"
              />
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Open</span>
            <div className="flex items-center gap-1 text-xs text-yellow-400">
               <Star className="w-3 h-3 fill-current" />
               <span className="font-bold underline">4.8 (200+)</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-lg">
            {restaurant?.name ?? demoInfo?.restaurantName ?? 'Great Dining'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-90 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" /> 
              {restaurant?.address ?? demoInfo?.address ?? 'Main Hall, Business District'}
            </div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> 15-20 min</div>
            {effectiveTableId && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-lg">
                 {restaurant?.tableName || demoInfo?.tableName || 'Table'} <span className="text-blue-400 font-bold">({effectiveTableId})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm overflow-hidden">
        <div 
          ref={categoryNavRef}
          className="container mx-auto px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCategoryId === cat.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
          {uncategorizedDishes.length > 0 && (
            <button
              onClick={() => scrollToCategory('uncategorized')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeCategoryId === 'uncategorized' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Others
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <OrderStatusFloating restaurantId={effectiveRestaurantId} />

        {/* Existing Order Alert */}
        {existingOrderForTable && (
          <div className="mb-6 bg-blue-600 rounded-2xl p-4 text-white shadow-xl shadow-blue-600/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                 <Clock className="w-6 h-6" />
              </div>
              <div>
                 <div className="font-bold">Active order tracking...</div>
                 <div className="text-xs opacity-80">Table #{existingOrderTableId}</div>
              </div>
            </div>
            <Button 
              variant="white" 
              size="sm" 
              onClick={() => setOrderModalOpen(true)}
              className="!px-4"
            >
              View Status
            </Button>
          </div>
        )}

        {/* Menu Content */}
        <div className="space-y-12">
          {searchQuery && filteredDishes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20">
               <div className="text-gray-200 mb-6 flex justify-center">
                  <Search className="w-16 h-16" />
               </div>
               <p className="text-gray-900 font-black text-xl mb-2">No dishes found</p>
               <p className="text-gray-500 font-medium mb-8">We couldn't find any results for "{searchQuery}"</p>
               <button 
                 onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                 className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 transition-all"
               >
                 View All Menu
               </button>
            </div>
          ) : (
            <>
              {visibleCategories.map(cat => {
                const catDishes = dishesByCategoryId[cat.id];
                if (!catDishes || catDishes.length === 0) return null;
                return (
                  <section key={cat.id} id={`category-${cat.id}`} className="scroll-mt-32">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {cat.name}
                      </h2>
                      <div className="h-0.5 flex-1 bg-gray-100 ml-6 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {catDishes.map((d: any) => (
                        <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
                      ))}
                    </div>
                  </section>
                );
              })}

              {uncategorizedDishes.length > 0 && (
                <section id="category-uncategorized" className="scroll-mt-32">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Other Items
                      </h2>
                      <div className="h-0.5 flex-1 bg-gray-100 ml-6 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {uncategorizedDishes.map((d: any) => (
                      <DishCard key={d.id} dish={d} onAdd={() => addToCart(d)} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {loadingMenu && dishes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 pointer-events-none">
             <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 font-medium italic">Preparing your menu...</p>
          </div>
        )}

        {!loadingMenu && dishes.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
             <div className="text-gray-400 mb-4">🍽️</div>
             <p className="text-gray-500 font-medium">No items available at the moment.</p>
          </div>
        )}
      </div>

      <CartFloating
        items={cart}
        onCheckout={onCheckoutClick}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        isOrderComplete={orderComplete}
      />

      <OrderSummaryModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        cart={cart}
        restaurantId={effectiveRestaurantId}
        tableId={effectiveTableId}
        onOrderPlaced={handleOrderPlaced}
        onStopTracking={handleStopTracking}
      />
    </div>
  );
}
