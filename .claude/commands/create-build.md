---
description: Create the build configuration, the test function, Vitest unit tests and ci/run scripts using the build-and-test skill, then build and test
argument-hint: "[build-config|unit-tests|ci-scripts]"
---

# Command: /create-build

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`). Аргументи: `$ARGUMENTS`
(необов’язково — назва одного підкроку skill; без аргументу виконуються всі три).

Застосуй skill **build-and-test**: `.claude/skills/build-and-test/SKILL.md`.

## Передумови

- Виконано `/create-project`: є `package.json` зі скриптом `start` і `src/main.ts`.
- Node.js ≥ 26 з npm і доступ до npm registry.

## Дії

1. Прочитай skill `build-and-test` повністю.
2. Виконай підкроки по черзі (або лише вказаний в аргументі):
   1. `build-config` — `npm pkg set` для scripts, `npm install --save-dev --save-exact ...`,
      `tsconfig.json`, `scripts/build-exe.mjs`;
   2. `unit-tests` — `src/calc.ts`, `vitest.config.ts`, `tests/hello.test.ts`;
   3. `ci-scripts` — `ci.sh`, `ci.bat`, `run.sh`, `run.bat`; кінці рядків (LF / CRLF) і біт виконання.
3. Запусти повний конвеєр: Windows — `ci.bat`, Linux / macOS — `./ci.sh`.
4. Виведи список `CREATE` / `SKIP` / `UPDATE` і хвіст логу конвеєра.

## Очікувані файли

`package.json` (scripts, devDependencies), `package-lock.json`, `tsconfig.json`, `vitest.config.ts`,
`src/calc.ts`, `tests/hello.test.ts`, `scripts/build-exe.mjs`, `ci.sh`, `ci.bat`, `run.sh`, `run.bat`.
Ігноровані Git: `node_modules/`, `build/bin/hello[.exe]`, `build/test-results/junit.xml`.

## Перевірка

| Команда | Очікуваний результат |
|---|---|
| `ci.bat` (Windows) / `./ci.sh` (Linux, macOS) | `CI: SUCCESS`, код 0 |
| `npm test -- -t BasicAddition` | `BasicAddition` пройшов |
| `build/bin/hello[.exe]` | `Hello, World!` |

## Повідомлення про помилку

```text
CREATE-BUILD FAILED at <підкрок або крок конвеєра [N/6]>: <останній рядок помилки>
```

Приклад: `CREATE-BUILD FAILED at [4/6] unit tests: FAIL tests/hello.test.ts > BasicAddition (expected 6 to be 5)`.
Тести не можна пропускати чи послаблювати, щоб пройти крок.

## Повторний запуск

Безпечний: `npm pkg set` перезаписує ті самі ключі без дублювання, `npm install` з тими самими
версіями нічого не змінює, файли — `SKIP`, `build/` і `node_modules/` перестворюються скриптами.
