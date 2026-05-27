# Development Log

## 2026-05-27 - Admin Password Change Feature (v1.7.1)

### Scope

- **密碼自助修改功能**：允許已登入的系統管理員透過 UI 修改帳號密碼，並即時持久化保存至 `users.json`。
- **安全邊界設計**：後端 `/api/auth/change_password` 由 `@admin_required` 裝飾器保護；驗證目前密碼、新舊密碼比對、最低長度規範（≥6 字元）。
- **全端完整實作**：前端新增修改密碼 Modal（金鑰🔑 icon 按鈕），含 Shake 抖動錯誤動畫與 2 秒後自動關閉成功提示。
- **自動化確效**：擴充 `auth_test.py` 新增 `test_change_password_endpoint`，驗證 5 個安全邊界案例與正確修改流程，全數通過。

### Today's Changes Summary

1. **app.py**：新增 `POST /api/auth/change_password` 端點（`@admin_required`），讀取 `users.json` 驗證目前密碼後更新 SHA-256 雜湊並寫回檔案。
2. **templates/index.html & index.html**：在 `userProfile` 區新增藍色鑰匙按鈕 (`btnChangePassword`)，並在 `partEditModal` 後插入修改密碼 Modal DOM（重用 `.modal-overlay` / `.glass-modal` 樣式）。版本號升至 `v1.7.1`（CSS + JS）。
3. **static/app.js**：新增 `changePasswordModal` 系列 DOM 變數、`openChangePasswordModal`、`closeChangePasswordModal`、`showCpError`、`showCpSuccess`、`setupChangePasswordListeners` 函式，整合背景點擊關閉與 2 秒自動關閉成功提示。
4. **scratch/auth_test.py**：新增 `test_change_password_endpoint` 確效案例，5 個安全邊界均通過。

### RCA / CAPA

- **CAPA-1 (密碼長度)**：預設管理員密碼 `admin` 為 5 字元，低於最短規範。測試時若「還原成 admin」會被自己的長度驗證阻擋。已在測試中明確說明此設計意圖（短密碼失敗為預期行為），並記錄 v1.7.1 正式部署後建議系統管理員立即修改為更長密碼。

### Verification Notes

- `python -m py_compile app.py main.py` passed.
- `node --check static/app.js` passed.
- `auth_test.py` ran 5 tests, all passed (OK).
- `users.json` 密碼在測試後已正確還原為原始 `admin` SHA-256 雜湊。



### Scope

- **自動化新增品號 (Single PDF Import)**：將原本的人工手動新增品號欄位表單，升級為上傳單一 PPOV PDF 規格單並由系統進行自動化數據提取與資料庫載入。
- **後端單檔提取端點**：實作 `/api/db/import_pdf`，保存暫存檔、呼叫核心解析引擎提取 14+ 組關鍵製程參數、自動合併/更新既有品號數據、最後持久化寫入硬碟並清理暫存。
- **前端自動引導預覽**：點擊「新增品號」觸發隱藏的 PDF 檔案選擇器。導入成功後，前端會自動重繪 Master Table 並主動搜尋、高亮、選中該品號，在右側面板即時預覽高質感查檢規格單。

### Today's Changes Summary

1. **app.py**：新增 `/api/db/import_pdf` 接口，支持單一檔案 PDF 解析與庫內增量合併（覆蓋/追加）。
2. **static/app.js**：
   - 重新綁定 `btnAddNewPart` 點擊事件，將其對接至新建立的隱藏 `#inputSinglePdf` 檔案上傳框。
   - 實作 `#inputSinglePdf` 變動監聽器，發送 FormData 上傳，並在成功後以正則表達式提取品號，執行自動尋找與規格預覽聚焦。
3. **templates/index.html & index.html**：在標題欄操作區新增隱藏的 `<input type="file" id="inputSinglePdf" accept=".pdf" style="display:none;">` 元件。

### Verification Notes

