---
name: build-and-test
description: Add the build system (npm scripts with tsc, esbuild and node --build-sea), the test function `add` and Vitest unit tests (BasicAddition), plus ci.sh / ci.bat build scripts and run.sh / run.bat launchers. Use for /create-build or when the build or test configuration is missing or broken.
---

# Skill: build-and-test

## Коли застосовувати

- Команда `/create-build` (крок 3 оркестратора `/init`).
- Немає `tsconfig.json`, конфігурації Vitest, тестів або скриптів `ci.*` / `run.*`.
- `ci.sh` / `ci.bat` падає через конфігурацію складання (а не через помилку в коді застосунку).

## Вхідні дані

| Вхід | Звідки |
|---|---|
| `package.json` зі скриптом `start`, `src/main.ts`, `src/greet.ts`, `src/index.ts` | skill `project-scaffold` |
| Node.js ≥ 26 з npm, доступ до npm registry | середовище |

Залежності (лише `devDependencies`, версії фіксуються точно):

| Пакет | Версія | Призначення |
|---|---|---|
| `typescript` | `7.0.2` | перевірка типів `tsc --noEmit` |
| `vitest` | `5.1.0` | юніт-тести, звіт JUnit |
| `esbuild` | `0.28.2` | bundle `src/index.ts` → `build/bundle/hello.cjs` |
| `@types/node` | `26.6.6` | типи Node.js (`process`, `console`) |
| `yaml` | `2.9.1` | валідація `ci.yml` у `.claude/scripts/check.mjs` |

## Результат

| Файл | Призначення |
|---|---|
| `package.json` | npm scripts `typecheck`, `test`, `test:ci`, `bundle`, `package`, `build` + `devDependencies` |
| `package-lock.json` | зафіксоване дерево залежностей (для `npm ci`) |
| `tsconfig.json` | strict-перевірка типів без генерації файлів |
| `vitest.config.ts` | конфігурація Vitest |
| `src/calc.ts` | тестова функція `add(a, b)` |
| `tests/hello.test.ts` | юніт-тести: `BasicAddition`, `AdditionCases`, `Greeting`, `MainPrintsGreeting` |
| `scripts/build-exe.mjs` | збірка виконуваного файлу через `node --build-sea` (+ підпис на macOS) |
| `ci.sh` / `ci.bat` | повний конвеєр збірки і тестування для Linux/macOS / Windows |
| `run.sh` / `run.bat` | запуск застосунку |

Побічні результати (ігноруються Git): `node_modules/`, `build/bundle/hello.cjs`,
`build/bin/hello[.exe]`, `build/test-results/junit.xml`, `build/sea-config.json`.

## Підкроки

Skill поділено на три підкроки; їх можна виконувати і перевіряти окремо.

| Підкрок | Що робить | Перевірка |
|---|---|---|
| `build-config` | npm scripts, `devDependencies`, `package-lock.json`, `tsconfig.json`, `scripts/build-exe.mjs` | `npm run typecheck`, `npm run build` |
| `unit-tests` | `src/calc.ts`, `vitest.config.ts`, `tests/hello.test.ts` | `npm test` |
| `ci-scripts` | `ci.sh`, `ci.bat`, `run.sh`, `run.bat` | `.\ci.bat` (Windows) / `./ci.sh` (Linux, macOS) |

## Порядок дій

1. **npm scripts** — додай або онови ключі (ідемпотентно, дублікатів не буде):

   ```bash
   npm pkg set "scripts.typecheck=tsc --noEmit" \
     "scripts.test=vitest run" \
     "scripts.test:ci=vitest run --reporter=default --reporter=junit --outputFile.junit=build/test-results/junit.xml" \
     "scripts.bundle=esbuild src/index.ts --bundle --platform=node --format=cjs --target=node26 --log-level=warning --outfile=build/bundle/hello.cjs" \
     "scripts.package=node scripts/build-exe.mjs" \
     "scripts.build=npm run bundle && npm run package"
   ```

