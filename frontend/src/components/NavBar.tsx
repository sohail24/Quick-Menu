// src/components/NavBar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../app/store';

export default function NavBar() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white shadow px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">
          Quick Menu
        </Link>
        <Link to="/menu/demo" className="text-sm text-gray-600">
          Menu (demo)
        </Link>
        {token && (
          <Link to="/staff" className="text-sm text-gray-600">
            Staff
          </Link>
        )}
      </div>
      <div>
        {token ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Hi, {(user as any)?.name ?? (user as any)?.email ?? 'Staff'}
            </span>
            <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded">
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
