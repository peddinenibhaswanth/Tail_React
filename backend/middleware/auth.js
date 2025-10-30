const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Please log in to access this resource",
  });
};

const ensureGuest = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(400).json({
      success: false,
      message: "You are already logged in",
    });
  }
  return next();
};

const isAdmin = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    (req.user.role === "admin" || req.user.role === "co-admin")
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
};

const isStrictlyAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Primary admin privileges required.",
  });
};

const isSeller = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    req.user.role === "seller" &&
    req.user.isApproved
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Approved seller account required.",
  });
};

const isSellerOrAdmin = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    ((req.user.role === "seller" && req.user.isApproved) ||
      req.user.role === "admin" ||
      req.user.role === "co-admin")
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Seller or admin privileges required.",
  });
};

const isVeterinary = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    req.user.role === "veterinary" &&
    req.user.isApproved
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Approved veterinary account required.",
  });
};

const isVet = isVeterinary;

const isCustomer = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "customer") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Customer account required.",
  });
};

const isAdminCoAdminOrSeller = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    (req.user.role === "admin" ||
      req.user.role === "co-admin" ||
      (req.user.role === "seller" && req.user.isApproved))
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin or seller privileges required.",
  });
};

const isApproved = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isApproved) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Your account is pending approval.",
  });
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  isAdmin,
  isStrictlyAdmin,
  isSeller,
  isSellerOrAdmin,
  isVeterinary,
  isVet,
  isCustomer,
  isAdminCoAdminOrSeller,
  isApproved,
};
