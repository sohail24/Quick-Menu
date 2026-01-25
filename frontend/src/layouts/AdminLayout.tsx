// src/layouts/AdminLayout.tsx
import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
