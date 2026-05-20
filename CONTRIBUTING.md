# Contributing

## Branch & PR workflow

All changes go through a pull request — direct pushes to `main` are blocked.

### Steps for every change

1. **Create a feature branch** from the latest `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/<short-description>
   # e.g. feat/open-queue-aging, fix/ticket-filter-reset
   ```

2. **Make your changes**, commit with a descriptive message:
   ```
   feat(scope): what changed and why
   fix(scope): what was broken and how it's fixed
   ```

3. **Push and open a PR**:
   ```bash
   git push -u origin HEAD
   gh pr create --title "..." --body "..."
   ```

4. **Merge** once the PR is reviewed (squash or merge commit — both are fine).

## Branch naming

| Prefix | Use for |
|--------|---------|
| `feat/` | New features or data migrations |
| `fix/`  | Bug fixes |
| `chore/`| Dependencies, scripts, config |
| `docs/` | Documentation only |

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(open-queue): add aging average per assignment group
fix(ticket-list): reset priority filter when switching tabs
chore(scripts): support SN6 multi-sheet concat
```

## Data files

- `public/data/incidents.json` and `public/data/open_queue.json` are **generated** — never hand-edit them.
- Regenerate with:
  ```bash
  python3 scripts/xlsx_to_json.py /path/to/SN4.xlsx public/data/incidents.json
  python3 scripts/xlsx_to_json.py /path/to/SN5.xlsx public/data/open_queue.json
  ```
- Both files are in `.gitignore` — commit the script, not the output.

## Tests

Run before opening a PR:
```bash
npx vitest run
```

All 104 tests must pass.
