---
description: Read-only verification of agent files, project structure, git hygiene, build, tests and the CI workflow
argument-hint: "[--no-build] [--only agent|structure|git|build|workflow]"
---

# Command: /check

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`). Ця команда **нічого не
змінює** у відстежуваних Git файлах: вона лише запускає збірку (яка пише в ігноровані
`node_modules/` і `build/`) і звітує.

## Передумови

- Node.js ≥ 26: `node --version`.
- Для груп `build` і `workflow` — `package.json` і `package-lock.json` (після `/create-build`).

## Дії

1. Запусти скрипт перевірки, передавши аргументи без змін (`$ARGUMENTS`):

   ```bash
   node .claude/scripts/check.mjs $ARGUMENTS
   ```

2. Скрипт перевіряє групи:

   | Група | Що перевіряється |
   |---|---|
   | `agent` | manifest має роль, область відповідальності, правила, заборонені дії, критерії завершення; `CLAUDE.md` посилається на manifest; 3 skills мають розділи «Коли застосовувати / Вхідні дані / Результат / Порядок дій / Перевірки / Приклад / Типовий сценарій помилки»; 6 commands мають «Передумови / Дії / Очікувані файли / Перевірка / Повідомлення про помилку»; commands посилаються на свої skills; `/init` викликає команди в порядку `git-init → create-project → create-build → create-actions → check` |
   | `structure` | наявність усіх файлів проєкту і документації; npm scripts; точні версії `devDependencies` |
   | `git` | `.gitignore` містить `node_modules/`, `build/`…; у Git немає `node_modules/`, `build/`, `dist/`, `.env`; `.gitattributes` і фактичні кінці рядків `*.sh` (LF) / `*.bat` (CRLF); біт виконання `ci.sh`; немає схожих на секрети рядків у відстежуваних файлах |
   | `build` | `ci.bat` / `ci.sh` завершується з кодом 0; існує `build/bin/hello[.exe]` і друкує `Hello, World!`; у `junit.xml` тест `BasicAddition` пройшов і немає провалених тестів |
   | `workflow` | `ci.yml` — валідний YAML; тригери `push` + `pull_request` до `develop` і `master`; одна job з матрицею з трьох ОС; `run:` лише викликає `ci.sh` / `ci.bat`; немає `continue-on-error` і `secrets.`; виконуваний файл завантажується з `if-no-files-found: error` |

   Наприкінці скрипт порівнює `git status --porcelain` до і після — доказ, що `/check` нічого не змінив.
3. Покажи користувачу підсумок `[PASS]` / `[FAIL]` і рядок `RESULT: PASS|FAIL`.
4. **Не виправляй** нічого в цій команді. Для кожного `[FAIL]` назви command / skill, який треба
   перезапустити або виправити.

## Очікувані файли

Нових відстежуваних файлів немає. Побічні (ігноровані): `node_modules/`, `build/`.

## Перевірка

Код виходу скрипта: `0` — усі перевірки пройшли (`RESULT: PASS`), `1` — є хоча б один `[FAIL]`,
`2` — неправильні аргументи.

## Повідомлення про помилку

- `[FAIL] <group>: <check> — <details>` для кожної проблеми;
- `RESULT: FAIL (<n> of <total> failed)` і код виходу 1.

## Повторний запуск

Завжди безпечний.
