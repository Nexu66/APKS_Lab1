---
description: Orchestrator — run git-init, create-project, create-build, create-actions and check in order, stopping on the first error
argument-hint: "[project_name=hello]"
---

# Command: /init (orchestrator)

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`). Аргументи: `$ARGUMENTS`.

## Передумови

- Встановлені `git` і Node.js ≥ 26 з npm (`git --version`, `node --version`, `npm --version`).
- Поточна гілка — не `master` / `main` / `develop`. Якщо так — запропонуй користувачу створити
  `feature/lab1-ts-hello` (`git switch -c feature/lab1-ts-hello`) і дочекайся згоди.
- Робоче дерево чисте (`git status --porcelain` порожній) або користувач підтвердив продовження з
  незакоміченими змінами.

## Дії

Виконуй кроки **строго по черзі**. Кожен крок — відповідна command з `.claude/commands/`;
результат попереднього кроку є передумовою наступного.

| Крок | Command | Вхід від попереднього кроку | Вихід для наступного кроку |
|---|---|---|---|
| 1 | `/git-init` | робоче дерево Git | `.gitignore`, `.gitattributes`, назва гілки |
| 2 | `/create-project` | `.gitignore`, `project_name` | `package.json`, `src/*.ts`, `docs/usage.md` |
| 3 | `/create-build` | `package.json`, `src/main.ts` | npm scripts, `package-lock.json`, тести, `ci.*`, `run.*`, `build/bin/hello[.exe]` |
| 4 | `/create-actions` | `ci.sh`, `ci.bat` | `.github/workflows/ci.yml` |
| 5 | `/check` | усе вище | `RESULT: PASS` / `RESULT: FAIL` |

Журнал: перед кроком 1 створи `docs/ai-log.md` (якщо його немає) із заголовком
`# Журнал взаємодії з AI` і допиши розділ `## Запуск /init — <дата, гілка>`. Після кожного кроку
дописуй рядок: номер і назву кроку, створені / пропущені файли, результат перевірки, знайдені
помилки та прийняті рішення.

Коміти: після кожного успішного кроку 1–4 зроби окремий **локальний** коміт лише з файлами цього
кроку (якщо крок щось змінив) разом з оновленим `docs/ai-log.md`:

| Крок | Повідомлення коміту |
|---|---|
| 1 | `chore: add .gitignore and .gitattributes` |
| 2 | `feat: scaffold TypeScript Hello World project` |
| 3 | `build: add npm scripts, Vitest tests and SEA executable build` |
| 4 | `ci: add GitHub Actions matrix for Windows, Linux and macOS` |
| 5 | `docs: record /init and /check results in AI log` |

`git push` і створення pull request — тільки на прохання користувача.

## Обробка помилок

- Якщо крок завершився помилкою — **зупинись**. Не виконуй наступні кроки, не позначай роботу
  успішною, нічого не видаляй і не відкочуй.
- Виведи: номер і назву кроку, повідомлення про помилку command, останні рядки логу і яку
  command / skill треба виправити. Запиши це в `docs/ai-log.md`.
- Не приховуй помилку (`|| true`, пропуск тестів, ручна правка згенерованого результату).
- Якщо помилка — в інструкціях агента, виправ відповідний skill / command, а потім перезапусти
  `/init`: усі кроки ідемпотентні й пропускають готові файли.

## Очікувані файли

Усі файли з commands 1–4, а також `docs/ai-log.md`.

## Перевірка

Крок 5 (`/check`) повертає `RESULT: PASS`. Без цього `/init` вважається невдалим.

## Повідомлення про помилку

```text
INIT FAILED at step <N>/5 (<command>): <message>
Fix: <skill/command to update>, then re-run /init
```

Успіх:

```text
INIT OK: git-init ✓ create-project ✓ create-build ✓ create-actions ✓ check ✓ (RESULT: PASS)
```
