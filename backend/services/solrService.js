const http = require("http");
const https = require("https");

const isSolrEnabled = () => {
  if (process.env.SOLR_ENABLED !== "true") return false;
  return Boolean(process.env.SOLR_URL);
};

const requestJson = async ({ method, url, body, timeoutMs = 2500 }) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;

    const payload = body ? JSON.stringify(body) : null;

    const req = client.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        headers: {
          Accept: "application/json",
          ...(payload
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
          if (!ok) {
            return reject(
              new Error(`Solr request failed (${res.statusCode}): ${data.slice(0, 500)}`)
            );
          }

          if (!data) return resolve(null);
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Failed to parse Solr JSON response"));
          }
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Solr request timed out"));
    });

    if (payload) req.write(payload);
    req.end();
  });
};

const solrSelect = async ({ q, rows = 20 }) => {
  const base = process.env.SOLR_URL;
  const params = new URLSearchParams({
    wt: "json",
    defType: "edismax",
    q: q || "*:*",
    qf: "name_t description_t",
    fl: "id,entityType_s,entityId_s,name_t,score",
    rows: String(rows),
  });

  const url = `${base}/select?${params.toString()}`;
  return requestJson({ method: "GET", url });
};

const solrAddDocuments = async (docs, { commit = true } = {}) => {
  const base = process.env.SOLR_URL;
  const url = `${base}/update?wt=json${commit ? "&commit=true" : ""}`;
  return requestJson({ method: "POST", url, body: docs, timeoutMs: 5000 });
};

const solrDeleteAll = async ({ commit = true } = {}) => {
  const base = process.env.SOLR_URL;
  const url = `${base}/update?wt=json${commit ? "&commit=true" : ""}`;
  return requestJson({
    method: "POST",
    url,
    body: { delete: { query: "*:*" } },
    timeoutMs: 5000,
  });
};

module.exports = {
  isSolrEnabled,
  solrSelect,
  solrAddDocuments,
  solrDeleteAll,
};
