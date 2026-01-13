/**
 * Request Validation Middleware
 * Uses express-validator to validate incoming request data
 * 
 * This middleware ensures that all user input is validated before
 * reaching the controller, preventing invalid data from being processed.
 */

const { body, param, query, validationResult } = require("express-validator");

// ===========================================
// VALIDATION RESULT HANDLER
// ===========================================
// This middleware checks if there are validation errors and returns them
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ===========================================
// AUTH VALIDATORS
// ===========================================

// Validate user registration
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("password2")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("role")
    .optional()
    .isIn(["customer", "seller", "veterinary"])
    .withMessage("Invalid role specified"),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];

// Validate user login
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

// Validate profile update
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .trim(),

  body("address.street").optional().trim(),
  body("address.city").optional().trim(),
  body("address.state").optional().trim(),
  body("address.zipCode").optional().trim(),
  body("address.country").optional().trim(),

  handleValidationErrors,
];

// Validate password change
const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    }),

  handleValidationErrors,
];

// ===========================================
// PRODUCT VALIDATORS
// ===========================================

// Validate product creation
const validateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("brand")
    .optional()
    .trim(),

  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  handleValidationErrors,
];

// Validate product update (all fields optional)
const validateProductUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category")
    .optional()
    .trim(),

  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  handleValidationErrors,
];

// Validate stock update
const validateStockUpdate = [
  body("stock")
    .notEmpty()
    .withMessage("Stock value is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  handleValidationErrors,
];

// ===========================================
// PET VALIDATORS
// ===========================================

// Validate pet creation
const validatePet = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Pet name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Pet name must be between 2 and 50 characters"),

  body("species")
    .trim()
    .notEmpty()
    .withMessage("Species is required")
    .isIn(["dog", "cat", "bird", "fish", "rabbit", "hamster", "other"])
    .withMessage("Invalid species"),

  body("breed")
    .optional()
    .trim(),

  body("age")
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage("Age must be between 0 and 30 years"),

  body("gender")
    .optional()
    .isIn(["male", "female", "unknown"])
    .withMessage("Invalid gender"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),

  body("adoptionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Adoption fee must be a positive number"),

  handleValidationErrors,
];

// Validate adoption application
const validateAdoptionApplication = [
  body("petId")
    .notEmpty()
    .withMessage("Pet ID is required")
    .isMongoId()
    .withMessage("Invalid Pet ID"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason for adoption is required")
    .isLength({ min: 20 })
    .withMessage("Please provide a detailed reason (at least 20 characters)"),

  body("experience")
    .optional()
    .trim(),

  body("homeType")
    .optional()
    .isIn(["house", "apartment", "condo", "other"])
    .withMessage("Invalid home type"),

  handleValidationErrors,
];

// ===========================================
// ORDER VALIDATORS
// ===========================================

// Validate order status update
const validateOrderStatus = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),

  handleValidationErrors,
];

// ===========================================
// APPOINTMENT VALIDATORS
// ===========================================

// Validate appointment booking
const validateAppointment = [
  body("veterinaryId")
    .notEmpty()
    .withMessage("Veterinary ID is required")
    .isMongoId()
    .withMessage("Invalid Veterinary ID"),

  body("petName")
    .trim()
    .notEmpty()
    .withMessage("Pet name is required"),

  body("petType")
    .trim()
    .notEmpty()
    .withMessage("Pet type is required"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("timeSlot")
    .trim()
    .notEmpty()
    .withMessage("Time slot is required"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason for visit is required")
    .isLength({ min: 10 })
    .withMessage("Please provide more details about the visit reason"),

  handleValidationErrors,
];

// Validate appointment status update
const validateAppointmentStatus = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["scheduled", "confirmed", "completed", "cancelled"])
    .withMessage("Invalid appointment status"),

  handleValidationErrors,
];

// ===========================================
// VETERINARY SCHEDULE VALIDATORS
// ===========================================

// Valid days of the week
const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Validate veterinary schedule/profile update
const validateVetSchedule = [
  body("vetInfo.availableDays")
    .optional()
    .isArray()
    .withMessage("Available days must be an array")
    .custom((days) => {
      if (days && days.length > 0) {
        const invalidDays = days.filter((day) => !validDays.includes(day));
        if (invalidDays.length > 0) {
          throw new Error(`Invalid days: ${invalidDays.join(", ")}`);
        }
      }
      return true;
    }),

  body("vetInfo.availableTimeSlots")
    .optional()
    .isArray()
    .withMessage("Available time slots must be an array")
    .custom((slots) => {
      if (slots && slots.length > 0) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        for (const slot of slots) {
          if (!slot.start || !slot.end) {
            throw new Error("Each time slot must have start and end times");
          }
          if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
            throw new Error("Time must be in HH:MM format");
          }
        }
      }
      return true;
    }),

  body("vetInfo.consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Consultation fee must be a positive number"),

  body("vetInfo.licenseNumber")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("License number must be at least 3 characters"),

  handleValidationErrors,
];

