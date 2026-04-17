import React, { useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Alert from "./components/common/Alert";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ReviewPromptModal from "./components/products/ReviewPromptModal";
import { NotificationProvider } from "./context/NotificationContext";
import { getCart } from "./redux/slices/cartSlice";
import { getCurrentUser } from "./redux/slices/authSlice";
import useAuth from "./hooks/useAuth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/variables.css";
import "./styles/custom.css";

// Animated wrapper that re-triggers fade on route change
const PageTransition = () => {
  const location = useLocation();

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="page-transition-wrapper" key={location.pathname}>
      <AppRoutes />
    </div>
  );
};

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
              <PageTransition />
            </main>
            <Footer />
            {isAuthenticated && <ReviewPromptModal />}
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
