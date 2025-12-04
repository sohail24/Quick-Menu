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
import AdminCreateRestaurant from '../pages/Admin/AdminCreateRestaurant';
import AdminLayout from '../layouts/AdminLayout';
import AdminOverview from '../pages/Admin/AdminOverview';
import AdminRestaurants from '../pages/Admin/AdminRestaurants';
import AdminOrders from '../pages/Admin/AdminOrders';
import AdminAnalytics from '../pages/Admin/AdminAnalytics';
import AdminRestaurantDetail from '../pages/Admin/AdminRestaurantDetail';

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
        {/* AppRoutes or AdminRoutes */}
        <Route
          path="/admin/create-restaurant"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminCreateRestaurant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="restaurants/create" element={<AdminCreateRestaurant />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          {/* add more nested routes as needed */}
          <Route path="restaurants/:id" element={<AdminRestaurantDetail />} />
        </Route>
      </Routes>
    </>
  );
}
