// src/routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import RestaurantMenu from '../pages/Menu/RestaurantMenu';
import StaffDashboard from '../pages/Staff/Dashboard';
import NavBar from '../components/NavBar';
import ProtectedRoute from '../components/ProtectedRoutes';

export default function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/menu/demo" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
        {/* <Route path="/menu/demo" element={<RestaurantMenu />} /> */}

        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['ADMIN', 'STAFF']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div className="p-6">404 - Not Found</div>} />
      </Routes>
    </>
  );
}
