---
name: project-scaffold
description: Create the minimal cross-platform TypeScript Hello World project (base package.json, src/, README section, docs/usage.md) and provide the .gitignore / .gitattributes templates. Use for /create-project and /git-init, or when the project skeleton is missing.
---

# Skill: project-scaffold

## Коли застосовувати

- Команда `/create-project` (крок 2 оркестратора `/init`) — створення початкового проєкту.
- Команда `/git-init` (крок 1) — бере з цього skill шаблони `.gitignore` і `.gitattributes`.
- У репозиторії немає `package.json` або `src/index.ts`.

Не застосовувати для конфігурації складання і тестів (skill `build-and-test`) та CI (skill `github-actions`).

## Вхідні дані

| Параметр | За замовчуванням | Опис |
|---|---|---|
| `language` | `typescript` | інші значення не підтримуються (варіант 6) → помилка |
| `project_name` | `hello` | значення поля `name` у `package.json` (лише `[a-z0-9-]`) |

Передумови: Git-репозиторій (виконано `/git-init`), Node.js ≥ 26 з npm (`node --version`).

## Результат

| Файл | Призначення |
|---|---|
| `.gitignore` | ігнорування `node_modules/`, `build/`, секретів (створює / доповнює `/git-init`) |
| `.gitattributes` | LF для `*.sh`, CRLF для `*.bat` (створює / доповнює `/git-init`) |
| `package.json` | базовий маніфест npm: `"type": "module"`, `engines.node >= 26`, скрипт `start` |
| `src/greet.ts` | текст привітання і функція `greet()` |
| `src/main.ts` | функція `main()`: друкує привітання, повертає код виходу |
| `src/index.ts` | точка входу: `process.exitCode = main()` |
| `README.md` | розділ «Проєкт Hello World» (дописується в кінець файлу) |
| `docs/usage.md` | інструкція запуску агента, збірки, тестів і застосунку |

Каталоги після виконання: `src/`, `docs/` (`tests/` і `scripts/` створює skill `build-and-test`).
Команда запуску: `npm start` (Node.js ≥ 26 виконує `.ts` напряму, без компіляції).

## Порядок дій

1. Перевір вхідні дані: `language` має бути `typescript`, `project_name` — відповідати `[a-z0-9-]+`.
2. Для кожного файлу з таблиці «Результат» застосуй правило manifest: `CREATE` (файлу немає) /
   `SKIP` (збігається з шаблоном) / `DIFF` (відрізняється → не перезаписувати, показати різницю
   і запитати користувача). `.gitignore` і `.gitattributes` створює `/git-init`.
3. `package.json`: якщо файл уже існує (наприклад, після `/create-build`), не перезаписуй його —
   перевір ключі `name`, `type`, `engines.node`, `scripts.start` і лише відсутні додай через
   `npm pkg set` (це ідемпотентно і не дублює ключі).
4. `README.md`: якщо в ньому немає маркера `<!-- project:hello -->`, допиши в кінець розділ із
   шаблону (через порожній рядок); якщо маркер є — `SKIP`.
5. Виконай «Перевірки». Будь-яка невдала перевірка = помилка кроку.

## Шаблони

### `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output and test reports
build/
dist/
coverage/
*.tsbuildinfo

# Logs and caches
npm-debug.log*
.npm/

# Secrets and local environment
.env
.env.*
*.pem
*.key

# Local Claude Code settings (personal permissions)
.claude/settings.local.json

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/
```

### `.gitattributes`

```gitignore
# Normalise line endings: shell scripts stay LF and batch files CRLF on every OS.
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
```

### `package.json`

Поле `name` = `project_name`.

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
    "start": "node src/index.ts"
  }
}
```

### `src/greet.ts`

```ts
/** Greeting printed by the Hello World application. */
export const GREETING = "Hello, World!";

/** Returns the greeting text. */
export function greet(): string {
  return GREETING;
}
```

### `src/main.ts`