- `python -m py_compile app.py main.py` passed.
- `node --check static/app.js` passed.
- Automated PDF Single Import test suite `pdca_test.py` simulated real-world PDF uploads, correctly parsed `A02-210-251` with all target/low/high bounds, verified database file write. 100% of checks passed successfully.

## 2026-05-27 - Performance Optimization and Persistence Fix (v1.5.1)

### Scope

- **前端大數據防凍結 (Event Delegation & DocumentFragment)**：優化表格渲染邏輯，防止在匯入包含大量產品型號的總表時導致瀏覽器主線程阻塞。
- **後台匯入資料即時存檔**：在上傳 Excel / JSON 總表檔案時，實時將解析數據持久化寫入硬碟 `ppov_database.json`，防止刷新後數據遺失。
- **PDCA 確效循環**：編編並執行自動化 `pdca_test.py` 測試上傳、存檔、修改、清空完整迴圈。

### Today's Changes Summary

1. **app.py**：在 `load_master_file` 中新增對 `save_db_to_file()` 的調用，實現匯入即存檔。
2. **static/app.js**：
   - 移除 `renderMasterTable` 迴圈中逐行綁定點擊與 CRUD 事件監聽器的動作。
   - 在主載體 `tbodyMaster` 綁定全局點擊委派監聽器，秒級響應行點擊、編輯、刪除事件。
   - 表格渲染改用 `DocumentFragment` 進行一次性 DOM 樹掛載，大幅優化排版抖動。
3. **templates/index.html & index.html**：將 static CSS 與 JS 的引入版本號從 `v1.5.0` 升級為 `v1.5.1`，進行緩存刷新（Cache Busting）。

### Verification Notes

- `python -m py_compile app.py main.py` passed.
- `node --check static/app.js` passed.
- Automated PDCA test suite `pdca_test.py` simulated file uploads, persisted file checks, and CRUD regressions. 100% of cases passed successfully.

## 2026-05-27 - Database Management Admin Dashboard Integration (v1.5.0)

### Scope

- **SkillsBuilder 開發模式**：將 PPOV Extractor 從單次解析工具升級為玻璃化規格數據庫後台管理面板。
- **本地 JSON 持久化**：實現 `ppov_database.json` 數據持久化機制，伺服器啟動與操作時自動讀寫。
- **增量同步功能**：重構 `/api/extract` 支援增量同步，自動過濾已解析之 PDF 檔案。
- **完整 CRUD API 與 UI**：後端實作 `/api/db` 系列 API，前端打通手動新增、彈窗編輯、資料刪除及清空功能。
- **Morandi 視覺與雙模式**：引入冰藍莫蘭迪玻璃卡片設計，頂部配備 4 張動態統計看板。打通免伺服器靜態展示（GitHub Pages）與 Flask 本機操作之雙引擎。

### Today's Changes Summary

1. **app.py**：新增 JSON 讀寫 helper、增量同步檔案名稱比對、以及 `/api/db/add`、`/api/db/edit`、`/api/db/delete`、`/api/db/clear` 等端點。
2. **static/app.js**：打通統計指標動態計算、手動新增與編輯 Modal 輸入表格（支援 Enter 鍵跳轉、自動聚焦）、雙引擎（靜態 in-memory CRUD vs 本地 API CRUD）適配。
3. **static/style.css**：為 `stats-grid` 的玻璃光感、內發光與呼吸動畫以及編輯 Modal Backdrop-blur 提供莫蘭迪風格與 WCAG AA 高對比設計。
4. **templates/index.html & index.html**：同步升級頂部數據看板、Master Table 動作按鈕、以及「新增/編輯規格數據」彈窗容器 DOM，維持 100% par-level 對等。

### Verification Notes

- `python -m py_compile app.py main.py` passed.
- `node --check static/app.js` passed.
- Automated API CRUD test suite `api_test.py` ran and all 7 test cases passed (database load, insert, verify, edit, verify-edit, delete, verify-delete).

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

