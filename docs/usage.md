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
