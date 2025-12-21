// src/components/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUIStore } from '../app/store';

const LinkItem = ({
  to,
  end,
  children,
  onClick,
}: {
  to: string;
  end: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-3 py-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-semibold' : 'text-gray-700'}`
    }
    end={end}
  >
    {children}
  </NavLink>
);

export default function AdminSidebar() {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[60] md:z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <div className="text-lg font-bold">QuickMenu Admin</div>
            <div className="text-xs text-gray-500 mt-1">Manage restaurants & analytics</div>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="p-2 space-y-1">
          <LinkItem to="/admin" end onClick={closeSidebar}>
            Overview
          </LinkItem>
          <LinkItem to="/admin/restaurants" end onClick={closeSidebar}>
            Restaurants
          </LinkItem>
          <LinkItem to="/admin/orders" end onClick={closeSidebar}>
            Orders
          </LinkItem>
          <LinkItem to="/admin/analytics" end onClick={closeSidebar}>
            Analytics
          </LinkItem>
          <LinkItem to="/admin/uploads" end onClick={closeSidebar}>
            Uploads
          </LinkItem>
          <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Management</div>
          <LinkItem to="/admin/restaurants/create" end onClick={closeSidebar}>
            Create restaurant
          </LinkItem>
          <LinkItem to="/admin/tables" end onClick={closeSidebar}>
            Tables
          </LinkItem>
          <LinkItem to="/admin/categories" end onClick={closeSidebar}>
            Categories
          </LinkItem>
          <LinkItem to="/admin/dishes" end onClick={closeSidebar}>
            Dishes
          </LinkItem>
          <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Staff Management</div>
          <LinkItem to="/admin/staff" end onClick={closeSidebar}>
            Staff Management
          </LinkItem>
          <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Settings</div>
          <LinkItem to="/admin/settings" end onClick={closeSidebar}>
            Account & Plans
          </LinkItem>
        </nav>
      </aside>
    </>
  );
}
