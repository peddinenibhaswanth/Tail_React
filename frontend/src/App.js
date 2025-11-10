import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Alert from "./components/common/Alert";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { getCart } from "./redux/slices/cartSlice";
import useAuth from "./hooks/useAuth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/custom.css";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Load cart if user is authenticated
    if (isAuthenticated) {
      dispatch(getCart());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
