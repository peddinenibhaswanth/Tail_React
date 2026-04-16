import axios from "./axios";

// Create appointment
export const createAppointment = async (appointmentData) => {
  const response = await axios.post("/api/appointments", appointmentData);
  return response.data;
};

// Get user appointments (customers)
export const getUserAppointments = async () => {
  const response = await axios.get("/api/appointments/my-appointments");
  return response.data;
};

// Get veterinary appointments
export const getVetAppointments = async (params = {}) => {
  const response = await axios.get("/api/appointments/vet/appointments", {
    params,
  });
  return response.data;
};

// Get single appointment
export const getAppointment = async (id) => {
  const response = await axios.get(`/api/appointments/${id}`);
  return response.data;
};

// Update appointment
export const updateAppointment = async (id, appointmentData) => {
  const response = await axios.put(`/api/appointments/${id}`, appointmentData);
  return response.data;
};

// Update appointment status (vet/admin)
export const updateAppointmentStatus = async (
  id,
  status,
  notes = "",
  paymentStatus = null
) => {
  const data = { status, notes };
  if (paymentStatus) {
    data.paymentStatus = paymentStatus;
  }
  const response = await axios.patch(`/api/appointments/${id}/status`, data);
  return response.data;
};

// Cancel appointment
export const cancelAppointment = async (id) => {
  const response = await axios.patch(`/api/appointments/${id}/cancel`);
  return response.data;
};

// Get available time slots
export const getAvailableSlots = async (veterinary, date) => {
  const response = await axios.get("/api/appointments/available-slots", {
    params: { veterinary, date },
  });
  return response.data;
};

// Get list of veterinaries with location-based search
export const getVeterinaries = async (params = {}) => {
  const response = await axios.get("/api/appointments/veterinaries", { params });
  return response.data;
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (lat, lng) => {
  const response = await axios.get("/api/appointments/reverse-geocode", {
    params: { lat, lng },
  });
  return response.data;
};

// Update vet address with geocoding
export const updateVetAddress = async (data) => {
  const response = await axios.post("/api/appointments/vet/update-address", data);
  return response.data;
};

// Get all appointments (admin)
export const getAllAppointments = async (params = {}) => {
  const response = await axios.get("/api/appointments/admin/all", { params });
  return response.data;
};

// Get appointment stats (admin)
export const getAppointmentStats = async () => {
  const response = await axios.get("/api/appointments/admin/stats");
  return response.data;
};
