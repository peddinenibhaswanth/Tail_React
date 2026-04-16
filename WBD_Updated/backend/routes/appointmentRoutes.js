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
const { cacheResponse } = require("../middleware/cache");

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Veterinary appointment scheduling
 */

/**
 * @swagger
 * /api/appointments/veterinaries:
 *   get:
 *     summary: Get a list of all veterinaries
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: A list of veterinary users
 */
router.get(
  "/veterinaries",
  cacheResponse({ namespace: "veterinaries", ttlSeconds: 120 }),
  appointmentController.getVeterinaries
);

/**
 * @swagger
 * /api/appointments/available-slots:
 *   get:
 *     summary: Get available appointment slots for a specific veterinary on a given date
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: veterinary
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the veterinary
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to check for available slots (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: A list of available time slots
 */
router.get(
  "/available-slots",
  cacheResponse({ namespace: "appointments", ttlSeconds: 60 }),
  appointmentController.getAvailableSlots
);

/**
 * @swagger
 * /api/appointments/reverse-geocode:
 *   get:
 *     summary: Get address from latitude and longitude
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: The address corresponding to the coordinates
 */
router.get("/reverse-geocode", appointmentController.reverseGeocodeLocation);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post(
  "/",
  isAuthenticated,
  validateAppointment,
  validateAppointmentTimeSlot,
  appointmentController.createAppointment
);

/**
 * @swagger
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Get all appointments for the authenticated user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's appointments
 */
router.get(
  "/my-appointments",
  isAuthenticated,
  appointmentController.getMyAppointments
);

/**
 * @swagger
 * /api/appointments/vet/appointments:
 *   get:
 *     summary: (Veterinary) Get all appointments for the authenticated veterinary
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of appointments for the veterinary
 */
router.get(
  "/vet/appointments",
  isAuthenticated,
  isVeterinary,
  appointmentController.getVetAppointments
);

/**
 * @swagger
 * /api/appointments/vet/update-address:
 *   post:
 *     summary: (Veterinary) Update the address for the authenticated veterinary
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.post(
  "/vet/update-address",
  isAuthenticated,
  isVeterinary,
  appointmentController.updateVetAddress
);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: (Veterinary) Update the status of an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 */
router.patch(
  "/:id/status",
  isAuthenticated,
  isVeterinary,
  validateAppointmentStatus,
  appointmentController.updateAppointmentStatus
);

/**
 * @swagger
 * /api/appointments/admin/all:
 *   get:
 *     summary: (Admin) Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all appointments
 */
router.get(
  "/admin/all",
  isAuthenticated,
  isAdminOrCoAdmin,
  appointmentController.getAllAppointments
);

/**
 * @swagger
 * /api/appointments/admin/stats:
 *   get:
 *     summary: (Admin) Get appointment statistics
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment statistics
 */
router.get(
  "/admin/stats",
  isAuthenticated,
  isAdminOrCoAdmin,
  appointmentController.getAppointmentStats
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment
 *     responses:
 *       200:
 *         description: A single appointment object
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.get("/:id", isAuthenticated, appointmentController.getAppointmentById);
router.put("/:id", isAuthenticated, appointmentController.updateAppointment);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment to cancel
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 */
router.patch(
  "/:id/cancel",
  isAuthenticated,
  appointmentController.cancelAppointment
);

module.exports = router;
