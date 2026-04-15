const fs = require("fs");

function pick(obj, path, fallback) {
  return (
    path
      .split(".")
      .reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
      ) ?? fallback
  );
}

function sumMatchingCounters(counters, re) {
  let sum = 0;
  for (const [k, v] of Object.entries(counters || {})) {
    if (re.test(k)) sum += Number(v || 0);
  }
  return sum;
}

function summarize(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  const aggregate = pick(json, "aggregate", {});
  const counters = pick(aggregate, "counters", {});

  const scenarios =
    counters["vusers.created"] ?? pick(aggregate, "scenariosCreated", null);
  const completed =
    counters["vusers.completed"] ??
    pick(aggregate, "scenariosCompleted", null);

  const first =
    pick(aggregate, "firstMetricAt", null) ?? pick(aggregate, "firstCounterAt", null);
  const last =
    pick(aggregate, "lastMetricAt", null) ?? pick(aggregate, "lastCounterAt", null);
  const durationSec =
    typeof first === "number" && typeof last === "number" && last > first
      ? (last - first) / 1000
      : null;

  const totalRequests =
    counters["http.requests"] ?? pick(aggregate, "requestsCompleted", null);

  const rps =
    durationSec && typeof totalRequests === "number"
      ? Number((totalRequests / durationSec).toFixed(3))
      : pick(aggregate, "rates.http.request_rate", null);

  const summaries = pick(aggregate, "summaries", {});
  const httpResponseTime =
    summaries["http.response_time"] ?? summaries["http.response_time.2xx"] ?? null;

  const latencyMeanMs =
    (httpResponseTime && httpResponseTime.mean !== undefined
      ? httpResponseTime.mean
      : null) ?? pick(aggregate, "latency.mean", null);

  const latencyP95Ms =
    (httpResponseTime && httpResponseTime.p95 !== undefined
      ? httpResponseTime.p95
      : null) ?? pick(aggregate, "latency.p95", null);

  const http2xx =
    sumMatchingCounters(counters, /^http\.codes\.2\d\d$/) ||
    pick(aggregate, "codes.200", 0);
  const http4xx =
    sumMatchingCounters(counters, /^http\.codes\.4\d\d$/) ||
    (pick(aggregate, "codes.400", 0) || 0) +
      (pick(aggregate, "codes.401", 0) || 0) +
      (pick(aggregate, "codes.403", 0) || 0) +
      (pick(aggregate, "codes.404", 0) || 0) +
      (pick(aggregate, "codes.429", 0) || 0);
  const http5xx =
    sumMatchingCounters(counters, /^http\.codes\.5\d\d$/) ||
    (pick(aggregate, "codes.500", 0) || 0) +
      (pick(aggregate, "codes.502", 0) || 0) +
      (pick(aggregate, "codes.503", 0) || 0) +
      (pick(aggregate, "codes.504", 0) || 0);

  return {
    file: filePath,
    scenarios,
    completed,
    rps,
    latencyMeanMs,
    latencyP95Ms,
    http2xx,
    http4xx,
    http5xx,
  };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/summarizeArtillery.js <artillery-output.json> [more.json ...]");
  process.exit(2);
}

for (const f of files) {
  try {
    const s = summarize(f);
    // Keep output stable + grep-friendly
    console.log(
      JSON.stringify(
        {
          file: s.file,
          scenarios: s.scenarios,
          completed: s.completed,
          rps: s.rps,
          latencyMeanMs: s.latencyMeanMs,
          latencyP95Ms: s.latencyP95Ms,
          http2xx: s.http2xx,
          http4xx: s.http4xx,
          http5xx: s.http5xx,
        },
        null,
        2
      )
    );
  } catch (e) {
    console.error(`Failed to summarize ${f}: ${e.message}`);
    process.exitCode = 1;
  }
}
