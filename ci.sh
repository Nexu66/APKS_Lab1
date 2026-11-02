#!/usr/bin/env bash
# Build & test pipeline for Linux/macOS (also works in Git Bash on Windows):
# Node.js check -> npm ci -> tsc -> Vitest -> esbuild bundle + SEA executable -> smoke test.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) EXE="build/bin/hello.exe" ;;
  *) EXE="build/bin/hello" ;;
esac

echo "==> [1/6] Checking Node.js (>= 26) and npm"
node -e 'const major = Number(process.versions.node.split(".")[0]);
if (major < 26) { console.error("ERROR: Node.js >= 26 is required, found " + process.version); process.exit(1); }
console.log("node " + process.version);'
echo "npm $(npm --version)"

echo "==> [2/6] Installing dependencies from package-lock.json (npm ci)"
npm ci --no-audit --no-fund

echo "==> [3/6] Type checking (tsc --noEmit)"
npm run typecheck

echo "==> [4/6] Running unit tests (Vitest)"
npm run test:ci

echo "==> [5/6] Building executable $EXE (esbuild + node --build-sea)"
npm run build

echo "==> [6/6] Smoke test of the executable"
OUTPUT="$("./$EXE" | tr -d '\r')"
echo "$OUTPUT"
if [ "$OUTPUT" != "Hello, World!" ]; then
  echo "ERROR: unexpected output from $EXE" >&2
  exit 1
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "### $(uname -s): typecheck and tests passed, executable \`$EXE\` prints \`$OUTPUT\`" >> "$GITHUB_STEP_SUMMARY"
fi
echo "CI: SUCCESS"
