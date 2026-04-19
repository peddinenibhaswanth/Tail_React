const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const isTruthy = (value) => {
  if (value === undefined || value === null) return false;
  return String(value).toLowerCase() === "true" || String(value) === "1";
};

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

const isCloudinaryEnabled = () => {
  if (process.env.CLOUDINARY_ENABLED !== undefined) {
    return isTruthy(process.env.CLOUDINARY_ENABLED);
  }
  return isCloudinaryConfigured();
};

let didConfigure = false;
const ensureConfigured = () => {
  if (didConfigure) return;
  if (!isCloudinaryConfigured()) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  didConfigure = true;
};

const getCloudinaryBaseFolder = () => {
  return (process.env.CLOUDINARY_FOLDER || "tail-treasures").replace(/\/+$/g, "");
};

const uploadLocalFileToCloudinary = async (localFilePath, { folder } = {}) => {
  ensureConfigured();

  if (!isCloudinaryEnabled()) {
    throw new Error("Cloudinary is not enabled");
  }
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  const options = {
    folder,
    resource_type: "image",
  };

  return cloudinary.uploader.upload(localFilePath, options);
};

const safeUnlink = async (localFilePath) => {
  if (!localFilePath) return;
  try {
    await fs.promises.unlink(localFilePath);
  } catch {
    // ignore
  }
};

module.exports = {
  isCloudinaryEnabled,
  isCloudinaryConfigured,
  getCloudinaryBaseFolder,
  uploadLocalFileToCloudinary,
  safeUnlink,
};
