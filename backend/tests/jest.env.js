const path = require("path");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Disable Redis during tests (tests should not require external services)
process.env.REDIS_ENABLED = "false";

// Partner API key used in partner-route tests (if/when added)
process.env.PARTNER_API_KEY = process.env.PARTNER_API_KEY || "test-partner-key";

// mongodb-memory-server can take longer to start on Windows
process.env.MONGOMS_START_TIMEOUT =
	process.env.MONGOMS_START_TIMEOUT || "60000";

// Cache MongoDB binaries inside the repo to avoid re-downloading repeatedly
process.env.MONGOMS_DOWNLOAD_DIR =
	process.env.MONGOMS_DOWNLOAD_DIR ||
	path.join(__dirname, "..", ".cache", "mongodb-binaries");
