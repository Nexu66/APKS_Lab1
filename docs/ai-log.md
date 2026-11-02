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
