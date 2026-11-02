# APKS_Lab1 — AI-агент `build-engineer`

Лабораторна робота №1 з дисципліни «Автоматизоване проєктування комп’ютерних систем»:
**«Проєктування AI-агента для автоматизації розробки та CI/CD»**.

| Поле | Значення |
|---|---|
| Студент | Кулинський Ярослав Олегович |
| Група | КІ-408 |
| Варіант | 6 (№ 12 у списку групи): TypeScript, npm scripts, Vitest |
| AI-інструмент | Claude Code (CLI), модель Claude Opus 5.5 |
| Викладач | Чапля О.Ю. |

## Опис

Репозиторій містить AI-агента **build-engineer** у форматі Claude Code. Агент за допомогою
skills і commands генерує мінімальний кросплатформний проєкт **Hello World** на TypeScript:

- вихідний код (`src/`) і тестову функцію `add`;
- складання через **npm scripts**: перевірка типів (`tsc`), bundle (`esbuild`) і
  самостійний виконуваний файл `build/bin/hello[.exe]` (Node.js Single Executable Application);
- юніт-тести **Vitest** (зокрема тест `BasicAddition`) зі звітом JUnit;
- скрипти збірки `ci.sh` / `ci.bat` і запуску `run.sh` / `run.bat`;
- GitHub Actions з матрицею Windows, Linux і macOS, який лише викликає `ci.sh` / `ci.bat`;
- документацію (`docs/usage.md`) і журнал взаємодії з AI (`docs/ai-log.md`).

## Гілки

| Гілка | Вміст |
|---|---|
| `develop` | лише AI-агент з інструкціями (manifest, skills, commands, скрипт перевірки) |
| `feature/lab1-ts-hello` | результат запуску агента `/init`: агент + проєкт + тести + CI + документація |
| `master` | фінальний результат після перевірки |

## Склад агента

| Тип | Файл |
|---|---|
| Manifest | [`.claude/agents/build-engineer.md`](.claude/agents/build-engineer.md) (+ [`CLAUDE.md`](CLAUDE.md)) |
| Skills (3) | [`project-scaffold`](.claude/skills/project-scaffold/SKILL.md), [`build-and-test`](.claude/skills/build-and-test/SKILL.md), [`github-actions`](.claude/skills/github-actions/SKILL.md) |
| Commands (5) | [`/git-init`](.claude/commands/git-init.md), [`/create-project`](.claude/commands/create-project.md), [`/create-build`](.claude/commands/create-build.md), [`/create-actions`](.claude/commands/create-actions.md), [`/check`](.claude/commands/check.md) |
| Orchestrator | [`/init`](.claude/commands/init.md) |
| Скрипт перевірки | [`.claude/scripts/check.mjs`](.claude/scripts/check.mjs) (реалізація `/check`) |

Архітектура агента і відповідність структурі з методички — у [`docs/architecture.md`](docs/architecture.md).

## Запуск агента

Передумови: `git`, Node.js ≥ 26 (LTS), [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/Nexu66/APKS_Lab1.git
cd APKS_Lab1
git switch develop
git switch -c feature/lab1-ts-hello   # агент працює лише у feature-гілці
claude                                # інтерактивна сесія Claude Code у корені репозиторію
```

У сесії Claude Code:

```text
/init      # оркестратор: /git-init → /create-project → /create-build → /create-actions → /check
/check     # лише перевірка, нічого не змінює у відстежуваних файлах
```

Окремі кроки можна запускати й поодинці: `/git-init`, `/create-project`, `/create-build`,
`/create-actions`. Перевірку можна виконати і без Claude Code:

```bash
node .claude/scripts/check.mjs                 # усі групи перевірок
node .claude/scripts/check.mjs --only agent    # лише файли агента (працює і в гілці develop)
```

Точні команди запуску агента, локальної збірки і застосунку — у `docs/usage.md`
(створюється агентом під час `/init`).

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
