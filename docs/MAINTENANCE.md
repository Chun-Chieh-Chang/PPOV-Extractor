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

## Excel Export & Print Layout Standards (v1.8.0)

To maintain consistent high-premium styling and print compatibility, both the frontend (`ExcelJS` in `static/app.js`) and backend (`openpyxl` in `app.py`) Excel generation engines must strictly adhere to the following layout parameters as a condition of successful task verification:

### 1. Column Width Specifications
- **Column A (Parameter Label)**: `38.5`
- **Column B (Target Value)**: `18.5`
- **Column C (Low Value)**: `30.0`
- **Column D (High Value)**: `11.3`
- **Column E (Actual Value / Check Record)**: `11.3`

### 2. Page Setup & Margin Specifications
- **Paper Size**: A4 (`9` in Excel)
- **Orientation**: Portrait
- **Margins (Centimeters / Inches equivalents)**:
  - Top: `0.8 cm` (`0.31` in)
  - Bottom: `0.8 cm` (`0.31` in)
  - Left: `1.3 cm` (`0.51` in)
  - Right: `1.3 cm` (`0.51` in)
  - Header: `0 cm`
  - Footer: `0 cm`
- **Center on Page Options**:
  - Horizontally Centered: `Enabled (True)`
  - Vertically Centered: `Enabled (True)`
- **Scaling Option**: Fit to 1 Page Wide & 1 Page Tall (`fitToPage = True`, `fitToWidth = 1`, `fitToHeight = 1`)

---

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
