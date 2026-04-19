import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Components (keep eager - used on every route)
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleRoute from "../components/common/RoleRoute";

// ── Eager imports (core pages – no lazy-load spinner) ──
import Home from "../pages/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ProductList from "../pages/Products/ProductList";
import ProductDetail from "../pages/Products/ProductDetail";
import PetList from "../pages/Pets/PetList";
import PetDetail from "../pages/Pets/PetDetail";
import CartPage from "../pages/Cart/CartPage";
import Profile from "../pages/Auth/Profile";

// ── Lazy-loaded pages (less frequently visited) ──
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const OAuthCallback = lazy(() => import("../pages/Auth/OAuthCallback"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));
const AdoptionApplication = lazy(() => import("../pages/Pets/AdoptionApplication"));
const MyApplications = lazy(() => import("../pages/Pets/MyApplications"));
const CheckoutPage = lazy(() => import("../pages/Checkout/CheckoutPage"));
const OrderSuccess = lazy(() => import("../pages/Checkout/OrderSuccess"));
const OrderList = lazy(() => import("../pages/Orders/OrderList"));
const OrderDetail = lazy(() => import("../pages/Orders/OrderDetail"));
const SellerOrders = lazy(() => import("../pages/Orders/SellerOrders"));
const BookAppointment = lazy(() => import("../pages/Appointments/BookAppointment"));
const AppointmentList = lazy(() => import("../pages/Appointments/AppointmentList"));
const MyAppointments = lazy(() => import("../pages/Appointments/MyAppointments"));
const AppointmentDetail = lazy(() => import("../pages/Appointments/AppointmentDetail"));
const CustomerDashboard = lazy(() => import("../pages/Dashboard/CustomerDashboard"));
const SellerDashboard = lazy(() => import("../pages/Dashboard/SellerDashboard"));
const VetDashboard = lazy(() => import("../pages/Dashboard/VetDashboard"));
const OrganizationDashboard = lazy(() => import("../pages/Dashboard/OrganizationDashboard"));
const Notifications = lazy(() => import("../pages/Notifications"));
const AdminDashboard = lazy(() => import("../pages/Admin/AdminDashboard"));
const CoAdminDashboard = lazy(() => import("../pages/Admin/CoAdminDashboard"));
const PetManagement = lazy(() => import("../pages/Admin/PetManagement"));
const ProductManagement = lazy(() => import("../pages/Admin/ProductManagement"));
const UserManagement = lazy(() => import("../pages/Admin/UserManagement"));
const ApplicationManagement = lazy(() => import("../pages/Admin/ApplicationManagement"));
const MessageManagement = lazy(() => import("../pages/Admin/MessageManagement"));
const OrderManagement = lazy(() => import("../pages/Admin/OrderManagement"));
const RevenueBreakdown = lazy(() => import("../pages/Admin/RevenueBreakdown"));
const ProductForm = lazy(() => import("../pages/Products/ProductForm"));
const PetForm = lazy(() => import("../pages/Pets/PetForm"));

// Slim top progress bar for remaining lazy chunks (replaces full-screen spinner)
const LazyFallback = () => (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100%", zIndex: 9999,
    height: 3, background: "linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #2563eb 100%)",
    backgroundSize: "200% 100%",
    animation: "lazyBarSlide 1.2s ease-in-out infinite"
  }} />
);

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
    case "organization":
      return <OrganizationDashboard />;
    case "customer":
    default:
      return <CustomerDashboard />;
  }
};

// Admin dashboard switch - shows different dashboard based on role
const AdminDashboardSwitch = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.role === "co-admin") {
    return <CoAdminDashboard />;
  }
  return <AdminDashboard />;
};

// Wrapper that redirects non-customer authenticated users away from public pages
const PublicPageGuard = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.role && user.role !== "customer") {
    // Redirect non-customers to their dashboard
    switch (user.role) {
      case "admin":
      case "co-admin":
        return <Navigate to="/admin" replace />;
      case "seller":
        return <Navigate to="/seller/dashboard" replace />;
      case "veterinary":
        return <Navigate to="/vet/dashboard" replace />;
      case "organization":
        return <Navigate to="/organization/dashboard" replace />;
      default:
        break;
    }
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<LazyFallback />}>
    <Routes>
      {/* Public Routes - only accessible to customers and non-logged in users */}
      <Route path="/" element={<PublicPageGuard><Home /></PublicPageGuard>} />
      <Route path="/about" element={<PublicPageGuard><About /></PublicPageGuard>} />
      <Route path="/contact" element={<PublicPageGuard><Contact /></PublicPageGuard>} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

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

        {/* Customer-only Routes */}
        <Route element={<RoleRoute allowedRoles={["customer"]} />}>
          <Route path="/pets/:id/apply" element={<AdoptionApplication />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/appointments" element={<MyAppointments />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/applications" element={<MyApplications />} />
          <Route path="/my-applications" element={<MyApplications />} />
        </Route>

        {/* General protected routes (any authenticated user) */}
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/:id/view" element={<AppointmentDetail />} />
        <Route path="/notifications" element={<Notifications />} />
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

      {/* Organization Routes */}
      <Route
        element={
          <RoleRoute allowedRoles={["organization", "admin", "co-admin"]} />
        }
      >
        <Route
          path="/organization/dashboard"
          element={<OrganizationDashboard />}
        />
        <Route path="/organization/pets" element={<PetManagement />} />
        <Route path="/organization/pets/new" element={<PetForm />} />
        <Route path="/organization/pets/:id/edit" element={<PetForm />} />
        <Route path="/organization/applications" element={<ApplicationManagement />} />
      </Route>

      {/* Admin & Co-Admin Routes */}
      <Route element={<RoleRoute allowedRoles={["admin", "co-admin"]} />}>
        <Route path="/admin" element={<AdminDashboardSwitch />} />
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
      </Route>

      {/* Admin-only Routes (revenue, co-admin management) */}
      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/revenue-breakdown" element={<RevenueBreakdown />} />
        <Route path="/admin/co-admins" element={<UserManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
