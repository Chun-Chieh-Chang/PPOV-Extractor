# Development Log

## 2026-05-27 - MECE Cleanup and GitHub Readiness

### Scope

- Created restore baseline tag `restore-baseline-20260527-1000`.
- Classified project files into source code, UI assets, configuration, documentation, deployment, local test data, and generated output.
- Replaced the previous unreadable root development log with this concise documentation under `docs/`.
- Added root `README.md` and `requirements.txt` so the repository is easier to install, verify, and deploy.
- Confirmed `index.html` and `templates/index.html` are intentionally duplicated entrypoints for GitHub Pages and Flask.

### File Classification

| Category | Files | Git policy |
| --- | --- | --- |
| Python app | `app.py`, `main.py`, `verify_extraction.py` | Track |
| UI | `index.html`, `templates/index.html`, `static/` | Track |
| Configuration | `config.json`, `.gitignore` | Track |
| Documentation | `README.md`, `docs/` | Track |
| Deployment | `.github/workflows/deploy.yml` | Track |
| Local test data | `TestData/` | Ignore |
| Generated output | `output/` | Ignore |
| Runtime cache | `__pycache__/`, `*.pyc` | Ignore and remove |

### Verification Notes

- `node --check static/app.js` passed.
- Python compile/extraction tests could not be run in this environment because neither `python` nor `py` is available on PATH.

## Operational Notes

- Keep `index.html` and `templates/index.html` synchronized unless the static and Flask experiences intentionally diverge.
- Do not commit PDF samples, extracted spreadsheets, runtime caches, virtual environments, or local editor settings.
- Use `TestData/` only for local verification assets.
- Use `output/` only for generated exports.

