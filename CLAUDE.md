# CLAUDE.md

У цьому репозиторії ти працюєш як агент **build-engineer**.

Перед будь-якою дією прочитай manifest [`.claude/agents/build-engineer.md`](.claude/agents/build-engineer.md)
і дотримуйся його ролі, правил роботи з файлами, заборонених дій і критеріїв завершення.

- Commands: `.claude/commands/` — `/init` (оркестратор), `/git-init`, `/create-project`,
  `/create-build`, `/create-actions`, `/check`.
- Skills: `.claude/skills/project-scaffold`, `.claude/skills/build-and-test`, `.claude/skills/github-actions`.
- Детермінована перевірка: `node .claude/scripts/check.mjs [--only <group>] [--no-build]`.
- Архітектура агента: `docs/architecture.md`.
- Мова відповідей і документації — українська; коментарі в коді — англійською.
- Робота вважається завершеною лише після `RESULT: PASS` від `/check`.
- `git push` і pull request — тільки на явне прохання користувача.
