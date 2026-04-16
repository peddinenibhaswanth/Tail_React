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
import AdoptionApplication from "../pages/Pets/AdoptionApplication";
import MyApplications from "../pages/Pets/MyApplications";

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
import SellerOrders from "../pages/Orders/SellerOrders";

// Appointments
import BookAppointment from "../pages/Appointments/BookAppointment";
import AppointmentList from "../pages/Appointments/AppointmentList";
import MyAppointments from "../pages/Appointments/MyAppointments";
import AppointmentDetail from "../pages/Appointments/AppointmentDetail";

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
import OrderManagement from "../pages/Admin/OrderManagement";

// Product Form (for adding/editing)
import ProductForm from "../pages/Products/ProductForm";

// Pet Form (for adding/editing)
import PetForm from "../pages/Pets/PetForm";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleRoute from "../components/common/RoleRoute";

// Dashboard redirect component based on role
const DashboardRedirect = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
    case "co-admin":
      return <Navigate to="/admin" replace />;
    case "seller":
      return <SellerDashboard />;
    case "veterinary":
      return <VetDashboard />;
    case "customer":
    default:
      return <CustomerDashboard />;
  }
};

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
      <Route path="/products/new" element={<ProductForm />} />
      <Route path="/products/edit/:id" element={<ProductForm />} />

      {/* Cart */}
      <Route path="/cart" element={<CartPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard - redirects based on role */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Adoption Application */}
        <Route path="/pets/:id/apply" element={<AdoptionApplication />} />

        {/* Customer Routes */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/appointments" element={<MyAppointments />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/:id/view" element={<AppointmentDetail />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Seller Routes */}
      <Route
        element={<RoleRoute allowedRoles={["seller", "admin", "co-admin"]} />}
      >
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/products" element={<ProductManagement />} />
        <Route path="/seller/products/add" element={<ProductForm />} />
        <Route path="/seller/products/edit/:id" element={<ProductForm />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
      </Route>

      {/* Veterinary Routes */}
      <Route
        element={
          <RoleRoute allowedRoles={["veterinary", "admin", "co-admin"]} />
        }
      >
        <Route path="/vet/dashboard" element={<VetDashboard />} />
        <Route path="/vet/appointments" element={<AppointmentList />} />
        <Route path="/vet/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/vet/history" element={<AppointmentList />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleRoute allowedRoles={["admin", "co-admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/pets" element={<PetManagement />} />
        <Route path="/admin/pets/new" element={<PetForm />} />
        <Route path="/admin/pets/:id/edit" element={<PetForm />} />
        <Route path="/pets/new" element={<PetForm />} />
        <Route path="/pets/:id/edit" element={<PetForm />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/products/new" element={<ProductForm />} />
        <Route path="/admin/products/:id/edit" element={<ProductForm />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/applications" element={<ApplicationManagement />} />
        <Route path="/admin/messages" element={<MessageManagement />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/appointments" element={<AppointmentList />} />
        <Route path="/admin/co-admins" element={<UserManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
