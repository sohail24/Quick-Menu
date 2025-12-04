// src/components/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const LinkItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-3 py-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-semibold' : 'text-gray-700'}`
    }
  >
    {children}
  </NavLink>
);

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r hidden md:block">
      <div className="p-4 border-b">
        <div className="text-lg font-bold">QuickMenu Admin</div>
        <div className="text-xs text-gray-500 mt-1">Manage restaurants & analytics</div>
      </div>

      <nav className="p-2 space-y-1">
        <LinkItem to="/admin">Overview</LinkItem>
        <LinkItem to="/admin/restaurants">Restaurants</LinkItem>
        <LinkItem to="/admin/restaurants/create">Create restaurant</LinkItem>
        <LinkItem to="/admin/orders">Orders</LinkItem>
        <LinkItem to="/admin/analytics">Analytics</LinkItem>
        <LinkItem to="/admin/uploads">Uploads</LinkItem>
        <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Settings</div>
        <LinkItem to="/admin/settings">Account & Plans</LinkItem>
      </nav>
    </aside>
  );
}
