import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Utensils, BarChart3, Settings, QrCode, Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function AdminDemo() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const screenshots = [
    '/screenshots/admin_dashboard_1.png',
    '/screenshots/admin_dashboard_2.png',
    '/screenshots/admin_dashboard_3.png',
    '/screenshots/admin_dashboard_4.png',
    '/screenshots/admin_dashboard_5.png',
    '/screenshots/admin_dashboard_6.png',
    '/screenshots/admin_dashboard_7.png',
    '/screenshots/admin_dashboard_8.png',
    '/screenshots/admin_dashboard_9.png',
    '/screenshots/admin_dashboard_10.png'
  ];

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      if (!showModal) {
        setActiveSlide(bs => (bs + 1) % screenshots.length);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [showModal]);

  const nextSlide = () => setActiveSlide(s => (s + 1) % screenshots.length);
  const prevSlide = () => setActiveSlide(s => (s - 1 + screenshots.length) % screenshots.length);

  return (
    <section id="admin-demo" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          {/* Content */}
          <div className="lg:w-1/2 order-2 lg:order-1">
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Control Center</span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Powerful <span className="text-blue-600">Admin Dashboard</span> for Restaurant Owners
            </h2>
            
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">
              Take full control of your restaurant with our intuitive admin panel. 
              Manage your menu, track sales in real-time, and customize your ordering experience in seconds.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-lg shadow-blue-200/50">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Smart Menu Manager</h3>
                  <p className="text-gray-500 font-medium">Add categories, dishes, Pricing and availability with a single click. Everything syncs instantly to your digital menu.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 shadow-lg shadow-indigo-200/50">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Deep Analytics</h3>
                  <p className="text-gray-500 font-medium">Track your top-selling items, peak hours, and daily revenue with beautiful, easy-to-read charts.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 text-purple-600 shadow-lg shadow-purple-200/50">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Instant QR Generation</h3>
                  <p className="text-gray-500 font-medium">Generate unique QR codes for every table. Print them out and you're ready to take contactless orders.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Demo / Screenshot Carousel */}
          <div className="lg:w-1/2 order-1 lg:order-2 relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-full blur-[100px] opacity-70"></div>
            
            <div className="relative bg-gray-50 rounded-[24px] border border-gray-200 shadow-2xl overflow-hidden group">
              <div className="relative aspect-[16/10] bg-white">
                <img 
                  src={screenshots[activeSlide]} 
                  alt={`Admin Dashboard View ${activeSlide + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500 ease-in-out cursor-zoom-in"
                  onClick={() => setShowModal(true)}
                />
                
                {/* Carousel Controls */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 z-10">
                  {screenshots.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeSlide ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute inset-y-0 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <button 
                    onClick={prevSlide}
                    className="p-3 bg-white/90 backdrop-blur text-gray-900 rounded-full shadow-xl hover:bg-white hover:scale-110 transition duration-200 border border-gray-100"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                </div>

                <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <button 
                    onClick={nextSlide}
                    className="p-3 bg-white/90 backdrop-blur text-gray-900 rounded-full shadow-xl hover:bg-white hover:scale-110 transition duration-200 border border-gray-100"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Full Screen Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setShowModal(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
            onClick={() => setShowModal(false)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-7xl max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <img 
               src={screenshots[activeSlide]} 
               alt="Full size view" 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
             />
             
             {/* Modal Controls */}
             <button 
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
             >
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
             >
                <ChevronRight className="w-8 h-8" />
             </button>
          </div>
        </div>
      )}
    </section>
  );
}
