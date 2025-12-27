import React from 'react';
import { BarChart3, Clock, Smartphone, Zap, ShieldCheck, Palette } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    color: 'bg-amber-500',
    title: 'Lightning Fast',
    desc: 'Optimized for speed. Menus load instantly even on slow connections.'
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-white" />,
    color: 'bg-blue-500',
    title: 'Real-time Analytics',
    desc: 'Track sales, top items, and peak hours to make data-driven decisions.'
  },
  {
    icon: <Smartphone className="w-6 h-6 text-white" />,
    color: 'bg-green-500',
    title: 'Mobile First',
    desc: 'Responsive design that looks beautiful on any smartphone or tablet.'
  },
  {
    icon: <Palette className="w-6 h-6 text-white" />,
    color: 'bg-purple-500',
    title: 'Custom Branding',
    desc: 'Match your menu to your restaurant’s theme with custom colors and logos.'
  },
  {
    icon: <Clock className="w-6 h-6 text-white" />,
    color: 'bg-red-500',
    title: 'Live Updates',
    desc: 'Change prices, adding items, or mark out-of-stock instantly without reprinting.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-white" />,
    color: 'bg-indigo-500',
    title: 'Secure & Reliable',
    desc: 'Enterprise-grade security ensuring your data and orders are always safe.'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Everything you need to run a <span className="text-blue-600">smarter restaurant</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Ditch the paper menus and clunky hardware. QuickMenu gives you a powerful suite of tools to manage your restaurant efficiently while providing a superior guest experience.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-gray-200 ${feat.color}`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feat.title}</h3>
                    <p className="text-sm text-gray-500">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl rotate-3 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Restaurant Interior" 
              className="rounded-3xl shadow-2xl relative z-10 w-full hover:scale-[1.01] transition duration-500"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
