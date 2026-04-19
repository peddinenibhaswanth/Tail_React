import React, { useEffect, useMemo, useState } from "react";
import { Container, Alert, Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { getCurrentUser, reset } from "../../redux/slices/authSlice";

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [error, setError] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get("token");
  const message = params.get("message");

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      if (!token) {
        setError(message || "OAuth login failed. Please try again.");
        return;
      }

      // Store token first so axios interceptor can attach it
      localStorage.setItem("token", token);

      try {
        await dispatch(getCurrentUser()).unwrap();
        if (!cancelled) {
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        if (!cancelled) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError(typeof e === "string" ? e : "Authentication failed. Please try again.");
        }
      }
    };

    finish();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, token, message]);

  if (!error) {
    return <Loading fullScreen />;
  }

  return (
    <div
      style={{ backgroundColor: "var(--neutral-50)", minHeight: "80vh" }}
      className="d-flex align-items-center"
    >
      <Container className="py-5" style={{ maxWidth: 560 }}>
        <Alert variant="danger">
          <Alert.Heading>Google sign-in failed</Alert.Heading>
          <div className="small">{error}</div>
          <div className="mt-3 d-flex gap-2">
            <Button as={Link} to="/login" variant="primary">
              Back to Login
            </Button>
            <Button as={Link} to="/" variant="outline-secondary">
              Go Home
            </Button>
          </div>
        </Alert>
      </Container>
    </div>
  );
};

export default OAuthCallback;
