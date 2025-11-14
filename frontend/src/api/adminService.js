import axios from "./axios";

// =====================
// USER MANAGEMENT
// =====================

// Get all users
export const getAllUsers = async (params = {}) => {
  const response = await axios.get("/api/admin/users", { params });
  return response.data;
};

// Get user by ID
export const getUserById = async (id) => {
  const response = await axios.get(`/api/admin/users/${id}`);
  return response.data;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await axios.put(`/api/admin/users/${id}`, userData);
  return response.data;
};

// Get pending users (sellers/vets awaiting approval)
export const getPendingUsers = async () => {
  const response = await axios.get("/api/admin/users/pending");
  return response.data;
};

// Approve user
export const approveUser = async (id) => {
  const response = await axios.patch(`/api/admin/users/${id}/approve`);
  return response.data;
};

// Reject user
export const rejectUser = async (id) => {
  const response = await axios.patch(`/api/admin/users/${id}/reject`);
  return response.data;
};

// Update user role
export const updateUserRole = async (id, role) => {
  const response = await axios.patch(`/api/admin/users/${id}/role`, { role });
  return response.data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await axios.delete(`/api/admin/users/${id}`);
  return response.data;
};

// =====================
// CO-ADMIN MANAGEMENT
// =====================

// Get all co-admins
export const getAllCoAdmins = async () => {
  const response = await axios.get("/api/admin/co-admins");
  return response.data;
};

// Create co-admin
export const createCoAdmin = async (userData) => {
  const response = await axios.post("/api/admin/co-admins", userData);
  return response.data;
};

// Update co-admin
export const updateCoAdmin = async (id, userData) => {
  const response = await axios.put(`/api/admin/co-admins/${id}`, userData);
  return response.data;
};

// Delete co-admin
export const deleteCoAdmin = async (id) => {
  const response = await axios.delete(`/api/admin/co-admins/${id}`);
  return response.data;
};

// =====================
// ADOPTION APPLICATIONS
// =====================

// Get all applications
export const getAllApplications = async (params = {}) => {
  const response = await axios.get("/api/admin/applications", { params });
  return response.data;
};

// Get application by ID
export const getApplicationById = async (id) => {
  const response = await axios.get(`/api/admin/applications/${id}`);
  return response.data;
};

// Update application status
export const updateApplicationStatus = async (id, status, notes = "") => {
  const response = await axios.patch(`/api/admin/applications/${id}/status`, {
    status,
    notes,
  });
  return response.data;
};

// Approve application
export const approveApplication = async (id) => {
  const response = await axios.patch(`/api/admin/applications/${id}/approve`);
  return response.data;
};

// Deny application
export const denyApplication = async (id, reason) => {
  const response = await axios.patch(`/api/admin/applications/${id}/deny`, {
    denialReason: reason,
  });
  return response.data;
};

// Delete application
export const deleteApplication = async (id) => {
  const response = await axios.delete(`/api/admin/applications/${id}`);
  return response.data;
};

// =====================
// MESSAGES
// =====================

// Get all messages
export const getAllMessages = async (params = {}) => {
  const response = await axios.get("/api/admin/messages", { params });
  return response.data;
};

// Get message by ID
export const getMessageById = async (id) => {
  const response = await axios.get(`/api/admin/messages/${id}`);
  return response.data;
};

// Update message status (mark as read/unread)
export const updateMessageStatus = async (id, isRead) => {
  const response = await axios.patch(`/api/admin/messages/${id}`, { isRead });
  return response.data;
};

// Mark message as read
export const markMessageAsRead = async (id) => {
  const response = await axios.patch(`/api/messages/${id}/read`);
  return response.data;
};

// Reply to message
export const replyToMessage = async (id, reply) => {
  const response = await axios.post(`/api/messages/${id}/reply`, reply);
  return response.data;
};

// Delete message
export const deleteMessage = async (id) => {
  const response = await axios.delete(`/api/admin/messages/${id}`);
  return response.data;
};

// =====================
// STATISTICS
// =====================

// Get admin statistics
export const getAdminStatistics = async () => {
  const response = await axios.get("/api/admin/statistics");
  return response.data;
};

// Get revenue data
export const getRevenueData = async (params = {}) => {
  const response = await axios.get("/api/admin/revenue", { params });
  return response.data;
};
