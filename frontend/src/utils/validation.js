// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

// Phone number validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  const cleaned = ("" + phone).replace(/\D/g, "");
  return phoneRegex.test(cleaned);
};

// Pincode validation
export const isValidPincode = (pincode) => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};

// Name validation
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== "";
};

// Number validation
export const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value) && value >= 0;
};

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Date validation (future date)
export const isValidFutureDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove leading/trailing whitespace
  return input.trim();
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return html;
  // Basic HTML escape to prevent XSS
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = formData[field];

    if (rule.required && !isRequired(value)) {
      errors[field] = `${rule.label || field} is required`;
    } else if (rule.email && !isValidEmail(value)) {
      errors[field] = "Invalid email address";
    } else if (rule.password && !isValidPassword(value)) {
      errors[field] = "Password must be at least 6 characters";
    } else if (rule.phone && !isValidPhone(value)) {
      errors[field] = "Invalid phone number";
    } else if (rule.pincode && !isValidPincode(value)) {
      errors[field] = "Invalid pincode";
    } else if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `Minimum ${rule.minLength} characters required`;
    } else if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `Maximum ${rule.maxLength} characters allowed`;
    } else if (rule.min && value < rule.min) {
      errors[field] = `Minimum value is ${rule.min}`;
    } else if (rule.max && value > rule.max) {
      errors[field] = `Maximum value is ${rule.max}`;
    } else if (rule.match && value !== formData[rule.match]) {
      errors[field] = `${rule.label || field} does not match`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
