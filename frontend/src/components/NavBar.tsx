// src/components/NavBar.tsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../app/store';
import { Menu, User, LogOut, LayoutDashboard, Utensils } from 'lucide-react';
import Button from './ui/Button';

export default function NavBar() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');

  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {isAdmin && isAdminPath && (
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        {isAdmin && !isAdminPath && (
          <Link
            to="/admin"
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            aria-label="Go to Dashboard"
          >
            <LayoutDashboard className="w-6 h-6" />
          </Link>
        )}
        <Link to="/" className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          QuickMenu
        </Link>
        <div className="hidden md:flex items-center gap-4 ml-4 border-l pl-4 h-6 border-gray-200">
           <Link to="/menu/demo" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
             <Utensils className="w-4 h-4" /> Demo Menu
           </Link>
           
           {token && !isAdmin && (
            <Link to="/staff" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
              <LayoutDashboard className="w-4 h-4" /> Staff Board
            </Link>
           )}
           
           {token && isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
           )}
        </div>
      </div>
      
      <div>
        {token ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <User className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline font-medium">
                {(user as any)?.name ?? (user as any)?.email ?? 'Staff'}
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to="/login">
               <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/signup">
               <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
