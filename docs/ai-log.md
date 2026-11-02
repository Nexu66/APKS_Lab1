# Журнал взаємодії з AI

AI-інструмент: **Claude Code** (CLI) з моделлю **Claude Opus 5.5**. Студент: Кулинський Я.О., КІ-408,
варіант 6 (№ 12 у списку): TypeScript, npm scripts, Vitest.

Журнал містить запити до AI, важливі відповіді, знайдені помилки та прийняті рішення.

## 1. Проєктування і створення агента (гілка `develop`)

| № | Запит / дія | Відповідь / результат | Рішення |
|---|---|---|---|
| 1 | «Допоможи з лабораторною роботою: ось методичка `task1.pdf` і приклад іншого студента. Спершу розпиши, що треба зробити.» | AI проаналізував методичку і приклад; варіант визначено як 6 (№ 12 → 6 за тим самим правилом, що № 20 → 2 у прикладі); складено план етапів і список ручних дій | студент підтвердив варіант 6, AI-інструмент — Claude Code (як у прикладі) |
| 2 | «Встанови Node.js LTS» | `winget install OpenJS.NodeJS.LTS` → Node.js 26.13.0, npm 11.20.0 | Node.js ≥ 26 — передумова агента |
| 3 | Перевірка конфлікту назви `/init` | у Claude Code є вбудована `/init`; тест `claude -p "/init"` з проєктною командою-зондом повернув `CUSTOM_INIT_OK` | проєктна `.claude/commands/init.md` перекриває вбудовану → назву з методички збережено |
| 4 | Вибір інструментів складання для TypeScript | прототип: `tsc --noEmit` (TypeScript 7.0.2), Vitest 5.1.0 зі звітом JUnit, `esbuild` 0.28.2, виконуваний файл через `node --build-sea` (Node.js 26) → `hello.exe` друкує `Hello, World!` | TypeScript виконується Node.js напряму (`npm start`), виконуваний файл — Node.js SEA без сторонніх пакувальників |
| 5 | Перевірка шаблонів перед вбудовуванням у skills | `ci.bat`: 6 тестів пройшли, `CI: SUCCESS`; `ci.sh` (Git Bash): `CI: SUCCESS`; зі зламаним `add` — `BasicAddition` `expected 6 to be 5`, `ci.bat` → код 1 | шаблони в skills вставлено скриптом із перевірених файлів, щоб уникнути розбіжностей |
| 6 | Помилка інструменту: довгий bash heredoc із кількома файлами | `unexpected EOF while looking for matching '''` — файли не записано | файли шаблонів записано окремо інструментом Write; на результат не вплинуло |
| 7 | Створення агента | manifest + `CLAUDE.md` + архітектура, 3 skills, 5 commands + `/init`, `check.mjs` — 3 окремі коміти | `node .claude/scripts/check.mjs --only agent` → `RESULT: PASS (17 checks)` |

## 2. Запуск `/init` — 2026-11-02, гілка `feature/lab1-ts-hello`

Кроки оркестратора виконано в сесії Claude Code за інструкціями `.claude/commands/*.md`; файли
створено з шаблонів skills за правилом `CREATE` / `SKIP` / `DIFF`.

Передумови: git 2.52.0, Node.js v26.13.0, npm 11.20.0; гілку `feature/lab1-ts-hello` створено від
`develop`; робоче дерево чисте.

