const {
  isRedisEnabled,
  getNamespaceVersion,
  getJson,
  setJson,
} = require("../services/cacheService");

const buildCacheKey = ({ namespace, version, url, userId }) => {
  const base = `cache:${namespace}:v${version}:${url}`;
  return userId ? `${base}:u:${userId}` : base;
};

/**
 * Caches JSON responses for GET endpoints.
 * Safe-by-default: if Redis is down/misconfigured, requests still work.
 */
const cacheResponse = ({ namespace, ttlSeconds = 120, varyByUser = false } = {}) => {
  if (!namespace) {
    throw new Error("cacheResponse requires a namespace");
  }

  return async (req, res, next) => {
    if (req.method !== "GET") return next();
    if (!isRedisEnabled()) return next();

    try {
      const version = (await getNamespaceVersion(namespace)) || "1";
      const userId = varyByUser && req.user ? String(req.user._id) : null;
      const key = buildCacheKey({
        namespace,
        version,
        url: req.originalUrl,
        userId,
      });

      const cached = await getJson(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }

      res.setHeader("X-Cache", "MISS");

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const isSuccessStatus = res.statusCode >= 200 && res.statusCode < 300;
        if (isSuccessStatus) {
          setJson(key, body, ttlSeconds).catch(() => {
            // ignore cache set errors
          });
        }
        return originalJson(body);
      };

      return next();
    } catch {
      return next();
    }
  };
};

module.exports = {
  cacheResponse,
};
