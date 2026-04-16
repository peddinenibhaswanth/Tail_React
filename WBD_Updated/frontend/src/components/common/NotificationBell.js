import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../../api/notificationService";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      // Silently fail - don't disturb user
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 20 });
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    pollIntervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    setShow(false);

    // Navigate to the related page
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Clear all
  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "order_placed":
        return "bi-bag-check";
      case "order_status":
        return "bi-truck";
      case "order_delivered":
        return "bi-box-seam";
      case "order_cancelled":
        return "bi-x-circle";
      case "appointment_booked":
        return "bi-calendar-plus";
      case "appointment_confirmed":
        return "bi-calendar-check";
      case "appointment_completed":
        return "bi-clipboard-check";
      case "appointment_cancelled":
        return "bi-calendar-x";
      case "appointment_status":
        return "bi-calendar-event";
      case "adoption_submitted":
        return "bi-heart";
      case "adoption_approved":
        return "bi-heart-fill";
      case "adoption_rejected":
        return "bi-heartbreak";
      case "adoption_status":
        return "bi-heart-half";
      default:
        return "bi-bell";
    }
  };

  // Get color class for notification type
  const getNotificationColor = (type) => {
    if (type.includes("cancelled") || type.includes("rejected")) return "text-danger";
    if (type.includes("delivered") || type.includes("approved") || type.includes("completed") || type.includes("confirmed")) return "text-success";
    if (type.includes("placed") || type.includes("booked") || type.includes("submitted")) return "text-primary";
    return "text-warning";
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="notification-bell-wrapper"
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Bell button with badge outside the button so it never gets clipped */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          className="btn btn-link p-2 text-decoration-none"
          onClick={() => setShow(!show)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          style={{ fontSize: "1.4rem", color: "#444", lineHeight: 1 }}
        >
          <i className="bi bi-bell-fill"></i>
        </button>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "0px",
              backgroundColor: "#dc3545",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.6rem",
              fontWeight: "700",
              minWidth: "17px",
              height: "17px",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              pointerEvents: "none",
              boxShadow: "0 0 0 2px #fff",
              zIndex: 2,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {show && (
        <div
          className="notification-dropdown shadow-lg"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            width: "380px",
            maxHeight: "480px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            zIndex: 1050,
            border: "1px solid rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{
              borderBottom: "1px solid #eee",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h6 className="mb-0 fw-bold">
              <i className="bi bi-bell me-2"></i>Notifications
            </h6>
            <div>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-link text-primary p-0 me-3 text-decoration-none"
                  onClick={handleMarkAllRead}
                  style={{ fontSize: "0.8rem" }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                  onClick={handleClearAll}
                  style={{ fontSize: "0.8rem" }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" variant="primary" />
                <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.85rem" }}>
                  Loading...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-bell-slash text-muted"
                  style={{ fontSize: "2.5rem" }}
                ></i>
                <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.9rem" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item d-flex align-items-start px-3 py-2 ${
                    !notification.isRead ? "bg-light" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f0f4ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = notification.isRead
                      ? "transparent"
                      : "#f8f9fa")
                  }
                >
                  {/* Icon */}
                  <div
                    className={`me-3 mt-1 ${getNotificationColor(notification.type)}`}
                    style={{ fontSize: "1.2rem", minWidth: "24px" }}
                  >
                    <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <p
                        className={`mb-0 ${!notification.isRead ? "fw-semibold" : ""}`}
                        style={{
                          fontSize: "0.85rem",
                          lineHeight: "1.3",
                          color: "#333",
                        }}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span
                          className="bg-primary rounded-circle ms-2 flex-shrink-0"
                          style={{
                            width: "8px",
                            height: "8px",
                            display: "inline-block",
                            marginTop: "6px",
                          }}
                        ></span>
                      )}
                    </div>
                    <p
                      className="mb-0 text-muted"
                      style={{
                        fontSize: "0.78rem",
                        lineHeight: "1.3",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {notification.message}
                    </p>
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {timeAgo(notification.createdAt)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="text-center py-2"
              style={{
                borderTop: "1px solid #eee",
                backgroundColor: "#f8f9fa",
              }}
            >
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none"
                onClick={() => {
                  setShow(false);
                  navigate("/notifications");
                }}
                style={{ fontSize: "0.85rem" }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
