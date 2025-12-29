import React from 'react';
import { ChefHat, Bell, Clock, CheckCircle2, ListChecks, MessageSquare, Flame, X } from 'lucide-react';
import { useState } from 'react';

export default function StaffDemo() {
  const [showModal, setShowModal] = useState(false);
  return (
    <section id="staff-demo" className="py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Visual Demo / Mock UI */}
          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-600/10 to-blue-600/10 rounded-full blur-[100px] opacity-70"></div>
            
            <div className="relative bg-white rounded-[24px] border border-gray-200 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
              <div className="aspect-[16/10] bg-gray-50">
                 <img 
                    src="/screenshots/staff_dashboard_1.png" 
                    alt="Staff Dashboard Interface" 
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setShowModal(true)}
                 />
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
          
          <div className="relative w-full max-w-7xl max-h-full flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
             <img 
               src="/screenshots/staff_dashboard_1.png" 
               alt="Full size staff view" 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
             />
          </div>
        </div>
      )}
    </section>
  );
}