| Крок | Command | Результат | Перевірка |
|---|---|---|---|
| 1 | `/git-init` | `CREATE .gitignore`, `CREATE .gitattributes` | `git check-ignore` → `build/`, `node_modules/`; дублікатів немає; артефакти не відстежуються |
| 2 | `/create-project` | `CREATE package.json`, `src/greet.ts`, `src/main.ts`, `src/index.ts`, `docs/usage.md`; `UPDATE README.md` (+ розділ «Проєкт Hello World») | `npm start` → `Hello, World!`; маркер розділу в README — 1; повторний запуск кроків 1–2 — усі файли `SKIP` |
| 3 | `/create-build` | `npm pkg set` (6 scripts), `npm install --save-exact` (42 пакети) → `package-lock.json`; `CREATE tsconfig.json`, `scripts/build-exe.mjs`, `src/calc.ts`, `vitest.config.ts`, `tests/hello.test.ts`, `ci.sh`, `ci.bat`, `run.sh`, `run.bat`; `unix2dos` для `*.bat`, біт виконання `100755` для `*.sh` | `ci.bat` → `Tests 6 passed (6)`, `build\bin\hello.exe` → `Hello, World!`, `CI: SUCCESS`; `ci.sh` (Git Bash) → `CI: SUCCESS`; `npm test -- -t BasicAddition` → `1 passed, 5 skipped`; `junit.xml`: `failures="0"`; `package.json` збігається з шаблоном skill |
| 4 | `/create-actions` | `CREATE .github/workflows/ci.yml` | YAML валідний; `run:` лише `bash ./ci.sh` і `call ci.bat`; `check.mjs --only workflow` → `RESULT: PASS (9 checks)` |
| 5 | `/check` (1-й запуск) | `[FAIL] build: ci.bat succeeded — exit code 1`; у лозі: `'ci.bat' is not recognized as an internal or external command` | `RESULT: FAIL (1 of 47 failed)` → **`INIT FAILED at step 5/5 (check)`**, оркестратор зупинився (помилка 1) |
| 5 | виправлення інструкцій агента | `check.mjs` запускає `.\ci.bat`; skills / commands / документація — `.\ci.bat`, `.\run.bat`; новий рядок у таблиці типових помилок `build-and-test` | коміт `fix(agent): run ci.bat with an explicit .\ path` перенесено в `develop` (`git cherry-pick`) |
| 5 | `/check` (2-й запуск) | `ci.bat` → `CI: SUCCESS`, `hello.exe` → `Hello, World!`, `BasicAddition` пройшов | **`RESULT: PASS (47 checks)`** → `INIT OK` |

### Повторний запуск `/init`

Кроки 1–4 виконано повторно на готовому проєкті: усі файли — `SKIP`, `npm pkg set` і
`npm install` — `up to date`, `git status` порожній. Для `package.json` крок 2 повідомляє `DIFF`
щодо базового шаблону — це очікувано: після кроку 3 у файлі є додаткові ключі; базові ключі
(`name`, `type`, `engines.node`, `scripts.start`) збігаються, файл не перезаписано.

### Навмисно зламана перевірка

У `src/calc.ts` тимчасово змінено `return a + b;` на `return a + b + 1;`:

```text
 FAIL  tests/hello.test.ts > BasicAddition
AssertionError: expected 6 to be 5 // Object.is equality
      Tests  4 failed | 2 passed (6)
CI: FAILED
---- ci.bat finished with exit code 1 ----
[FAIL] build: ci.bat succeeded — exit code 1
[FAIL] build: test BasicAddition passed — BasicAddition failed or was skipped
[FAIL] build: no failed tests in the report — failures=4/4, errors=0/0
RESULT: FAIL (3 of 8 failed)
```

Після повернення `return a + b;` повний `/check` знову повертає `RESULT: PASS (47 checks)`.

## 3. Помилки та їх виправлення

1. **`ci.bat` не знаходився під час `/check` (помилка інструкцій агента).** Claude Code запускає
   команди зі змінною середовища `NoDefaultCurrentDirectoryInExePath=1`, тому `cmd.exe` не шукає
   `ci.bat` у поточному каталозі (PowerShell без `.\` не шукає ніколи). Напряму з повним шляхом
   скрипт проходив, а через `check.mjs` — `exit code 1`. Виправлено в інструкціях, а не в
   результаті: `check.mjs` викликає `.\ci.bat`, skills / commands / документація використовують
   `.\ci.bat` і `.\run.bat`, у skill `build-and-test` додано рядок у таблицю типових помилок.
   Виправлення перенесено в `develop`, тому повторний запуск агента з `develop` його вже містить.
2. **Помилка інструменту під час проєктування skills.** Довгий bash-heredoc із кількома файлами
   завершився `unexpected EOF while looking for matching '''`, файли не були записані. Рішення:
   записувати шаблони окремо інструментом Write. На результат не вплинуло.
3. **Попередження `npm warn install-scripts ... esbuild (postinstall)`** (npm 11.20). Проаналізовано:
   esbuild працює без postinstall, бо бере готовий бінарний файл з optional-пакета
   `@esbuild/<platform>`. Рішення: не дозволяти install-скрипти без потреби; попередження
   задокументовано у skill `build-and-test`.
