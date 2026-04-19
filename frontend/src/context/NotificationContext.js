import React, { createContext, useContext, useState, useCallback } from "react";

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

  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
    [removeNotification]
  );

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

      {/* Toast Container - Custom animated notifications */}
      <div className="custom-toast-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`toast-notification toast-${notification.type === 'error' ? 'error' : notification.type}`}
          >
            <div className="d-flex align-items-start gap-2">
              <span className="fs-5 lh-1">{getIcon(notification.type)}</span>
              <div className="flex-grow-1">
                <div className="fw-semibold small mb-1" style={{ textTransform: 'capitalize' }}>
                  {notification.type === 'error' ? 'Error' : notification.type}
                </div>
                <div className="small">{notification.message}</div>
              </div>
              <button
                className="btn-close btn-close-white ms-2"
                style={{ fontSize: '0.6rem', opacity: 0.7 }}
                onClick={() => removeNotification(notification.id)}
                aria-label="Close"
              />
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
