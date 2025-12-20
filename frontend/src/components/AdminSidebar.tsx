// src/components/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const LinkItem = ({
  to,
  end,
  children,
}: {
  to: string;
  end: boolean;
  children: React.ReactNode;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-3 py-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-semibold' : 'text-gray-700'}`
    }
    end={end}
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
        <LinkItem to="/admin" end>
          Overview
        </LinkItem>
        <LinkItem to="/admin/restaurants" end>
          Restaurants
        </LinkItem>
        <LinkItem to="/admin/orders" end>
          Orders
        </LinkItem>
        <LinkItem to="/admin/analytics" end>
          Analytics
        </LinkItem>
        <LinkItem to="/admin/uploads" end>
          Uploads
        </LinkItem>
        <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Management</div>
        <LinkItem to="/admin/restaurants/create" end>
          Create restaurant
        </LinkItem>
        <LinkItem to="/admin/tables" end>
          Tables
        </LinkItem>
        <LinkItem to="/admin/categories" end>
          Categories
        </LinkItem>
        <LinkItem to="/admin/dishes" end>
          Dishes
        </LinkItem>
        <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Staff Management</div>
        <LinkItem to="/admin/staff" end>
          Staff Management
        </LinkItem>
        <div className="mt-3 border-t pt-2 text-xs text-gray-500 px-2">Settings</div>
        <LinkItem to="/admin/settings" end>
          Account & Plans
        </LinkItem>
      </nav>
    </aside>
  );
}
