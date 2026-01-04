import React, { useState } from 'react';
import { 
  QrCode, Utensils, ShoppingCart, Activity, Heart, 
  UserPlus, Store, PlusCircle, BarChart3, 
  LogIn, Bell, RefreshCcw, HandMetal, Coffee
} from 'lucide-react';

type Role = 'customer' | 'owner' | 'staff';

const roleContent = {
  customer: {
    title: "How it works for Customers",
    desc: "A seamless ordering experience without downloading any app.",
    steps: [
      { icon: <QrCode className="w-8 h-8 text-blue-600" />, title: "Scan QR", desc: "Scan the unique QR code on your table to open the digital menu." },
      { icon: <Utensils className="w-8 h-8 text-indigo-600" />, title: "Browse Menu", desc: "Explore categories and dishes with beautiful photos and descriptions." },
      { icon: <ShoppingCart className="w-8 h-8 text-purple-600" />, title: "Place Order", desc: "Add items to your cart and place your order instantly from your phone." },
      { icon: <Activity className="w-8 h-8 text-pink-600" />, title: "Track Status", desc: "Watch your order move from 'Cooking' to 'Ready' in real-time." },
      { icon: <Heart className="w-8 h-8 text-red-600" />, title: "Enjoy", desc: "Relax and enjoy your meal while we handle the rest." },
    ]
  },
  owner: {
    title: "How it works for Owners",
    desc: "Get your restaurant digital and start taking orders in minutes.",
    steps: [
      { icon: <UserPlus className="w-8 h-8 text-blue-600" />, title: "Sign Up", desc: "Create your account and register your restaurant details easily." },
      { icon: <Store className="w-8 h-8 text-indigo-600" />, title: "Setup", desc: "Configure your restaurant settings, logo, and operating hours." },
      { icon: <PlusCircle className="w-8 h-8 text-purple-600" />, title: "Create Menu", desc: "Build your digital menu with categories, dishes, and pricing." },
      { icon: <QrCode className="w-8 h-8 text-pink-600" />, title: "Generate QRs", desc: "Instantly generate and print unique QR codes for every table." },
      { icon: <BarChart3 className="w-8 h-8 text-red-600" />, title: "View Analytics", desc: "Monitor sales trends and popular items from your dashboard." },
    ]
  },
  staff: {
    title: "How it works for Staff",
    desc: "Streamline operations with live updates and instant alerts.",
    steps: [
      { icon: <LogIn className="w-8 h-8 text-blue-600" />, title: "Log In", desc: "Staff members log in to access the live operations dashboard." },
      { icon: <Bell className="w-8 h-8 text-indigo-600" />, title: "Get Alerts", desc: "Receive instant notifications for new orders and table assistance requests." },
      { icon: <RefreshCcw className="w-8 h-8 text-purple-600" />, title: "Manage Status", desc: "Update order status (Cooking -> Ready -> Served) with a single tap." },
      { icon: <HandMetal className="w-8 h-8 text-pink-600" />, title: "Waiter Bell", desc: "Respond to table calls for water, napkins, or the bill immediately." },
      { icon: <Coffee className="w-8 h-8 text-red-600" />, title: "Efficiency", desc: "Reduce foot traffic and errors with a clear operational workflow." },
    ]
  }
};

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState<Role>('customer');

  return (
    <section id="howitworks" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Process Flow</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">How It Works</h2>
          
          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mt-12 bg-gray-50 p-2 rounded-[32px] max-w-2xl mx-auto border border-gray-100 shadow-sm">
            {(['customer', 'owner', 'staff'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-8 py-3 rounded-[24px] text-sm font-black transition-all duration-300 capitalize ${
                  activeRole === role 
                    ? 'bg-white text-blue-600 shadow-xl shadow-blue-600/10 border border-blue-50' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                For {role === 'owner' ? 'Owners' : role}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{roleContent[activeRole].title}</h3>
            <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              {roleContent[activeRole].desc}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {roleContent[activeRole].steps.map((step, idx) => (
              <div 
                key={`${activeRole}-${idx}`} 
                className="group bg-white p-4 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 hover:-translate-y-2 relative"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 md:w-10 md:h-10 bg-gray-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-lg shadow-lg group-hover:bg-blue-600 transition-colors duration-500">
                  {idx + 1}
                </div>

                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-500">
                  {React.cloneElement(step.icon as React.ReactElement<any>, { 
                    className: `w-6 h-6 md:w-8 md:h-8 ${(step.icon as React.ReactElement<any>).props.className.split(' ').filter((c: string) => !c.startsWith('w-') && !c.startsWith('h-')).join(' ')}`
                  })}
                </div>
                
                <h4 className="text-sm md:text-xl font-black text-gray-900 mb-2 md:mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h4>
                
                <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest animate-pulse">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Ready to start?
          </div>
        </div>
      </div>
    </section>
  );
}
