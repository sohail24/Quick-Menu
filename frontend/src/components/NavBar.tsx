// src/components/NavBar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../app/store';

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

  return (
    <nav className="bg-white shadow px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {isAdmin && (
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1 rounded hover:bg-gray-100"
            aria-label="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link to="/" className="font-bold text-lg">
          Quick Menu
        </Link>
        <Link to="/menu/demo" className="text-sm text-gray-600">
          Menu (demo)
        </Link>
        {token && !isAdmin && (
          <Link to="/staff" className="text-sm text-gray-600">
            Staff
          </Link>
        )}
        {token && isAdmin && (
          <Link to="/admin" className="text-sm text-gray-600">
            Admin Dashboard
          </Link>
        )}
      </div>
      <div>
        {token ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 hidden sm:inline">
              Hi, {(user as any)?.name ?? (user as any)?.email ?? 'Staff'}
            </span>
            <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="text-sm text-gray-700">
              Login
            </Link>
            <Link to="/signup" className="text-sm text-gray-700">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
