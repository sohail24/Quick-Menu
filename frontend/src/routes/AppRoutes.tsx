// src/routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import RestaurantMenu from '../pages/Menu/RestaurantMenu';
import StaffDashboard from '../pages/Staff/Dashboard';
import NavBar from '../components/NavBar';
import ProtectedRoute from '../components/ProtectedRoutes';
import OrderSuccess from '../pages/Order/OrderSuccess';

export default function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/menu/demo" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* public menu */}
        <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
        <Route path="/menu" element={<Navigate to="/menu/demo" replace />} />
        {/* <Route path="/menu/demo" element={<RestaurantMenu />} /> */}

        {/* staff (protected) */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['ADMIN', 'STAFF']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* order success */}
        <Route path="/order/success/:id" element={<OrderSuccess />} />

        <Route path="*" element={<div className="p-6">404 - Not Found</div>} />
      </Routes>
    </>
  );
}
