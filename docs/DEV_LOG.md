# Development Log

## 2026-05-27 - Workspace MECE Cleanup and Baseline Alignment

### Scope

- **清理與重構**：清除冗餘備份檔 (`main_local_backup.py`、`config_local_backup.json`) 以及過時的 PyInstaller 配置檔 (`build.spec`)。
- **清除快取**：移除執行階段產生的 `__pycache__/` 快取目錄，確保專案結構符合最嚴格的 MECE 原則。
- **建立基準點**：建立全新的本地還原基準點（Git 標記：`restore-baseline-20260527-cleanup`），以便日後安全回滾。
- **文檔更新**：更新開發日誌 (`DEV_LOG.md`) 與維護文檔 (`MAINTENANCE.md`)，精確定義檔案歸類政策。

### Today's Changes Summary

1. **build.spec**：從 Git 追蹤中移除並物理刪除（由 `PPOV-Extractor.spec` 替代）。
2. **臨時備份**：物理清除因安全 checkout 產生的本地備份檔案。
3. **快取清理**：刪除 `__pycache__` 確保無殘留。
4. **開發文檔**：更新 `docs/DEV_LOG.md` 與 `docs/MAINTENANCE.md`。

---

## 2026-05-27 - v1.4.1 Release and Finalization

### Scope

- **v1.4.1 發布**：修復子資料夾處理卡住問題，只做最小化修改。
- 跳過系統資料夾（$RECYCLE.BIN、System Volume Information、以 $/. 開頭的資料夾）。
- 重新打包 PPOV-Extractor.exe，解決 .exe 檔案卡住問題。
- 整理專案資料夾，移除過時檔案（根目錄 index.html、DEV_LOG.md、build.spec、sync.ffs_db、verify_extraction.py）。
- 建立今日終結基準點。

### File Classification (Updated)

| Category | Files | Git policy |
| --- | --- | --- |
| Python app | `app.py`, `main.py` | Track |
| UI | `templates/index.html`, `static/` | Track |
| Configuration | `config.json`, `.gitignore`, `PPOV-Extractor.spec` | Track |
| Documentation | `README.md`, `BUILD_README.md`, `ISSUE_RECORD.md`, `docs/` | Track |
| Deployment | `.github/workflows/deploy.yml` | Track |
| Local test data | `TestData/`, `PPOV/`, `input_pdfs/` | Ignore |
| Generated output | `output/`, `*.xlsx` | Ignore |
| Build artifacts | `build/`, `dist/` | Ignore |
| Runtime cache | `__pycache__/`, `*.pyc` | Ignore and remove |

### Today's Changes Summary

1. **app.py**：加入跳過系統資料夾邏輯（唯一修改的程式碼）
2. **打包**：重新產生 dist/PPOV-Extractor.exe
3. **清理**：移除重複/無用的檔案
4. **文件**：確保所有文件都在正確位置

---

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

