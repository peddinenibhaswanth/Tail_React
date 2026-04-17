const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

function parseArgs(argv) {
  const args = {
    target: "http://localhost:5000",
    redis: "both", // off | on | both
    outdir: path.join("test-reports", "benchmarks"),
  };

  for (const a of argv) {
    if (a.startsWith("--target=")) args.target = a.slice("--target=".length);
    else if (a.startsWith("--redis=")) args.redis = a.slice("--redis=".length);
    else if (a.startsWith("--outdir=")) args.outdir = a.slice("--outdir=".length);
  }

  return args;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveWithinBackend(relPath) {
  const backendRoot = path.resolve(__dirname, "..");
  const resolved = path.resolve(backendRoot, relPath);
  if (!resolved.startsWith(backendRoot + path.sep)) {
    throw new Error("outdir must be within the backend folder");
  }
  return resolved;
}

function artilleryCmdPath() {
  const backendRoot = path.resolve(__dirname, "..");
  const bin = process.platform === "win32" ? "artillery.cmd" : "artillery";
  return path.join(backendRoot, "node_modules", ".bin", bin);
}

function runArtillery({ yamlFile, target, outputFile }) {
  return new Promise((resolve, reject) => {
    const cmd = artilleryCmdPath();
    const backendRoot = path.resolve(__dirname, "..");

    const child = spawn(
      cmd,
      ["run", "--target", target, "--output", outputFile, yamlFile],
      {
        stdio: "inherit",
        env: { ...process.env },
        cwd: backendRoot,
        shell: process.platform === "win32",
      }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`artillery exited with code ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!isHttpUrl(args.target)) {
    console.error("Invalid --target. Must be an http(s) URL.");
    process.exit(2);
  }

  const redisModes =
    args.redis === "both" ? ["off", "on"] : [String(args.redis)];
  for (const m of redisModes) {
    if (m !== "off" && m !== "on") {
      console.error("Invalid --redis. Use off | on | both.");
      process.exit(2);
    }
  }

  const outDirAbs = resolveWithinBackend(args.outdir);
  fs.mkdirSync(outDirAbs, { recursive: true });

  const benchmarksDir = path.resolve(__dirname, "..", "benchmarks");
  const productsYaml = path.join(benchmarksDir, "products.yml");
  const vetsYaml = path.join(benchmarksDir, "veterinaries.yml");

  const missing = [productsYaml, vetsYaml].filter((p) => !fs.existsSync(p));
  if (missing.length) {
    console.error(`Missing benchmark config(s): ${missing.join(", ")}`);
    process.exit(2);
  }

  for (const mode of redisModes) {
    const suffix = mode === "on" ? "redis-on" : "redis-off";

    console.log(
      `\nNOTE: This script does not start/stop the backend. Before running (${suffix}), start the backend with REDIS_ENABLED=${
        mode === "on" ? "true" : "false"
      }${mode === "on" ? " and a valid REDIS_URL" : ""}.`
    );

    const productsOut = path.join(outDirAbs, `products.${suffix}.json`);
    const vetsOut = path.join(outDirAbs, `veterinaries.${suffix}.json`);

    console.log(`\n=== Benchmark (${suffix}) products ===`);
    await runArtillery({
      yamlFile: productsYaml,
      target: args.target,
      outputFile: productsOut,
    });

    console.log(`\n=== Benchmark (${suffix}) veterinaries ===`);
    await runArtillery({
      yamlFile: vetsYaml,
      target: args.target,
      outputFile: vetsOut,
    });

    console.log(`\nSaved:`);
    console.log(`- ${path.relative(path.resolve(__dirname, ".."), productsOut)}`);
    console.log(`- ${path.relative(path.resolve(__dirname, ".."), vetsOut)}`);
  }

  console.log(
    "\nTip: summarize outputs with: node scripts/summarizeArtillery.js <file.json>"
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
