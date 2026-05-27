# Maintenance Guide

## MECE Folder Policy

The repository uses mutually exclusive, collectively exhaustive buckets:

- Root: app entrypoints and core configuration only.
- `static/`: browser-only assets.
- `templates/`: Flask templates.
- `docs/`: durable project documentation.
- `.github/`: GitHub automation.
- `TestData/`: local verification inputs, ignored.
- `output/`: generated exports, ignored.

## Cleanup Checklist

Before pushing:

1. Run `git status --short --ignored`.
2. Remove runtime caches such as `__pycache__/`.
3. Keep `TestData/` and `output/` out of Git.
4. Run JavaScript syntax check: `node --check static\app.js`.
5. Run Python checks when Python is installed: `python -m py_compile main.py app.py verify_extraction.py`.
6. Confirm GitHub Pages workflow still points to the repository root.

## Restore Baseline

The cleanup baseline is stored as Git tags:

```text
restore-baseline-20260527-1000 (Initial v1.4.1 state)
restore-baseline-20260527-cleanup (Post-cleanup MECE state)
```

To inspect a tag:

```powershell
git show restore-baseline-20260527-cleanup
```

To recover files from it, prefer targeted restore commands instead of resetting the entire worktree.

