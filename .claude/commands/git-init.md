---
description: Check the Git repository and branch, create or update .gitignore and .gitattributes without duplicates, show git status
---

# Command: /git-init

Дій як агент **build-engineer** (`.claude/agents/build-engineer.md`). Шаблони `.gitignore` і
`.gitattributes` бери зі skill `project-scaffold` (`.claude/skills/project-scaffold/SKILL.md`).

## Передумови

- Встановлено Git: `git --version`.
- Поточний каталог — корінь Git-репозиторію: `git rev-parse --show-toplevel` збігається з `pwd`.
  Якщо репозиторію немає — **не** виконуй `git init` автоматично: запропонуй користувачу і
  дочекайся згоди.

## Дії

1. Покажи стан репозиторію: `git rev-parse --is-inside-work-tree`, `git branch --show-current`,
   `git remote -v`, `git log --oneline -3`.
2. Якщо поточна гілка `master`, `main` або `develop` — попередь, що генерувати проєкт треба у
   `feature/<name>` (рішення приймає `/init` або користувач).
3. `.gitignore`:
   - файлу немає → `CREATE` із шаблону;
   - файл є → для кожного змістовного рядка шаблону (не коментар, не порожній), якого ще немає у
     файлі, допиши його в кінець під заголовком `# Added by build-engineer /git-init`
     (заголовок — лише якщо є що дописати). Наявні рядки не видаляй і не переставляй.
4. `.gitattributes` — так само, як `.gitignore`.
5. Покажи `git status --short --branch` і `git check-ignore -v build/ node_modules/`.

## Очікувані файли

- `.gitignore` — містить щонайменше `node_modules/`, `build/`, `dist/`, `coverage/`, `.env`.
- `.gitattributes` — містить `*.sh text eol=lf` і `*.bat text eol=crlf`.

## Перевірка

| Перевірка | Команда | Очікуваний результат |
|---|---|---|
| артефакти ігноруються | `git check-ignore build/ node_modules/` | обидва шляхи виведено |
| немає дублікатів | `grep -v '^#' .gitignore \| grep -v '^$' \| sort \| uniq -d` | порожньо |
| артефакти не відстежуються | `git ls-files build node_modules dist` | порожньо |

## Повідомлення про помилку

```text
GIT-INIT FAILED: <причина>
```

Приклади: `GIT-INIT FAILED: not a git repository (run "git init" or clone the repo first)`,
`GIT-INIT FAILED: build/ is tracked by git — remove it from the index manually (git rm -r --cached build) after confirmation`.

## Повторний запуск

Безпечний: наявні рядки `SKIP`, дублікати не з’являються, файли не перезаписуються.
