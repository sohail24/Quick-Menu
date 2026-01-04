import React from 'react';
import { Home, Workflow, Zap, User } from 'lucide-react';

interface MobileNavProps {
  activeSection: string;
}

export default function MobileNav({ activeSection }: MobileNavProps) {
  const scrollTo = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'howitworks', label: 'Workflow', icon: <Workflow className="w-5 h-5" /> },
    { id: 'features', label: 'Features', icon: <Zap className="w-5 h-5" /> },
    { id: 'about', label: 'About', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
