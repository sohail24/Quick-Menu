import React, { useState } from 'react';
import { Smartphone, LayoutDashboard, ShieldCheck, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Features() {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [activeAdminSlide, setActiveAdminSlide] = useState(0);
  const [activeCustomerSlide, setActiveCustomerSlide] = useState(0);

  const customerScreenshots = [
    '/screenshots/customer_screen_1.png',
    '/screenshots/customer_screen_2.png',
    '/screenshots/customer_screen_3.png',
    '/screenshots/customer_screen_4.png',
    '/screenshots/customer_screen_5.png',
    '/screenshots/customer_screen_5b.png',
    '/screenshots/customer_screen_6.png'
  ];

  const adminScreenshots = [
    '/screenshots/admin_dashboard_1.png',
    '/screenshots/admin_dashboard_2.png',
    '/screenshots/admin_dashboard_3.png',
    '/screenshots/admin_dashboard_4.png',
    '/screenshots/admin_dashboard_5.png',
    '/screenshots/admin_dashboard_6.png',
    '/screenshots/admin_dashboard_7.png',
    '/screenshots/admin_dashboard_8.png',
    '/screenshots/admin_dashboard_8_b.png',
    '/screenshots/admin_dashboard_9.png',
    '/screenshots/admin_dashboard_10.png'
  ];

  const nextCustomerSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCustomerSlide((prev) => (prev + 1) % customerScreenshots.length);
  };

  const prevCustomerSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCustomerSlide((prev) => (prev - 1 + customerScreenshots.length) % customerScreenshots.length);
  };

  const nextAdminSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAdminSlide((prev) => (prev + 1) % adminScreenshots.length);
  };

  const prevAdminSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAdminSlide((prev) => (prev - 1 + adminScreenshots.length) % adminScreenshots.length);
  };

  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-6 min-h-screen">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest mb-6">
              <Zap className="w-4 h-4 fill-current" />
              Complete Ecosystem
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Built for <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Every Role</span>
          </h2>
          <p className="text-xl text-gray-500 font-medium">
            QuickMenu connects your guests, staff, and management in one seamless platform.
          </p>
        </div>

        {/* 3-Pillar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 1. Customer Section */}
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500">
             <div 
                className="w-full bg-blue-50/50 rounded-3xl p-8 mb-8 flex items-center justify-center relative overflow-hidden h-[320px] cursor-zoom-in"
                onClick={() => setShowCustomerModal(true)}
             >
                {/* Phone Mockup */}
                <div className="relative z-10 w-[160px] aspect-[9/19] bg-gray-900 rounded-[2rem] border-4 border-gray-900 overflow-hidden shadow-xl transition-transform duration-500 group-hover:scale-105">
                   <img 
                      src={customerScreenshots[0]} 
                      alt="Mobile Menu Interface" 
                      className="w-full h-full object-cover rounded-[1.8rem]"
                    />
                </div>
                <div className="absolute inset-0 bg-blue-100/50 blur-3xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700"></div>
             </div>
             
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <Smartphone className="w-4 h-4" />
                Customer 
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-3">Instant Ordering</h3>
             <p className="text-gray-500 font-medium leading-relaxed">
                No downloads required. Guests simply scan a QR code to view the menu and order instantly from their phone.
             </p>
          </div>

          {/* 2. Admin Section */}
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500">
             <div 
                className="w-full bg-indigo-50/50 rounded-3xl p-6 mb-8 flex items-center justify-center relative overflow-hidden h-[320px] cursor-zoom-in"
                onClick={() => setShowAdminModal(true)}
             >
                {/* Admin Screenshot Card */}
                <div className="relative z-10 w-full aspect-[16/10] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                   <img 
                      src="/screenshots/admin_dashboard_1.png" 
                      alt="Admin Dashboard Preview" 
                      className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute inset-0 bg-indigo-100/50 blur-3xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700"></div>
             </div>

             <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-3">Total Control</h3>
             <p className="text-gray-500 font-medium leading-relaxed">
                Manage your menu, track sales analytics, and customize your restaurant's profile from a powerful admin panel.
             </p>
          </div>

          {/* 3. Staff Section */}
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500">
             <div 
                className="w-full bg-orange-50/50 rounded-3xl p-6 mb-8 flex items-center justify-center relative overflow-hidden h-[320px] cursor-zoom-in"
                onClick={() => setShowStaffModal(true)}
             >
                {/* Staff Screenshot Card */}
                <div className="relative z-10 w-full aspect-[16/10] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transform rotate-[5deg] group-hover:rotate-0 transition-transform duration-500">
                   <img 
                      src="/screenshots/staff_dashboard_1.png" 
                      alt="Staff Portal Preview" 
                      className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute inset-0 bg-orange-100/50 blur-3xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700"></div>
             </div>

             <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" />
                Staff Portal
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-3">Kitchen Sync</h3>
             <p className="text-gray-500 font-medium leading-relaxed">
                A dedicated display for your kitchen staff to track incoming orders, manage prep status, and get waiter calls.
             </p>
          </div>

        </div>
      </div>

      {/* --- Modals --- */}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowCustomerModal(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-7xl flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <img 
               src={customerScreenshots[activeCustomerSlide]} 
               alt={`Customer View ${activeCustomerSlide + 1}`} 
               className="max-h-[85vh] w-auto rounded-3xl shadow-2xl" 
             />

             <button onClick={prevCustomerSlide} className="absolute left-2 md:left-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition">
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button onClick={nextCustomerSlide} className="absolute right-2 md:right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition">
                <ChevronRight className="w-8 h-8" />
             </button>

             {/* Dots */}
             <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
               {customerScreenshots.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i === activeCustomerSlide ? 'bg-white' : 'bg-white/30'}`} />
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Admin Modal (Carousel) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowAdminModal(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-7xl flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <img 
               src={adminScreenshots[activeAdminSlide]} 
               alt={`Admin View ${activeAdminSlide + 1}`} 
               className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl" 
             />
             
             <button onClick={prevAdminSlide} className="absolute left-2 md:left-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition">
                <ChevronLeft className="w-8 h-8" />
             </button>
             <button onClick={nextAdminSlide} className="absolute right-2 md:right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition">
                <ChevronRight className="w-8 h-8" />
             </button>

             {/* Dots */}
             <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
               {adminScreenshots.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i === activeAdminSlide ? 'bg-white' : 'bg-white/30'}`} />
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowStaffModal(false)}>
           <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-7xl flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <img src="/screenshots/staff_dashboard_1.png" alt="Staff Portal Full" className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

    </section>
  );
}
