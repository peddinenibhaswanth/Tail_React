const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Base uploads directory
const uploadsDir = path.join(__dirname, "../uploads");

// Create subdirectories
["users", "pets", "products", "reviews", "messages"].forEach((dir) => {
  ensureDirectoryExists(path.join(uploadsDir, dir));
});

// Storage configuration for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(uploadsDir, destination);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, name + "-" + uniqueSuffix + ext);
    },
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }

  // Check file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Invalid image file extension!"), false);
  }

  cb(null, true);
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  // Accept documents only
  const allowedMimetypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedMimetypes.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, DOC, DOCX, and TXT files are allowed!"),
      false
    );
  }

  cb(null, true);
};

// File size limits (in bytes)
const fileSizeLimits = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
};

// Upload middleware for user profile pictures
const uploadUserImage = multer({
  storage: createStorage("users"),
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimits.image,
  },
}).single("profilePicture");

// Upload middleware for pet images (multiple)
const uploadPetImages = multer({
  storage: createStorage("pets"),
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimits.image,
    files: 10, // Maximum 10 images per pet
  },
}).array("images", 10);

// Upload middleware for product images (multiple)
const uploadProductImages = multer({
  storage: createStorage("products"),
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimits.image,
    files: 8, // Maximum 8 images per product
  },
}).array("images", 8);

// Upload middleware for review images
const uploadReviewImages = multer({
  storage: createStorage("reviews"),
  fileFilter: imageFilter,
  limits: {
    fileSize: fileSizeLimits.image,
    files: 5, // Maximum 5 images per review
  },
}).array("images", 5);

// Upload middleware for message attachments
const uploadMessageAttachments = multer({
  storage: createStorage("messages"),
  fileFilter: (req, file, cb) => {
    // Allow both images and documents for messages
    const isImage = file.mimetype.startsWith("image/");
    const isDocument = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ].includes(file.mimetype);

    if (isImage || isDocument) {
      cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed!"), false);
    }
  },
  limits: {
    fileSize: fileSizeLimits.document,
    files: 3, // Maximum 3 attachments per message
  },
}).array("attachments", 3);

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "File size is too large. Maximum size allowed is 5MB for images and 10MB for documents.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded. Please check the file limit.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field name for file upload.",
      });
    }
  } else if (err) {
    // Other errors (like file filter errors)
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// Helper function to delete files
const deleteFile = (filePath) => {
  const fullPath = path.join(uploadsDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Helper function to delete multiple files
const deleteFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    if (filePath) {
      deleteFile(filePath);
    }
  });
};

module.exports = {
  uploadUserImage,
  uploadPetImages,
  uploadProductImages,
  uploadReviewImages,
  uploadMessageAttachments,
  handleMulterError,
  deleteFile,
  deleteFiles,
  uploadsDir,
};
