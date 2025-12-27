import React from 'react';
import { QrCode, Layout, Activity, BarChart3, BellRing, ShieldCheck, Zap, Smartphone, Palette } from 'lucide-react';

const features = [
  {
    icon: <QrCode className="w-6 h-6" />,
    title: 'Precision QR System',
    desc: 'Table-specific codes for instant menu access and pinpoint service accuracy.',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: 'Smart Menu Builder',
    desc: 'Categorize dishes, add rich photos, and update prices in real-time with ease.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: 'Live Order Tracker',
    desc: 'Keep guests engaged with real-time status updates from kitchen to table.',
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Powerful Analytics',
    desc: 'Visualize sales performance and peak hours to optimize your operations.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    icon: <BellRing className="w-6 h-6" />,
    title: 'Instant Service Bell',
    desc: 'One-tap waiter call system that alerts staff dashboards immediately.',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Reliable Control',
    desc: 'A robust staff dashboard for seamless order management and status control.',
    color: 'text-red-600',
    bg: 'bg-red-50'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest mb-6">
               <Zap className="w-4 h-4 fill-current" />
               Handy Tools
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Everything you need for a <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">modern menu</span>
            </h2>
            
            <p className="text-xl text-gray-500 mb-12 leading-relaxed font-medium">
              Say goodbye to messy paper menus. QuickMenu gives you simple, easy-to-use digital tools to manage your restaurant and keep your customers happy.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {features.map((feat, idx) => (
                <div key={idx} className="group flex flex-col items-start p-2 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 rounded-3xl transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mb-4 transition-all duration-300 group-hover:scale-110 ${feat.bg} ${feat.color}`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">{feat.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[48px] rotate-2 opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 bg-white p-4 rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1555396273-367ea4ec4db0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                 alt="Digital Dining Experience" 
                 className="rounded-[32px] w-full h-[600px] object-cover hover:scale-105 transition duration-700"
               />
               {/* Floating Badge */}
               <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-xl">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                        <Smartphone className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-gray-900 font-black tracking-tight">Optimized for Mobile</div>
                        <div className="text-gray-500 text-sm font-medium">No app required for guests.</div>
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