2. **devDependencies** — встанови з точними версіями (створює / оновлює `package-lock.json`):

   ```bash
   npm install --save-dev --save-exact --no-audit --no-fund @types/node@26.6.6 esbuild@0.28.2 typescript@7.0.2 vitest@5.1.0 yaml@2.9.1
   ```

   Попередження `npm warn install-scripts ... esbuild (postinstall)` — не помилка: esbuild бере
   готовий бінарний файл з optional-пакета `@esbuild/<platform>`. Не дозволяй install-скрипти без
   запиту користувача.
3. Створи файли з розділу «Шаблони» за правилом `CREATE` / `SKIP` / `DIFF`.
4. **Кінці рядків**: `*.bat` мають бути CRLF, `*.sh` — LF. Після запису виконай
   `unix2dos ci.bat run.bat` і `dos2unix ci.sh run.sh` (Git Bash / Linux / macOS) або еквівалент у
   PowerShell. `.gitattributes` (`*.sh eol=lf`, `*.bat eol=crlf`) закріплює це в Git.
5. **Біт виконання** для `ci.sh` і `run.sh`: `chmod +x ci.sh run.sh`; на Windows (файлова система не
   зберігає біт) — після `git add`: `git update-index --chmod=+x ci.sh run.sh`.
6. Виконай «Перевірки». Помилка тесту = помилка кроку; тести не можна пропускати чи послаблювати.

## Шаблони

Фінальний вигляд `package.json` після кроків 1–2 (ключі з `project-scaffold` не змінюються):

```json
{
  "name": "hello",
  "version": "1.0.0",
  "description": "Cross-platform Hello World (lab 1, variant 6: TypeScript + npm scripts + Vitest)",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=26"
  },
  "scripts": {
    "start": "node src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:ci": "vitest run --reporter=default --reporter=junit --outputFile.junit=build/test-results/junit.xml",
    "bundle": "esbuild src/index.ts --bundle --platform=node --format=cjs --target=node26 --log-level=warning --outfile=build/bundle/hello.cjs",
    "package": "node scripts/build-exe.mjs",
    "build": "npm run bundle && npm run package"
  },
  "devDependencies": {
    "@types/node": "26.6.6",
    "esbuild": "0.28.2",
    "typescript": "7.0.2",
    "vitest": "5.1.0",
    "yaml": "2.9.1"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["es2023"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["src", "tests", "vitest.config.ts"]
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

### `src/calc.ts`

```ts
/** Adds two numbers; this is the function covered by the BasicAddition unit test. */
export function add(a: number, b: number): number {
  return a + b;
}
```

### `tests/hello.test.ts`

```ts
import { expect, test, vi } from "vitest";
import { add } from "../src/calc.ts";
import { GREETING, greet } from "../src/greet.ts";
import { main } from "../src/main.ts";

test("BasicAddition", () => {
  expect(add(2, 3)).toBe(5);
});