```ts
import { greet } from "./greet.ts";

/** Prints the greeting and returns the process exit code. */
export function main(): number {
  console.log(greet());
  return 0;
}
```

### `src/index.ts`

```ts
// Entry point for `npm start` (node src/index.ts) and for the bundled executable `hello`.
import { main } from "./main.ts";

process.exitCode = main();
```

### Розділ `README.md`

```markdown
<!-- project:hello -->
## Проєкт Hello World

Мінімальний кросплатформний застосунок на TypeScript, згенерований агентом `build-engineer`
(`/create-project`, `/create-build`, `/create-actions`). Виводить `Hello, World!`.

| Дія | Linux / macOS | Windows |
|---|---|---|
| Повна збірка і тести | `./ci.sh` | `.\ci.bat` |
| Запуск застосунку | `./run.sh` | `.\run.bat` |
| Запуск із вихідного коду | `npm start` | `npm start` |
| Лише юніт-тести | `npm test` | `npm test` |

Виконуваний файл: `build/bin/hello` (Windows: `build\bin\hello.exe`). Детальніше — [`docs/usage.md`](docs/usage.md).
```

### `docs/usage.md`

````markdown
# Інструкція з використання

## 1. Передумови

| Інструмент | Версія | Перевірка |
|---|---|---|
| Git | будь-яка актуальна | `git --version` |
| Node.js (LTS) з npm | ≥ 26 | `node --version`, `npm --version` |
| Claude Code | актуальна | `claude --version` (лише для запуску агента) |

Linux / macOS — bash; Windows — `cmd` або PowerShell (`ci.sh` також працює в Git Bash).
На Windows запускайте скрипти з явним шляхом (`.\ci.bat`, `.\run.bat`): PowerShell і середовища зі
змінною `NoDefaultCurrentDirectoryInExePath=1` (зокрема Claude Code) не шукають команди в поточному каталозі.

## 2. Запуск AI-агента

```bash
git clone https://github.com/Nexu66/APKS_Lab1.git
cd APKS_Lab1
git switch develop
git switch -c feature/lab1-ts-hello   # агент працює лише у feature-гілці
claude                                # інтерактивна сесія Claude Code
```

Команди в сесії Claude Code:

| Команда | Дія |
|---|---|
| `/init` | оркестратор: `/git-init` → `/create-project` → `/create-build` → `/create-actions` → `/check` |
| `/git-init` | перевіряє репозиторій, доповнює `.gitignore` / `.gitattributes`, показує `git status` |
| `/create-project` | створює Hello World (`package.json`, `src/`, розділ README, цей файл) |
| `/create-build` | створює `tsconfig.json`, тести Vitest, npm scripts, `ci.*` / `run.*` і збирає проєкт |
| `/create-actions` | створює `.github/workflows/ci.yml` |
| `/check` | лише перевіряє проєкт, нічого не змінює |

Неінтерактивний запуск окремої команди: `claude -p "/check"`.

## 3. Локальна перевірка без Claude Code

```bash
node .claude/scripts/check.mjs                    # усі групи перевірок (включно зі збіркою)
node .claude/scripts/check.mjs --no-build         # без запуску ci.sh / ci.bat
node .claude/scripts/check.mjs --only agent       # лише файли агента
node .claude/scripts/check.mjs --only workflow    # лише .github/workflows/ci.yml
```

Групи: `agent`, `structure`, `git`, `build`, `workflow`. Код виходу `0` — `RESULT: PASS`,
`1` — є хоча б один `[FAIL]`.

## 4. Збірка і тести

```bash
./ci.sh      # Linux / macOS / Git Bash
```

```bat
.\ci.bat     :: Windows (cmd / PowerShell)
```

Кроки скрипта: перевірка Node.js ≥ 26 → `npm ci` → `npm run typecheck` → `npm run test:ci` →
`npm run build` → smoke-тест виконуваного файлу. Успіх — рядок `CI: SUCCESS` і код виходу 0.

Окремі npm scripts:

