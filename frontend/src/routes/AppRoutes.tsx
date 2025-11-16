import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Signup from '../pages/Auth/Signup';
import RestaurantMenu from '../pages/Menu/RestaurantMenu';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/menu/demo" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/menu/:restaurantId" element={<RestaurantMenu />} />
      <Route path="/menu/demo" element={<RestaurantMenu />} />
      {/* add protected staff/admin routes later */}
    </Routes>
  );
}
