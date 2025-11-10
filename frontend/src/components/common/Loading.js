import React from "react";
import { Spinner } from "react-bootstrap";

const Loading = ({
  size = "md",
  variant = "primary",
  fullScreen = false,
  message = "Loading...",
}) => {
  if (fullScreen) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant={variant} role="status">
          <span className="visually-hidden">{message}</span>
        </Spinner>
        <p className="mt-3 text-muted">{message}</p>
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
        <span className="visually-hidden">{message}</span>
      </Spinner>
      {size !== "sm" && <p className="mt-2 text-muted small">{message}</p>}
    </div>
  );
};

export default Loading;
