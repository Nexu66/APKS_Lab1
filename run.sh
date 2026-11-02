#!/usr/bin/env bash
# Runs the Hello World application: the built executable if present, otherwise from source.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
for EXE in "$ROOT/build/bin/hello" "$ROOT/build/bin/hello.exe"; do
  if [ -x "$EXE" ]; then
    exec "$EXE" "$@"
  fi
done

echo "build/bin/hello not found, running from source (node src/index.ts); run ./ci.sh to build it" >&2
exec node "$ROOT/src/index.ts" "$@"
