import React from 'react';
import { ChefHat, Bell, Clock, CheckCircle2, ListChecks, MessageSquare, Flame } from 'lucide-react';

export default function StaffDemo() {
  return (
    <section id="staff-demo" className="py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Visual Demo / Mock UI */}
          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-600/10 to-blue-600/10 rounded-full blur-[100px] opacity-70"></div>
            
            <div className="relative bg-white rounded-[40px] border border-gray-200 shadow-2xl p-8 overflow-hidden">
              {/* Image Placeholder Overlay */}
              <div className="absolute inset-4 z-20 bg-gray-50/10 backdrop-blur-[2px] border-2 border-dashed border-gray-300 rounded-[32px] flex items-center justify-center group/img">
                <div className="text-center p-6 bg-white/90 rounded-3xl shadow-xl border border-gray-100 group-hover/img:scale-105 transition-transform duration-500">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <ChefHat className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-black text-gray-900 mb-1">Staff Dashboard Screenshot</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Replace this with your actual UI image</div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <ChefHat className="w-5 h-5"/>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900">Live Orders</h4>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  <Flame className="w-4 h-4 fill-current"/>
                  Live Now
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { table: 'Table 04', items: '2x Margherita, 1x Cola', time: '2 mins ago', status: 'Cooking', color: 'text-orange-500 bg-orange-50' },
                  { table: 'Table 12', items: '1x Pasta, 1x Wine', time: '5 mins ago', status: 'Ready', color: 'text-green-600 bg-green-50' },
                  { table: 'Table 07', items: '3x Burger Combo', time: 'New', status: 'Placed', color: 'text-blue-600 bg-blue-50' },
                ].map((order, i) => (
                  <div key={i} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-gray-900 border border-gray-100 shadow-sm">
                        {order.table.split(' ')[1]}
                      </div>
                      <div>
                        <div className="text-xs font-black text-gray-900">{order.table}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{order.items}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3"/> {order.time}
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.color}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Waiter Notifications Bubble */}
              <div className="mt-8 relative pt-8 border-t border-gray-100">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Waiter Alerts</div>
                <div className="flex flex-col gap-3">
                  <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-lg shadow-indigo-600/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 animate-bounce"/>
                      <span className="text-xs font-bold">Table 05 needs assistance!</span>
                    </div>
                    <span className="text-[9px] font-black opacity-60">JUST NOW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-1/2">
            <span className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Speed & Efficiency</span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Real-time <span className="text-indigo-600">Staff View</span> for Busy Kitchens
            </h2>
            
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">
              Empower your staff with a live stream of incoming orders. 
              Status updates sync instantly with the customer's phone, keeping everyone in the loop without the shouting.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 shadow-lg shadow-indigo-200/50">
                  <ListChecks className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Live Order Stream</h3>
                  <p className="text-gray-500 font-medium">Orders appear as they are placed. Hear audible alerts for new orders so your team never misses a beat.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-lg shadow-blue-200/50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">One-Tap Prep Status</h3>
                  <p className="text-gray-500 font-medium">Move orders from 'Placed' to 'Served' with one tap. Customers get notified immediately on their phones.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 text-orange-600 shadow-lg shadow-orange-200/50">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Instant Waiter Bell</h3>
                  <p className="text-gray-500 font-medium">Get notified immediately when a table needs help or is ready for the bill. Professional service made simple.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
