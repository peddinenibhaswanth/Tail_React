// API Endpoints
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// Pagination
export const ITEMS_PER_PAGE = 12;

// Pet Categories
export const PET_SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
export const PET_SIZES = ["Small", "Medium", "Large"];
export const PET_GENDERS = ["Male", "Female"];
export const PET_AGE_RANGES = ["Puppy/Kitten", "Young", "Adult", "Senior"];

// Adoption Status
export const ADOPTION_STATUS = {
  AVAILABLE: "available",
  PENDING: "pending",
  ADOPTED: "adopted",
};

// Product Categories
export const PRODUCT_CATEGORIES = [
  "Food",
  "Toys",
  "Accessories",
  "Healthcare",
  "Grooming",
  "Beds & Furniture",
  "Training",
  "Other",
];

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
