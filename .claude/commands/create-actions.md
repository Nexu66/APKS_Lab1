---
description: Create the GitHub Actions CI workflow (Windows, Linux, macOS matrix calling ci.sh / ci.bat) using the github-actions skill
---

# Command: /create-actions

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`).

Застосуй skill **github-actions**: `.claude/skills/github-actions/SKILL.md`.

## Передумови

- Виконано `/create-build`: є `ci.sh` і `ci.bat`, локальний конвеєр завершується `CI: SUCCESS`.
- Встановлено залежності (`node_modules/yaml`) — для перевірки YAML.

## Дії

1. Прочитай skill `github-actions` повністю.
2. Створи `.github/workflows/ci.yml` із шаблону за правилом `CREATE` / `SKIP` / `DIFF`.
3. Виконай перевірку `node .claude/scripts/check.mjs --only workflow`.
4. Не виконуй `git push`; повідомити, що workflow запуститься після push / pull request.

## Очікувані файли

`.github/workflows/ci.yml`.

## Перевірка

```bash
node .claude/scripts/check.mjs --only workflow    # → RESULT: PASS
```

## Повідомлення про помилку

```text
CREATE-ACTIONS FAILED: <перевірка>: <деталі>
```

Приклад: `CREATE-ACTIONS FAILED: workflow: run steps only call ci.sh / ci.bat — step "Install" runs "npm ci"`.

## Повторний запуск

Безпечний: збіжний workflow — `SKIP`, відмінний — `DIFF` і запит користувачу.
