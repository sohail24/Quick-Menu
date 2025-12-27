import React from 'react';
import { Target, Zap, TrendingUp, Rocket, ShieldCheck, Heart } from 'lucide-react';

const reasons = [
  {
    icon: <Rocket className="w-8 h-8 text-blue-600" />,
    title: 'Fast & Simple Setup',
    desc: 'No tech skills required! Get your digital menu ready in just a few minutes.'
  },
  {
    icon: <BellRing className="w-8 h-8 text-indigo-600" />,
    title: 'Instant Notifications',
    desc: 'Get real-time order alerts straight to your phone or laptop. Never miss a customer.'
  },
  {
    icon: <Target className="w-8 h-8 text-purple-600" />,
    title: 'Easy to Use',
    desc: 'No apps for guests to download. Just scan the QR and they are ready to order.'
  },
  {
    icon: <Zap className="w-8 h-8 text-blue-500" />,
    title: 'Quick Updates',
    desc: 'Change prices or add new dishes instantly. Your menu is always up to date.'
  }
];

import { BellRing } from 'lucide-react';

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          <div className="lg:w-1/2">
            <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Personal Project</span>
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight leading-tight">
              Why choose <span className="text-blue-400">QuickMenu</span>?
            </h2>
            <p className="text-gray-400 text-xl font-medium leading-relaxed mb-12">
              Simple, fast, and built to make your restaurant life easier. No fancy enterprise jargon, just a tool that works.
            </p>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg">Safe & Reliable</span>
               </div>
               <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                     <Heart className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-lg">Friendly Support</span>
               </div>
            </div>
          </div>

          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map((reason, idx) => (
              <div key={idx} className="p-8 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-500 group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {reason.icon}
                </div>
                <h3 className="text-xl font-black mb-4 tracking-tight group-hover:text-blue-400 transition-colors">
                  {reason.title}
                </h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  {reason.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