// Validate appointment time slot against vet's schedule
const validateAppointmentTimeSlot = [
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format"),

  body("timeSlot")
    .notEmpty()
    .withMessage("Time slot is required"),

  // Custom validation to check if slot is within vet's available slots
  async (req, res, next) => {
    try {
      const { veterinaryId, date, timeSlot } = req.body;
      
      if (!veterinaryId) {
        return next(); // Let other validators handle this
      }

      const User = require("../models/User");
      const vet = await User.findById(veterinaryId).select("vetInfo");
      
      if (!vet) {
        return res.status(404).json({
          success: false,
          message: "Veterinary not found",
        });
      }

      // Check if vet is available on this day
      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.toLocaleDateString("en-US", { weekday: "long" });
      
      const vetAvailableDays = vet.vetInfo?.availableDays || [];
      if (vetAvailableDays.length > 0 && !vetAvailableDays.includes(dayOfWeek)) {
        return res.status(400).json({
          success: false,
          message: `Veterinary is not available on ${dayOfWeek}. Available days: ${vetAvailableDays.join(", ")}`,
        });
      }

      // Check if time slot is in vet's available slots
      const vetTimeSlots = vet.vetInfo?.availableTimeSlots || [];
      if (vetTimeSlots.length > 0) {
        let requestedSlot;
        if (typeof timeSlot === "string") {
          requestedSlot = timeSlot;
        } else if (timeSlot.start && timeSlot.end) {
          requestedSlot = `${timeSlot.start}-${timeSlot.end}`;
        }

        const availableSlotStrings = vetTimeSlots.map(
          (slot) => `${slot.start}-${slot.end}`
        );
        
        if (!availableSlotStrings.includes(requestedSlot)) {
          return res.status(400).json({
            success: false,
            message: `Time slot ${requestedSlot} is not available. Available slots: ${availableSlotStrings.join(", ")}`,
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error validating appointment time slot",
        error: error.message,
      });
    }
  },
];

// ===========================================
// CART VALIDATORS
// ===========================================

// Validate add to cart
const validateAddToCart = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  handleValidationErrors,
];

// Validate cart item update
const validateCartUpdate = [
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  handleValidationErrors,
];

// ===========================================
// CHECKOUT VALIDATORS
// ===========================================

// Validate checkout
const validateCheckout = [
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required"),

  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),

  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("shippingAddress.zipCode")
    .trim()
    .notEmpty()
    .withMessage("ZIP code is required"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["cod", "card", "upi", "netbanking"])
    .withMessage("Invalid payment method"),

  handleValidationErrors,
];

// ===========================================
// MESSAGE VALIDATORS
// ===========================================

// Validate message sending
const validateMessage = [
  body("recipientId")
    .notEmpty()
    .withMessage("Recipient ID is required")
    .isMongoId()
    .withMessage("Invalid Recipient ID"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ max: 2000 })
    .withMessage("Message must be less than 2000 characters"),

  handleValidationErrors,
];

// ===========================================
// REVIEW VALIDATORS
// ===========================================

// Validate product review
const validateReview = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must be less than 500 characters"),

  handleValidationErrors,
];

// ===========================================
// COMMON VALIDATORS
// ===========================================

// Validate MongoDB ObjectId in params
const validateObjectId = (paramName) => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),

  handleValidationErrors,
];

// Validate pagination query params
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// ===========================================
// EXPORT ALL VALIDATORS
// ===========================================

module.exports = {
  // Handler
  handleValidationErrors,
  
  // Auth validators
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  
  // Product validators
  validateProduct,
  validateProductUpdate,
  validateStockUpdate,
  
  // Pet validators
  validatePet,
  validateAdoptionApplication,
  
  // Order validators
  validateOrderStatus,
  
  // Appointment validators
  validateAppointment,
  validateAppointmentStatus,
  
  // Veterinary validators
  validateVetSchedule,
  validateAppointmentTimeSlot,
  
  // Cart validators
  validateAddToCart,
  validateCartUpdate,
  
  // Checkout validators
  validateCheckout,
  
  // Message validators
  validateMessage,
  
  // Review validators
  validateReview,
  
  // Common validators
  validateObjectId,
  validatePagination,
};
