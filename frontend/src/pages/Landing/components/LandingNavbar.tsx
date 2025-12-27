import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../app/store';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');
  const dashboardPath = isAdmin ? '/admin' : '/staff';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          QuickMenu
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('howitworks')} className={`${scrolled ? 'text-gray-600' : 'text-gray-700'} hover:text-blue-600 font-medium transition`}>How it Works</button>
          <button onClick={() => scrollTo('features')} className={`${scrolled ? 'text-gray-600' : 'text-gray-700'} hover:text-blue-600 font-medium transition`}>Features</button>
          <button onClick={() => scrollTo('about')} className={`${scrolled ? 'text-gray-600' : 'text-gray-700'} hover:text-blue-600 font-medium transition`}>About</button>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 leading-none mb-1">Welcome back</span>
                <span className="text-xs font-black text-gray-900 leading-none">
                  {user?.name || user?.email || 'Member'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link to={dashboardPath}>
                  <Button size="sm" variant="ghost" className="flex items-center gap-2 border-none">
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span className="font-bold">{isAdmin ? 'Admin' : 'Staff'} Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => logout()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className={scrolled ? '' : 'text-gray-800'}>Log In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
