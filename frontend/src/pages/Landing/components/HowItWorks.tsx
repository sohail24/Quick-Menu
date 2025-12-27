import React from 'react';
import { QrCode, ClipboardList, ChefHat, Bell } from 'lucide-react';

const steps = [
  {
    icon: <ClipboardList className="w-8 h-8 text-blue-600" />,
    title: '1. Register & Create Menu',
    desc: 'Sign up in seconds and build your digital menu with photos, descriptions, and prices.'
  },
  {
    icon: <QrCode className="w-8 h-8 text-indigo-600" />,
    title: '2. Generate QR Codes',
    desc: 'Download unique QR codes for your tables. Print and place them for easy access.'
  },
  {
    icon: <ChefHat className="w-8 h-8 text-purple-600" />,
    title: '3. Scan to Order',
    desc: 'Customers scan the code to view the menu and place orders directly from their phone.'
  },
  {
    icon: <Bell className="w-8 h-8 text-pink-600" />,
    title: '4. Serve & Delight',
    desc: 'Receive orders instantly in your kitchen/bar and serve your guests with speed.'
  }
];

export default function HowItWorks() {
  return (
    <section id="howitworks" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get started in minutes. Simplify your restaurant operations with our intuitive 4-step process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center relative group">
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
              
              {/* Connector Line (Desktop) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gray-200 -z-10 -ml-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
