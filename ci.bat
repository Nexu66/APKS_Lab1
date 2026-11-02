@echo off
rem Build & test pipeline for Windows:
rem Node.js check -> npm ci -> tsc -> Vitest -> esbuild bundle + SEA executable -> smoke test.
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
set "EXE=build\bin\hello.exe"

echo ==^> [1/6] Checking Node.js (^>= 26) and npm
node -e "const major = Number(process.versions.node.split('.')[0]); if (major < 26) { console.error('ERROR: Node.js >= 26 is required, found ' + process.version); process.exit(1); } console.log('node ' + process.version);" || goto :fail
for /f "delims=" %%V in ('npm --version') do echo npm %%V

echo ==^> [2/6] Installing dependencies from package-lock.json (npm ci)
call npm ci --no-audit --no-fund || goto :fail

echo ==^> [3/6] Type checking (tsc --noEmit)
call npm run typecheck || goto :fail

echo ==^> [4/6] Running unit tests (Vitest)
call npm run test:ci || goto :fail

echo ==^> [5/6] Building executable %EXE% (esbuild + node --build-sea)
call npm run build || goto :fail

echo ==^> [6/6] Smoke test of the executable
if not exist "%EXE%" (
  echo ERROR: %EXE% was not created 1>&2
  goto :fail
)
set "OUTPUT="
for /f "delims=" %%L in ('"%EXE%"') do set "OUTPUT=%%L"
echo %OUTPUT%
if not "%OUTPUT%"=="Hello, World!" (
  echo ERROR: unexpected output from %EXE% 1>&2
  goto :fail
)

if defined GITHUB_STEP_SUMMARY echo ### Windows: typecheck and tests passed, executable `%EXE%` prints `%OUTPUT%`>>"%GITHUB_STEP_SUMMARY%"
echo CI: SUCCESS
exit /b 0

:fail
echo CI: FAILED 1>&2
exit /b 1