| Команда | Дія |
|---|---|
| `npm ci` | встановлення залежностей із `package-lock.json` |
| `npm run typecheck` | перевірка типів `tsc --noEmit` |
| `npm test` | юніт-тести Vitest |
| `npm test -- -t BasicAddition` | лише тест `BasicAddition` |
| `npm run test:ci` | тести зі звітом JUnit `build/test-results/junit.xml` |
| `npm run bundle` | bundle `build/bundle/hello.cjs` (esbuild) |
| `npm run package` | виконуваний файл `build/bin/hello[.exe]` (`node --build-sea`) |
| `npm run build` | `bundle` + `package` |
| `npm start` | запуск із вихідного коду (`node src/index.ts`) |

## 5. Запуск застосунку

```bash
./run.sh                 # Linux / macOS
./build/bin/hello        # напряму
```

```bat
.\run.bat
.\build\bin\hello.exe
```

Очікуваний вивід: `Hello, World!`, код виходу 0.

## 6. Артефакти (не потрапляють у Git)

| Шлях | Вміст |
|---|---|
| `build/bin/hello[.exe]` | самостійний виконуваний файл |
| `build/bundle/hello.cjs` | bundle застосунку |
| `build/test-results/junit.xml` | звіт тестів |
| `node_modules/` | залежності |

## 7. GitHub Actions

Workflow `.github/workflows/ci.yml` запускається на `push` (`develop`, `master`, `main`,
`feature/**`) і `pull_request` до `develop` / `master` / `main`. Одна job із матрицею
`ubuntu-latest`, `windows-latest`, `macos-latest` викликає `ci.sh` / `ci.bat` і зберігає
артефакти `hello-<os>` і `test-results-<os>`.

## 8. Перевірка реакції на помилку

1. Тимчасово змініть у `src/calc.ts` `return a + b;` на `return a + b + 1;`.
2. `npm test` → `FAIL tests/hello.test.ts > BasicAddition` (`expected 6 to be 5`).
3. `.\ci.bat` / `./ci.sh` → `CI: FAILED`, код виходу 1; `/check` → `[FAIL] build: ...`, `RESULT: FAIL`.
4. Поверніть `return a + b;` і переконайтеся, що `/check` знову повертає `RESULT: PASS`.
````

## Перевірки

| Перевірка | Команда | Очікуваний результат |
|---|---|---|
| вихідні файли існують | `ls package.json src/index.ts src/main.ts src/greet.ts docs/usage.md` | усі файли є |
| команда запуску працює | `npm start --silent` | рядок `Hello, World!`, код виходу 0 |
| README доповнено рівно один раз | `grep -c "<!-- project:hello -->" README.md` | `1` |
| `package.json` валідний | `npm pkg get name type` | `"hello"`, `"module"` |

## Приклад

Вхід: `/create-project` (`language=typescript`, `project_name=hello`) у feature-гілці після `/git-init`.

Очікуваний результат:

```text
CREATE package.json
CREATE src/greet.ts
CREATE src/main.ts
CREATE src/index.ts
UPDATE README.md (+ розділ «Проєкт Hello World»)
CREATE docs/usage.md
$ npm start --silent
Hello, World!
```

Повторний запуск: усі файли `SKIP`, `README.md` не змінюється.

## Типовий сценарій помилки

| Симптом | Причина | Дія |
|---|---|---|
| `SyntaxError: Unexpected token ':'` або `Unknown file extension ".ts"` при `npm start` | Node.js без підтримки TypeScript (< 22.18) | зупинитися: потрібен Node.js ≥ 26 LTS |
| `ERR_MODULE_NOT_FOUND ... src/greet` | імпорт без розширення `.ts` | імпорти з розширенням `.ts`, як у шаблоні |
| `language=python` | непідтримуваний варіант | зупинитися: `project-scaffold supports only language=typescript (variant 6)` |
| файл існує і відрізняється від шаблону | ручні зміни користувача | не перезаписувати; показати diff і запитати |
