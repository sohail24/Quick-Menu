// src/components/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUIStore } from '../app/store';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users, 
  Grid, 
  List, 
  PlusCircle, 
  LayoutGrid,
  X 
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, end = false, onClick }: any) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`
    }
  >
    <Icon className="w-5 h-5 opacity-75" />
    <span>{label}</span>
  </NavLink>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="px-3 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
    {label}
  </div>
);

export default function AdminSidebar() {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[50] md:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[60] md:z-40 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QuickMenu Admin
          </div>
          <button onClick={closeSidebar} className="md:hidden text-gray-400 hover:text-gray-600 transition">
             <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem to="/admin" icon={LayoutDashboard} label="Overview" end onClick={closeSidebar} />
          <NavItem to="/admin/analytics" icon={BarChart3} label="Analytics" onClick={closeSidebar} />
          
          <SectionLabel label="Operations" />
          <NavItem to="/admin/orders" icon={ShoppingCart} label="Live Orders" onClick={closeSidebar} />
          <NavItem to="/admin/restaurants" icon={List} label="Restaurants" onClick={closeSidebar} />
          
          <SectionLabel label="Menu Management" />
          <NavItem to="/admin/dishes" icon={UtensilsCrossed} label="Dishes" onClick={closeSidebar} />
          <NavItem to="/admin/categories" icon={LayoutGrid} label="Categories" onClick={closeSidebar} />
          <NavItem to="/admin/tables" icon={Grid} label="Tables" onClick={closeSidebar} />
          
          <SectionLabel label="Organization" />
          <NavItem to="/admin/staff" icon={Users} label="Staff Members" onClick={closeSidebar} />
          <NavItem to="/admin/restaurants/create" icon={PlusCircle} label="Add Restaurant" onClick={closeSidebar} />
          
          <SectionLabel label="Settings" />
          <NavItem to="/admin/settings" icon={Settings} label="Account & Plans" onClick={closeSidebar} />
        </nav>

        {/* Footer User Info (Optional placeholder) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              AD
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">admin@quickmenu.com</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