test.each([
  [0, 0, 0],
  [-1, 1, 0],
  [2.5, 0.5, 3],
])("AdditionCases: add(%s, %s) = %s", (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

test("Greeting", () => {
  expect(greet()).toBe("Hello, World!");
  expect(GREETING).toBe(greet());
});

test("MainPrintsGreeting", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    expect(main()).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Hello, World!");
  } finally {
    log.mockRestore();
  }
});
```

### `scripts/build-exe.mjs`

```js
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
```

### `ci.sh` (LF, біт виконання)

```bash
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
```

### `ci.bat` (CRLF)

```bat
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
```

### `run.sh` (LF, біт виконання)

```bash
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
```

### `run.bat` (CRLF)

```bat
@echo off
rem Runs the Hello World application: the built executable if present, otherwise from source.
setlocal EnableExtensions
set "ROOT=%~dp0"
if exist "%ROOT%build\bin\hello.exe" (
  "%ROOT%build\bin\hello.exe" %*
  exit /b
)
echo build\bin\hello.exe not found, running from source (node src\index.ts); run ci.bat to build it 1>&2
node "%ROOT%src\index.ts" %*
exit /b
```

## Перевірки

| Перевірка | Команда | Очікуваний результат |
|---|---|---|
| перевірка типів | `npm run typecheck` | без помилок, код 0 |
| юніт-тести | `npm test` | `Tests 6 passed (6)` |
| тест `BasicAddition` | `npm test -- -t BasicAddition` | `1 passed`, решта `skipped` |
| повний конвеєр | Windows: `.\ci.bat`; Linux / macOS: `./ci.sh` | останній рядок `CI: SUCCESS`, код 0 |
| виконуваний файл | `build/bin/hello` (Windows: `build\bin\hello.exe`) | `Hello, World!`, код 0 |
| звіт тестів | `build/test-results/junit.xml` | є `testcase name="BasicAddition"` без `<failure>` |
| кінці рядків | `file ci.sh ci.bat run.sh run.bat` | `*.sh` без CRLF, `*.bat` — `with CRLF line terminators` |
| біт виконання | `git ls-files -s ci.sh run.sh` | режим `100755` |
| артефакти поза Git | `git check-ignore build/ node_modules/` | обидва шляхи виведено |

## Приклад

Вхід: `/create-build` після `/create-project` (є `package.json`, `src/*.ts`), Windows 11, Node.js 26.

Очікуваний результат:

```text
UPDATE package.json (scripts: typecheck, test, test:ci, bundle, package, build; devDependencies)
CREATE package-lock.json
CREATE tsconfig.json, vitest.config.ts, src/calc.ts, tests/hello.test.ts, scripts/build-exe.mjs
CREATE ci.sh, ci.bat, run.sh, run.bat
> .\ci.bat
==> [1/6] Checking Node.js (>= 26) and npm
...
 Tests  6 passed (6)
==> [6/6] Smoke test of the executable
Hello, World!
CI: SUCCESS
```

Повторний запуск: `npm pkg set` і `npm install` нічого не змінюють, файли — `SKIP`.

## Типовий сценарій помилки

| Симптом | Причина | Дія |
|---|---|---|
| `ci.bat`: «The system cannot find the batch label specified - fail» або випадкові «is not recognized» | `ci.bat` збережено з LF | `unix2dos ci.bat run.bat`; `.gitattributes`: `*.bat text eol=crlf` |
| `/usr/bin/env: 'bash\r': No such file or directory` | `ci.sh` збережено з CRLF | `dos2unix ci.sh run.sh`; `.gitattributes`: `*.sh text eol=lf` |
| `'ci.bat' is not recognized as an internal or external command` | PowerShell або змінна `NoDefaultCurrentDirectoryInExePath=1` (її встановлює Claude Code): `cmd` не шукає команди в поточному каталозі | запускати з явним шляхом `.\ci.bat`; так само робить `check.mjs` |
| `ci.bat` зупиняється після першого `npm` без помилки | `npm` у `.bat` викликано без `call` | завжди `call npm ...` |
| `TS5097: An import path can only end with a '.ts' extension...` | у `tsconfig.json` немає `allowImportingTsExtensions` | використати шаблон `tsconfig.json` |
| `TS2580: Cannot find name 'process'` | немає `@types/node` або `"types": ["node"]` | встановити `@types/node`, шаблон `tsconfig.json` |
| `node: bad option: --build-sea` | Node.js старіший за 25.5 | Node.js ≥ 26 (перевірка на кроці [1/6]) |
| macOS: процес `killed` при запуску `build/bin/hello` | підпис бінарного файлу зламано після вбудовування bundle | `scripts/build-exe.mjs` виконує `codesign --sign - --force` |
| `npm ci`: `package.json and package-lock.json are not in sync` | `package.json` змінено без `npm install` | повторити крок 2 і закомітити `package-lock.json` |
| `FAIL tests/hello.test.ts > BasicAddition` (`expected 6 to be 5`) | помилка у `add` | виправити код, а не тест; тести не пропускати |
