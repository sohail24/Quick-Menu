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
import AdminOrderDetail from '../pages/Admin/AdminOrderDetail';
import AdminDishEditor from '../pages/Admin/AdminDishEditor';
import AdminDishList from '../pages/Admin/AdminDishList';
import AdminCategories from '../pages/Admin/AdminCategories';
import AdminTables from '../pages/Admin/AdminTables';
import AdminQrPage from '../pages/Admin/AdminQrPage';
import RestaurantLanding from '../pages/Public/RestaurantLanding';

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
        <Route path="/r/:restaurantId" element={<RestaurantLanding />} />
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
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="dishes" element={<AdminDishList />} />
          <Route path="dishes/create" element={<AdminDishEditor />} />
          <Route path="dishes/:dishId" element={<AdminDishEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="tables" element={<AdminTables />} />
          <Route path="restaurants/:id/qr" element={<AdminQrPage />} />
        </Route>
      </Routes>
    </>
  );
}
