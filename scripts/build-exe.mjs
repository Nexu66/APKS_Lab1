// Builds the standalone executable build/bin/hello[.exe] from the esbuild bundle
// using Node.js Single Executable Applications (`node --build-sea`).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const bundle = join(root, "build", "bundle", "hello.cjs");
const binDir = join(root, "build", "bin");
const exe = join(binDir, process.platform === "win32" ? "hello.exe" : "hello");
const seaConfig = join(root, "build", "sea-config.json");

if (!existsSync(bundle)) {
  console.error(`ERROR: ${bundle} not found; run "npm run bundle" first`);
  process.exit(1);
}

mkdirSync(binDir, { recursive: true });
writeFileSync(
  seaConfig,
  JSON.stringify({ main: bundle, output: exe, disableExperimentalSEAWarning: true }, null, 2),
);

// Copies the running Node.js binary and injects the bundle into it.
execFileSync(process.execPath, ["--build-sea", seaConfig], { stdio: "inherit" });

// macOS refuses to run a modified binary until it is signed again (ad-hoc signature).
if (process.platform === "darwin") {
  execFileSync("codesign", ["--sign", "-", "--force", exe], { stdio: "inherit" });
}

console.log(`Built ${exe}`);
