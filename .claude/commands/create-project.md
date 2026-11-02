---
description: Create the initial TypeScript Hello World project using the project-scaffold skill
argument-hint: "[project_name=hello]"
---

# Command: /create-project

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`). Аргументи: `$ARGUMENTS`
(`project_name`, за замовчуванням `hello`; `language` завжди `typescript`).

Застосуй skill **project-scaffold**: `.claude/skills/project-scaffold/SKILL.md`.

## Передумови

- Виконано `/git-init`: є `.gitignore` з `node_modules/` і `build/`.
- Node.js ≥ 26 з npm: `node --version`, `npm --version`.

## Дії

1. Прочитай skill `project-scaffold` повністю.
2. Створи файли з розділу «Результат» skill (окрім `.gitignore` / `.gitattributes`) за правилом
   `CREATE` / `SKIP` / `DIFF`; `package.json` — лише доповнення відсутніх ключів.
3. Допиши розділ «Проєкт Hello World» у `README.md`, якщо маркера `<!-- project:hello -->` ще немає.
4. Виконай перевірки skill і виведи список `CREATE` / `SKIP` / `UPDATE`.

## Очікувані файли

`package.json`, `src/greet.ts`, `src/main.ts`, `src/index.ts`, `docs/usage.md`, розділ у `README.md`.

## Перевірка

```bash
npm start --silent        # → Hello, World!
```

## Повідомлення про помилку

```text
CREATE-PROJECT FAILED: <перевірка>: <деталі>
```

Приклад: `CREATE-PROJECT FAILED: npm start: SyntaxError: Unexpected token ':' (Node.js >= 26 required)`.

## Повторний запуск

Безпечний: збіжні файли `SKIP`, `README.md` доповнюється лише один раз.
