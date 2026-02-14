import axios from "./axios";

// Get notifications
export const getNotifications = async (params = {}) => {
  const response = await axios.get("/api/notifications", { params });
  return response.data;
};

// Get unread count
export const getUnreadCount = async () => {
  const response = await axios.get("/api/notifications/unread-count");
  return response.data;
};

// Mark single notification as read
export const markAsRead = async (id) => {
  const response = await axios.patch(`/api/notifications/${id}/read`);
  return response.data;
};

// Mark all as read
export const markAllAsRead = async () => {
  const response = await axios.patch("/api/notifications/read-all");
  return response.data;
};

// Delete notification
export const deleteNotification = async (id) => {
  const response = await axios.delete(`/api/notifications/${id}`);
  return response.data;
};

// Clear all notifications
export const clearAllNotifications = async () => {
  const response = await axios.delete("/api/notifications/clear-all");
  return response.data;
};
