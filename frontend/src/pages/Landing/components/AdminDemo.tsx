import React from 'react';
import { LayoutDashboard, Utensils, BarChart3, Settings, QrCode, Plus, Search } from 'lucide-react';

export default function AdminDemo() {
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

          {/* Visual Demo / Mock UI */}
          <div className="lg:w-1/2 order-1 lg:order-2 relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-full blur-[100px] opacity-70"></div>
            
            <div className="relative bg-gray-50 rounded-[40px] border border-gray-200 shadow-2xl p-8 overflow-hidden">
              {/* Image Placeholder Overlay */}
              <div className="absolute inset-4 z-20 bg-gray-100/10 backdrop-blur-[2px] border-2 border-dashed border-gray-300 rounded-[32px] flex items-center justify-center group/img">
                <div className="text-center p-6 bg-white/90 rounded-3xl shadow-xl border border-gray-100 group-hover/img:scale-105 transition-transform duration-500">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <LayoutDashboard className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-black text-gray-900 mb-1">Admin Dashboard Screenshot</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Replace this with your actual UI image</div>
                </div>
              </div>

              {/* Fake Sidebar */}
              <div className="flex gap-8">
                <div className="w-16 hidden sm:flex flex-col gap-6 py-4 items-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><LayoutDashboard className="w-5 h-5"/></div>
                  <div className="w-10 h-10 text-gray-400 hover:text-blue-600"><Utensils className="w-5 h-5"/></div>
                  <div className="w-10 h-10 text-gray-400 hover:text-blue-600"><BarChart3 className="w-5 h-5"/></div>
                  <div className="w-10 h-10 text-gray-400 hover:text-blue-600"><QrCode className="w-5 h-5"/></div>
                  <div className="mt-auto w-10 h-10 text-gray-400 hover:text-blue-600"><Settings className="w-5 h-5"/></div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-gray-900">Menu items</h4>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20">
                      <Plus className="w-4 h-4"/> Add New
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Spicy Burger', price: '$12.99', category: 'Fast Food', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
                      { name: 'Pasta Carbonara', price: '$15.50', category: 'Italian', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80' },
                      { name: 'Chicken Salad', price: '$10.00', category: 'Health', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
                      { name: 'Veggie Pizza', price: '$14.00', category: 'Italian', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <img src={item.img} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="text-xs font-black text-gray-900">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{item.category}</div>
                        </div>
                        <div className="text-xs font-black text-blue-600">{item.price}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tiny chart mockup */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="flex justify-between items-end gap-2 h-20">
                      {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-100 rounded-t-lg relative group">
                          <div style={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-lg transition-all duration-500 group-hover:bg-blue-500"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
