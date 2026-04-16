const Redis = require("ioredis");

let redisClient;

const isRedisEnabled = () => {
  if (process.env.REDIS_ENABLED === "false") return false;
  return Boolean(process.env.REDIS_URL);
};

const getRedisClient = () => {
  if (!isRedisEnabled()) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    enableReadyCheck: true,
  });

  // Never crash the API if Redis is down
  redisClient.on("error", () => {
    // Swallow errors; callers already fallback gracefully
  });

  return redisClient;
};

const getNamespaceVersionKey = (namespace) => `cache:ns:${namespace}:v`;

const getNamespaceVersion = async (namespace) => {
  const client = getRedisClient();
  if (!client) return null;

  const versionKey = getNamespaceVersionKey(namespace);

  let version = await client.get(versionKey);
  if (!version) {
    await client.set(versionKey, "1");
    version = "1";
  }
  return version;
};

const bumpNamespaceVersion = async (namespace) => {
  const client = getRedisClient();
  if (!client) return null;

  const versionKey = getNamespaceVersionKey(namespace);
  const nextVersion = await client.incr(versionKey);
  return String(nextVersion);
};

const getJson = async (key) => {
  const client = getRedisClient();
  if (!client) return null;

  const value = await client.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    // Corrupted cache entry - delete and treat as miss
    await client.del(key);
    return null;
  }
};

const setJson = async (key, data, ttlSeconds) => {
  const client = getRedisClient();
  if (!client) return;

  const ttl = Number(ttlSeconds);
  if (!Number.isFinite(ttl) || ttl <= 0) return;

  await client.set(key, JSON.stringify(data), "EX", ttl);
};

module.exports = {
  isRedisEnabled,
  getRedisClient,
  getNamespaceVersion,
  bumpNamespaceVersion,
  getJson,
  setJson,
};
