/*
  Bump Redis cache namespace versions.
  Usage:
    node scripts/bumpDashboardCache.js

  Notes:
  - Only affects caches if REDIS_ENABLED is not "false" and REDIS_URL is set.
*/

require("dotenv").config();
const { bumpNamespaceVersion, isRedisEnabled } = require("../services/cacheService");

async function main() {
  if (!isRedisEnabled()) {
    console.log("Redis caching is disabled; nothing to bump.");
    return;
  }

  const namespaces = ["dashboard", "dashboard_admin"]; // keep both to be safe
  for (const ns of namespaces) {
    const next = await bumpNamespaceVersion(ns);
    console.log(`Bumped cache namespace '${ns}' to version ${next}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
