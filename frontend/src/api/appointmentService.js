import axios from "./axios";

// Create appointment
export const createAppointment = async (appointmentData) => {
  const response = await axios.post("/api/appointments", appointmentData);
  return response.data;
};

// Get user appointments
export const getUserAppointments = async () => {
  const response = await axios.get("/api/appointments/my-appointments");
  return response.data;
};

// Get single appointment
export const getAppointment = async (id) => {
  const response = await axios.get(`/api/appointments/${id}`);
  return response.data;
};

// Cancel appointment
export const cancelAppointment = async (id) => {
  const response = await axios.patch(`/api/appointments/${id}/cancel`);
  return response.data;
};

// Get available time slots
export const getAvailableSlots = async (date) => {
  const response = await axios.get("/api/appointments/available-slots", {
    params: { date },
  });
  return response.data;
};
