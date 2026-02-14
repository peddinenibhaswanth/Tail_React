import React, { useState, useEffect, useCallback } from "react";
import { Container, Card, Badge, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../api/notificationService";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all"); // all, unread

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter === "unread") params.unreadOnly = "true";
      const data = await getNotifications(params);
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        await clearAllNotifications();
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order_placed": return "bi-bag-check";
      case "order_status": return "bi-truck";
      case "order_delivered": return "bi-box-seam";
      case "order_cancelled": return "bi-x-circle";
      case "appointment_booked": return "bi-calendar-plus";
      case "appointment_confirmed": return "bi-calendar-check";
      case "appointment_completed": return "bi-clipboard-check";
      case "appointment_cancelled": return "bi-calendar-x";
      case "appointment_status": return "bi-calendar-event";
      case "adoption_submitted": return "bi-heart";
      case "adoption_approved": return "bi-heart-fill";
      case "adoption_rejected": return "bi-heartbreak";
      case "adoption_status": return "bi-heart-half";
      default: return "bi-bell";
    }
  };

  const getNotificationBadge = (type) => {
    if (type.includes("cancelled") || type.includes("rejected")) return "danger";
    if (type.includes("delivered") || type.includes("approved") || type.includes("completed") || type.includes("confirmed")) return "success";
    if (type.includes("placed") || type.includes("booked") || type.includes("submitted")) return "primary";
    return "warning";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <Container className="py-4" style={{ maxWidth: "750px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">
          <i className="bi bi-bell me-2"></i>Notifications
          {unreadCount > 0 && (
            <Badge bg="danger" pill className="ms-2" style={{ fontSize: "0.6em" }}>
              {unreadCount}
            </Badge>
          )}
        </h3>
        <div>
          {unreadCount > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              className="me-2"
              onClick={handleMarkAllRead}
            >
              <i className="bi bi-check-all me-1"></i>Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline-danger" size="sm" onClick={handleClearAll}>
              <i className="bi bi-trash me-1"></i>Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <button
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => { setFilter("all"); setPage(1); }}
          >
            All
          </button>
          <button
            className={`btn btn-sm ${filter === "unread" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => { setFilter("unread"); setPage(1); }}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-bell-slash text-muted" style={{ fontSize: "3rem" }}></i>
            <h5 className="text-muted mt-3">No notifications</h5>
            <p className="text-muted">
              {filter === "unread"
                ? "You're all caught up!"
                : "You'll see notifications about your orders, appointments, and adoptions here."}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`mb-2 ${!notification.isRead ? "border-start border-primary border-3" : ""}`}
              style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <Card.Body className="py-3 d-flex align-items-start" onClick={() => handleClick(notification)}>
                <div className="me-3">
                  <div
                    className={`d-flex align-items-center justify-content-center rounded-circle bg-${getNotificationBadge(notification.type)} bg-opacity-10`}
                    style={{ width: "42px", height: "42px" }}
                  >
                    <i
                      className={`bi ${getNotificationIcon(notification.type)} text-${getNotificationBadge(notification.type)}`}
                      style={{ fontSize: "1.2rem" }}
                    ></i>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className={`mb-1 ${!notification.isRead ? "fw-bold" : "fw-normal"}`} style={{ fontSize: "0.95rem" }}>
                      {notification.title}
                    </h6>
                    <small className="text-muted ms-2 text-nowrap" style={{ fontSize: "0.75rem" }}>
                      {formatDate(notification.createdAt)}
                    </small>
                  </div>
                  <p className="mb-1 text-muted" style={{ fontSize: "0.85rem" }}>
                    {notification.message}
                  </p>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getNotificationBadge(notification.type)} className="text-capitalize" style={{ fontSize: "0.7rem" }}>
                      {notification.type.replace(/_/g, " ")}
                    </Badge>
                    {!notification.isRead && (
                      <Badge bg="primary" pill style={{ fontSize: "0.65rem" }}>
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="ms-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-sm btn-outline-danger border-0"
                    onClick={() => handleDelete(notification._id)}
                    title="Delete"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </Card.Body>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="align-self-center mx-3 text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Notifications;
