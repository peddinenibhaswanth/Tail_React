import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";

// Public Pages
import Home from "../pages/Home";
import About from "../pages/About";
import Contact from "../pages/Contact";

// Pet Pages
import PetList from "../pages/Pets/PetList";
import PetDetail from "../pages/Pets/PetDetail";

// Product Pages
import ProductList from "../pages/Products/ProductList";
import ProductDetail from "../pages/Products/ProductDetail";

// Cart & Checkout
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import OrderSuccess from "../pages/Checkout/OrderSuccess";

// Orders
import OrderList from "../pages/Orders/OrderList";
import OrderDetail from "../pages/Orders/OrderDetail";

// Appointments
import BookAppointment from "../pages/Appointments/BookAppointment";
import AppointmentList from "../pages/Appointments/AppointmentList";
import MyAppointments from "../pages/Appointments/MyAppointments";

// Dashboard
import CustomerDashboard from "../pages/Dashboard/CustomerDashboard";
import SellerDashboard from "../pages/Dashboard/SellerDashboard";
import VetDashboard from "../pages/Dashboard/VetDashboard";
import Profile from "../pages/Auth/Profile";

// Admin Pages
import AdminDashboard from "../pages/Admin/AdminDashboard";
import PetManagement from "../pages/Admin/PetManagement";
import ProductManagement from "../pages/Admin/ProductManagement";
import UserManagement from "../pages/Admin/UserManagement";
import ApplicationManagement from "../pages/Admin/ApplicationManagement";
import MessageManagement from "../pages/Admin/MessageManagement";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleRoute from "../components/common/RoleRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Pet Routes */}
      <Route path="/pets" element={<PetList />} />
      <Route path="/pets/:id" element={<PetDetail />} />

      {/* Product Routes */}
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />

      {/* Cart */}
      <Route path="/cart" element={<CartPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/appointments" element={<AppointmentList />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/vet-dashboard" element={<VetDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleRoute allowedRoles={["admin", "co-admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/pets" element={<PetManagement />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/applications" element={<ApplicationManagement />} />
        <Route path="/admin/messages" element={<MessageManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
