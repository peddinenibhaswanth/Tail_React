import React from "react";
import { Spinner } from "react-bootstrap";

const Loading = ({ size = "md", variant = "primary", fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant={variant} role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const spinnerSize = size === "sm" ? "spinner-border-sm" : "";

  return (
    <div className="text-center py-4">
      <Spinner
        animation="border"
        variant={variant}
        className={spinnerSize}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default Loading;
