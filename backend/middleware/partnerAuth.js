const requirePartnerApiKey = (req, res, next) => {
  const configuredKey = process.env.PARTNER_API_KEY;

  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: "Partner API is not configured on this server",
    });
  }

  const providedKey = req.headers["x-api-key"];
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid or missing partner API key",
    });
  }

  return next();
};

module.exports = {
  requirePartnerApiKey,
};
