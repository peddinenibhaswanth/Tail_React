const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const {
  isAuthenticated,
  isVeterinary,
  isAdminOrCoAdmin,
} = require("../middleware/auth");
const {
  validateAppointment,
  validateAppointmentStatus,
  validateAppointmentTimeSlot,
} = require("../middleware/validators");

// Public routes
router.get("/veterinaries", appointmentController.getVeterinaries);
router.get("/available-slots", appointmentController.getAvailableSlots);

// Protected routes (require authentication) with validation
// validateAppointmentTimeSlot checks if the slot is in vet's available schedule
router.post(
  "/",
  isAuthenticated,
  validateAppointment,
  validateAppointmentTimeSlot,
  appointmentController.createAppointment
);
router.get(
  "/my-appointments",
  isAuthenticated,
  appointmentController.getMyAppointments
);

// Veterinary routes with validation
router.get(
  "/vet/appointments",
  isAuthenticated,
  isVeterinary,
  appointmentController.getVetAppointments
);
router.patch(
  "/:id/status",
  isAuthenticated,
  isVeterinary,
  validateAppointmentStatus,
  appointmentController.updateAppointmentStatus
);

// Admin routes
router.get(
  "/admin/all",
  isAuthenticated,
  isAdminOrCoAdmin,
  appointmentController.getAllAppointments
);
router.get(
  "/admin/stats",
  isAuthenticated,
  isAdminOrCoAdmin,
  appointmentController.getAppointmentStats
);

// Shared routes (customer/vet/admin)
router.get("/:id", isAuthenticated, appointmentController.getAppointmentById);
router.put("/:id", isAuthenticated, appointmentController.updateAppointment);
router.patch(
  "/:id/cancel",
  isAuthenticated,
  appointmentController.cancelAppointment
);

module.exports = router;
