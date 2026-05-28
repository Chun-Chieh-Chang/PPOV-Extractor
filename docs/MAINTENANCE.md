# Maintenance Guide

## MECE Folder Policy

The repository uses mutually exclusive, collectively exhaustive buckets:

- Root: app entrypoints and core configuration only.
- `static/`: browser-only assets.
- `templates/`: Flask templates.
- `docs/`: durable project documentation.
- `.github/`: GitHub automation.
- `TestData/`: local verification inputs, ignored.
- `ppov_database.json`: Central persistent data storage (Ignored in Git).
- `users.json`: User credential database (Ignored in Git).

## Cleanup Checklist

Before pushing:

1. Run `git status --short --ignored`.
2. Remove runtime caches such as `__pycache__/`.
3. Keep `TestData/`, `ppov_database.json`, and `users.json` out of Git.
4. Run JavaScript syntax check: `node --check static\app.js`.
5. Run Python checks when Python is installed: `python -m py_compile main.py app.py`.
6. Confirm GitHub Pages workflow still points to the repository root.

## Restore Baseline

The current restore baseline tag is:

```text
restore-baseline-20260528-rbac-v1.8.0
```

To inspect a tag:

```powershell
git show restore-baseline-20260528-rbac-v1.8.0
```

To recover files from it, prefer targeted restore commands instead of resetting the entire worktree.
