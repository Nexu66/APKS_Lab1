---
name: github-actions
description: Create .github/workflows/ci.yml with one build-and-test job and a Windows / Linux / macOS matrix that only calls ci.sh / ci.bat and uploads the executable and test report. Use for /create-actions or when the CI workflow is missing or invalid.
---

# Skill: github-actions

## Коли застосовувати

- Команда `/create-actions` (крок 4 оркестратора `/init`).
- У репозиторії немає `.github/workflows/ci.yml` або `/check` повідомляє `[FAIL] workflow: ...`.

## Вхідні дані

| Вхід | Значення / звідки |
|---|---|
| `ci.sh`, `ci.bat` | skill `build-and-test`; мають локально завершуватися `CI: SUCCESS` |
| `node_version` | `26` |
| `os` | `ubuntu-latest`, `windows-latest`, `macos-latest` |
| `branches` | `push`: `develop`, `master`, `main`, `feature/**`; `pull_request`: `develop`, `master`, `main` |

## Результат

| Результат | Опис |
|---|---|
| `.github/workflows/ci.yml` | одна job `build-and-test` з матрицею з трьох ОС |
| GitHub Actions (після push) | три job `build-and-test (<os>)`, кожна зі зрозумілим підсумком у Job summary |
| артефакти | `hello-<os>` (виконуваний файл), `test-results-<os>` (`junit.xml`) |

### Правила workflow

- Вся логіка складання і тестування — у `ci.sh` / `ci.bat`. Workflow містить лише checkout,
  налаштування середовища (`actions/setup-node`), виклик скрипта і завантаження артефактів.
  Жодних `npm`, `tsc`, `vitest` безпосередньо в `run:`.
- `fail-fast: false` — результат видно для всіх трьох ОС, навіть якщо одна впала.
- Linux / macOS: `bash ./ci.sh` (не залежить від біта виконання); Windows: `shell: cmd`, `call ci.bat`.
- `permissions: contents: read`; жодних `secrets.*`, токенів і `continue-on-error`.
- `if-no-files-found: error` для виконуваного файлу — job не може бути зеленою без артефакту.

## Порядок дій

1. Перевір передумови: `ci.sh` і `ci.bat` існують (інакше — спершу `/create-build`).
2. Створи `.github/workflows/ci.yml` із шаблону за правилом `CREATE` / `SKIP` / `DIFF`.
3. Виконай «Перевірки».
4. Не виконуй `git push` сам: повідомити користувачу, що workflow запуститься після push у
   `feature/**` і при pull request до `develop`.

## Шаблон

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [develop, master, main, "feature/**"]
  pull_request:
    branches: [develop, master, main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build-and-test:
    name: build-and-test (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Configure Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "26"

      - name: Build and test (Linux/macOS)
        if: runner.os != 'Windows'
        shell: bash
        run: bash ./ci.sh

      - name: Build and test (Windows)
        if: runner.os == 'Windows'
        shell: cmd
        run: call ci.bat

      - name: Upload executable
        uses: actions/upload-artifact@v6
        with:
          name: hello-${{ matrix.os }}
          path: build/bin/
          if-no-files-found: error

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: test-results-${{ matrix.os }}
          path: build/test-results/
          if-no-files-found: warn
```

## Перевірки

| Перевірка | Команда | Очікуваний результат |
|---|---|---|
| структура workflow | `node .claude/scripts/check.mjs --only workflow` | `RESULT: PASS` |
| валідний YAML | `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"` | без помилок, код 0 |
| лише виклик скриптів | `grep -n "run:" .github/workflows/ci.yml` | лише `bash ./ci.sh` і `call ci.bat` |
| після push | GitHub → Actions → CI | 3 зелені job, артефакти `hello-*` і `test-results-*` |

`check.mjs --only workflow` перевіряє: YAML парситься; тригери `push` і `pull_request` містять
`develop` і `master`; рівно одна job з `strategy.matrix.os` = три ОС; є `actions/checkout`;
кожен `run:` — лише виклик `ci.sh` / `ci.bat`, обидва скрипти викликаються; немає
`continue-on-error` і `secrets.`; виконуваний файл завантажується з `if-no-files-found: error`.

## Приклад

Вхід: `/create-actions` після успішного `/create-build`.

Очікуваний результат:

```text
CREATE .github/workflows/ci.yml
$ node .claude/scripts/check.mjs --only workflow
[PASS] workflow: ci.yml is valid YAML
[PASS] workflow: triggers push and pull_request for develop and master
[PASS] workflow: single job with matrix ubuntu-latest, windows-latest, macos-latest
...
RESULT: PASS
```

Після push у GitHub Actions: `build-and-test (ubuntu-latest)`, `build-and-test (windows-latest)`,
`build-and-test (macos-latest)` — success.

## Типовий сценарій помилки

| Симптом | Причина | Дія |
|---|---|---|
| `[FAIL] workflow: run steps only call ci.sh / ci.bat` | у workflow додано `npm ...` чи інші команди | перенести логіку в `ci.sh` / `ci.bat` |
| `Unable to resolve action actions/checkout@vX` | неіснуюча версія action | використати версії з шаблону |
| `No files were found with the provided path: build/bin/` | скрипт збірки впав раніше | дивитися лог кроку `Build and test` |
| macOS job: `Killed: 9` під час smoke-тесту | бінарний файл без підпису | `scripts/build-exe.mjs` підписує його (`codesign`) |
| Windows job: `'bash' is not recognized` / Linux: `call: command not found` | крок запущено не на тій ОС | умови `if: runner.os == 'Windows'` / `!= 'Windows'` |
| workflow не запускається для pull request | гілка не входить у `on.pull_request.branches` | додати `develop` / `master` |
| `package 'yaml' is not installed` у `check.mjs` | не виконано `npm ci` | запустити `ci.bat` / `./ci.sh` або `npm ci` |
