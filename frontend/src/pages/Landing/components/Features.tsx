import React from 'react';
import { QrCode, Layout, Activity, BarChart3, BellRing, ShieldCheck, Zap, Smartphone, Palette, ChefHat, LayoutDashboard } from 'lucide-react';

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-6">
        
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
             <div className="w-full bg-blue-50/50 rounded-3xl p-8 mb-8 flex items-center justify-center relative overflow-hidden h-[320px]">
                {/* Phone Mockup */}
                <div className="relative z-10 w-[160px] aspect-[9/19] bg-gray-900 rounded-[2rem] border-4 border-gray-900 overflow-hidden shadow-xl">
                   <img 
                      src="/screenshots/customer_menu_mobile.png" 
                      alt="Mobile Menu Interface" 
                      className="w-full h-full object-cover rounded-[1.8rem]"
                    />
                </div>
                <div className="absolute inset-0 bg-blue-100/50 blur-3xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-700"></div>
             </div>
             
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                <Smartphone className="w-4 h-4" />
                Customer App
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-3">Instant Ordering</h3>
             <p className="text-gray-500 font-medium leading-relaxed">
                No downloads required. Guests simply scan a QR code to view the menu and order instantly from their phone.
             </p>
          </div>

          {/* 2. Admin Section */}
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500">
             <div className="w-full bg-indigo-50/50 rounded-3xl p-8 mb-8 flex items-center justify-center relative overflow-hidden h-[320px]">
                {/* Abstract Admin UI */}
                <div className="relative z-10 w-[240px] bg-white rounded-xl shadow-xl p-3 border border-gray-100 transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                   <div className="flex gap-2 mb-3 border-b border-gray-100 pb-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex gap-2">
                         <div className="w-1/3 h-16 bg-indigo-50 rounded-lg"></div>
                         <div className="w-2/3 h-16 bg-gray-50 rounded-lg"></div>
                      </div>
                      <div className="h-20 bg-gray-50 rounded-lg"></div>
                   </div>
                   <BarChart3 className="absolute -bottom-4 -right-4 w-12 h-12 text-indigo-600 fill-indigo-100 drop-shadow-lg" />
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
             <div className="w-full bg-orange-50/50 rounded-3xl p-8 mb-8 flex items-center justify-center relative overflow-hidden h-[320px]">
                {/* Abstract Staff UI */}
                <div className="relative z-10 w-[220px] bg-white rounded-xl shadow-xl p-4 border border-gray-100 transform rotate-[5deg] group-hover:rotate-0 transition-transform duration-500">
                   <div className="flex justify-between items-center mb-4">
                      <div className="w-20 h-4 bg-gray-100 rounded"></div>
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">2m</div>
                   </div>
                   <div className="space-y-3">
                      <div className="h-8 bg-gray-50 rounded border-l-4 border-orange-500 w-full"></div>
                      <div className="h-8 bg-gray-50 rounded border-l-4 border-orange-500 w-full"></div>
                      <div className="h-8 bg-green-50 rounded border-l-4 border-green-500 w-full opacity-50"></div>
                   </div>
                   <ChefHat className="absolute -bottom-4 -left-4 w-12 h-12 text-orange-600 fill-orange-100 drop-shadow-lg" />
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
    </section>
  );
}
