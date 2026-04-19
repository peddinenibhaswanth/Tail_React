const {
  getCloudinaryBaseFolder,
  isCloudinaryEnabled,
  uploadLocalFileToCloudinary,
  safeUnlink,
} = require("../services/cloudinaryService");

const uploadRequestFilesToCloudinary = ({ folder }) => {
  return async (req, res, next) => {
    if (!isCloudinaryEnabled()) return next();

    const base = getCloudinaryBaseFolder();
    const cloudFolder = folder ? `${base}/${folder}` : base;

    try {
      if (req.file && req.file.path) {
        const result = await uploadLocalFileToCloudinary(req.file.path, {
          folder: cloudFolder,
        });
        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryPublicId = result.public_id;
        await safeUnlink(req.file.path);
      }

      if (Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          if (!file || !file.path) continue;
          const result = await uploadLocalFileToCloudinary(file.path, {
            folder: cloudFolder,
          });
          file.cloudinaryUrl = result.secure_url;
          file.cloudinaryPublicId = result.public_id;
          await safeUnlink(file.path);
        }
      }

      return next();
    } catch (error) {
      error.status = error.status || 500;
      return next(error);
    }
  };
};

module.exports = {
  uploadRequestFilesToCloudinary,
};
