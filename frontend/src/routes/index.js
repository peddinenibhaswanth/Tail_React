import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";

// Public Pages
import Home from "../pages/Home/Home";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";

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
import AppointmentBooking from "../pages/Appointments/AppointmentBooking";
import AppointmentList from "../pages/Appointments/AppointmentList";

// Dashboard
import UserDashboard from "../pages/Dashboard/UserDashboard";
import Profile from "../pages/Dashboard/Profile";
import MyApplications from "../pages/Dashboard/MyApplications";

// Admin Pages
import AdminDashboard from "../pages/Admin/AdminDashboard";
import ManagePets from "../pages/Admin/ManagePets";
import ManageProducts from "../pages/Admin/ManageProducts";
import ManageOrders from "../pages/Admin/ManageOrders";
import ManageAppointments from "../pages/Admin/ManageAppointments";
import ManageApplications from "../pages/Admin/ManageApplications";
import ManageUsers from "../pages/Admin/ManageUsers";

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
        <Route path="/appointments/book" element={<AppointmentBooking />} />
        <Route path="/appointments" element={<AppointmentList />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-applications" element={<MyApplications />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleRoute allowedRoles={["admin", "co-admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/pets" element={<ManagePets />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/appointments" element={<ManageAppointments />} />
        <Route path="/admin/applications" element={<ManageApplications />} />
        <Route path="/admin/users" element={<ManageUsers />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
