import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Alert from "./components/common/Alert";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { NotificationProvider } from "./context/NotificationContext";
import { getCart } from "./redux/slices/cartSlice";
import { getCurrentUser } from "./redux/slices/authSlice";
import useAuth from "./hooks/useAuth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/custom.css";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Verify session on app load if user exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  useEffect(() => {
    // Load cart only if user is authenticated AND is a customer
    if (isAuthenticated && user && (!user.role || user.role === "customer")) {
      dispatch(getCart());
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="App d-flex flex-column min-vh-100">
            <Navbar />
            <Alert />
            <main className="flex-grow-1" role="main">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
