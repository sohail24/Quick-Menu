import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../app/store';
import Button from '../../../components/ui/Button';

export default function Hero() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');
  const dashboardPath = isAdmin ? '/admin' : '/staff';

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>

      <div className="container mx-auto px-4 text-center max-w-4xl">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold border border-blue-100">
          🚀 The Future of Dining is Here
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Contactless Ordering for <br/>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Modern Restaurants</span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Boost efficiency and sales with our premium digital menu platform. 
          No app download required—just scan, order, and enjoy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {token ? (
            <Link to={dashboardPath} className="w-full sm:w-auto">
              <Button size="lg" className="w-full">Go to Dashboard</Button>
            </Link>
          ) : (
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">Start Free Trial</Button>
            </Link>
          )}
          <Link to="/menu/demo" className="w-full sm:w-auto">
            <Button variant="white" size="lg" className="w-full">View Demo Menu</Button>
          </Link>
        </div>

        {/* Hero Image Mockup */}
        <div className="mt-16 mx-auto max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
          <img 
            src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Dashboard" 
            className="w-full h-auto opacity-90"
          />
        </div>
      </div>
    </div>
  );
}
