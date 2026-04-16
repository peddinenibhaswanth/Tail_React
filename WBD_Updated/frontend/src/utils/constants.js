// API Endpoints
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// Pagination
export const ITEMS_PER_PAGE = 12;

// Pet Categories (must match backend enum - lowercase)
export const PET_SPECIES = ["dog", "cat", "bird", "rabbit", "other"];
export const PET_SIZES = ["small", "medium", "large"];
export const PET_GENDERS = ["male", "female"];
export const PET_AGE_RANGES = ["Puppy/Kitten", "Young", "Adult", "Senior"];

// Adoption Status
export const ADOPTION_STATUS = {
  AVAILABLE: "available",
  PENDING: "pending",
  ADOPTED: "adopted",
};

// Product Categories (must match backend enum - lowercase, same order)
export const PRODUCT_CATEGORIES = [
  "food",
  "toys",
  "accessories",
  "grooming",
  "health",
  "training",
  "other",
];

// Pet Types for Products
export const PET_TYPES = ["dog", "cat", "bird", "rabbit", "all", "other"];

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Application Status
export const APPLICATION_STATUS = {
  PENDING: "pending",
  UNDER_REVIEW: "under-review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  CO_ADMIN: "co-admin",
};

// Payment Methods
export const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "PayPal",
  "Cash on Delivery",
];

// Time Slots for Appointments
export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];
