import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

// Create the Notification Context
const NotificationContext = createContext(null);

// Custom hook to use notifications - THIS REQUIRES useContext
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback(
    (message, type = "info", duration = 5000) => {
      const id = Date.now() + Math.random();
      const notification = {
        id,
        message,
        type, // 'success', 'error', 'warning', 'info'
        duration,
        createdAt: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove notification after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    []
  );

  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Helper methods for different notification types
  const showSuccess = useCallback(
    (message, duration) => {
      return addNotification(message, "success", duration);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, duration) => {
      return addNotification(message, "error", duration);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, duration) => {
      return addNotification(message, "warning", duration);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration) => {
      return addNotification(message, "info", duration);
    },
    [addNotification]
  );

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get background variant for toast
  const getVariant = (type) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "secondary";
    }
  };

  // Get icon for toast type
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Toast Container - Fixed position at top-right */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999, position: "fixed", top: "70px" }}
      >
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            onClose={() => removeNotification(notification.id)}
            bg={getVariant(notification.type)}
            className="mb-2"
            autohide={notification.duration > 0}
            delay={notification.duration}
          >
            <Toast.Header>
              <span className="me-2">{getIcon(notification.type)}</span>
              <strong className="me-auto">
                {notification.type.charAt(0).toUpperCase() +
                  notification.type.slice(1)}
              </strong>
              <small>just now</small>
            </Toast.Header>
            <Toast.Body
              className={
                notification.type === "warning" ? "text-dark" : "text-white"
              }
            >
              {notification.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
