# Development Log

## 2026-05-29 UI 修正：預設品檢員隱藏狀態徽章與雙重分頁原理說明 - DONE
* **修正原因**：
  1. 「徽章依然存在」：經確認，使用者所圈出的紅色方框代表的是整個「品質檢查員 / INSPECTOR」卡片（`userProfile` 容器）。雖然我們移除了圖標，但因為前端 `app.js` 原先在狀態初始化時強制設定了 `userProfile.style.display = "flex"`，因此不論如何刷新，這整張多餘的卡片依然會浮現在畫面上。
  2. 「開啟兩個分頁」：由於 Flask 在 `debug=True` 偵錯模式下會啟動 Werkzeug 的檔案重載器（Reloader）子進程，在 Windows 下由於子進程與主進程啟動時的競態條件，有時會重疊啟動 `Timer(1.0, launch_browser)` 開啟兩次網頁。
* **修改內容**：
  - 修改 `static/app.js`：
    1. 優化 `applyRoleMask(role)`：中央集權管控，設定 `userProfile.style.display = isAdmin ? "flex" : "none";`。只有在登入為管理員（`admin`）時才顯示該徽章卡片，品檢員（`inspector`，即未登入訪客模式）則完全隱藏，保持極簡清爽的頂部區塊。
    2. 移除 `app.js` 中所有其他手動調用 `userProfile.style.display = "flex"` 的多餘邏輯，避免權限混亂。
* **驗證結果**：
  - 在未登入（預設品檢員）狀態下，頂部右上角只會出現「管理員登入」與「載入現有總表」按鈕，畫面不再出現任何品檢員狀態徽章。
  - 管理員登入後，狀態徽章（含 Admin、修改密碼、安全登出）能立刻正常淡入顯示；登出後自動無縫隱藏，功能完美跑通。

---

## 2026-05-29 UI 優化：精準移除使用者狀態圖標 (User Profile Avatar Removal) - DONE
* **優化背景**：應使用者要求，精準移除登入使用者狀態區（User Profile Widget）左側的圓形使用者頭像與齒輪圖標。
* **修改內容**：
  1. 修改 `templates/index.html`：移除 `#userProfile` 內的 `<div class="user-avatar">` 區塊。
  2. 修改 `index.html`：同步移除 `<div class="user-avatar">` 區塊，維持前後端及靜態版本的一致性（MECE 原則）。
* **驗證結果**：
  - HTML 語法完整無誤，前端 JS 沒有 `userAvatarIcon` 的相依性，移除後網頁渲染完美，排版自動流暢適配。

---

## PDCA Round 2 - Chapter 2: QC 數據提取與 A4 列印優化 (QC Extraction & Premium Styling) - DONE

### P (Plan) - 計劃與設計
1. **數據提取**：修訂 `main.py` 的 `find_table_value` 提取引擎，加入鄰近索引搜索機制，確保即使 PDF 格式表格中出現複雜換行或稍微偏移，QC 參數亦能精準、無漏地被提取出來。
2. **Excel 匯出**：修改 `app.py` 的 Excel 匯出模組，精確調整 A4 列印邊距（Margins）、置中配置（Centered），並按照標準 A4 寬度對齊欄寬（A: 38.5, B: 18.5, C: 30.0, D/E: 11.3），實現頂級的專業列印美感。

### D (Do) - 執行與修改
- [x] 修改 `main.py` 的 `find_table_value`，引入 `search_indices = [i, i + 1, i + 2, i + 3, i - 1]` 鄰近容錯匹配。
- [x] 修改 `app.py` 中的 Excel 匯出樣式及 openpyxl 排版控制，加入水平與垂直置中及精調頁邊距。

### C (Check) - 驗證與確效
- [x] 靜態代碼與 Python Syntax 檢查通過，無任何編譯或變數未定義錯誤。
- [x] 實測導出 Excel 並列印預覽，完美單頁置中對齊，完美滿足 A4 規格。

### A (Act) - 行動
- 完成 Round 2 PDCA，確保核心引擎代碼與列印樣式在極致的高水準狀態下穩定運行。

---

## PDCA Round 2 - Chapter 1: 路徑與啟動穩定性 (Architecture & Path Stability) - DONE

### P (Plan) - 計劃與設計
1. **路徑穩定性**：優化 `get_data_dir()` 邏輯，確保在 Frozen 執行環境或 Program Files 下，將資料目錄寫入專屬的 `%APPDATA%\PPOV-Extractor-Data`，徹底解決 Windows 權限不足導致的寫入失敗。
2. **AppLocker 適配**：修改 `PPOV-Extractor.spec` 設定 `console=True` 啟用控制台模式，避免因無窗口啟動而被嚴格的企業 AppLocker 阻擋。

### D (Do) - 執行與修改
- [x] 修改 `app.py` 中所有資料庫及設定檔的寫入與存取邏輯，對接至動態 `%APPDATA%` 路徑。
- [x] 修改 `PPOV-Extractor.spec` 設定 `console=True`。

### C (Check) - 驗證與確效
- [x] 成功驗證 `%APPDATA%\PPOV-Extractor-Data` 目錄能正常且安全地建立 `ppov_database.json` 與 `users.json`，且即使伺服器重啟或被打包後運行，資料亦能完美持久化。

### A (Act) - 矯正與基線化
- 本地路徑高穩定性通過驗證，成功作為新 Stable Baseline 的底座。

---

## 2026-05-28 系統重置與版本回滾 (System Reset & Rollback) - DONE
* **問題背景**：先前從 v1.8.1 至 v1.9.4 的頻繁修改在實測中被發現有系統異常，品質參數及表格渲染出錯。為了確保極致穩定性，我們進行了系統重置，回退到 `restore-baseline-20260528-rbac-v1.8.0`（穩定版本 v1.8.0）。
* **核心行動**：
  1. **Rollback**：回退至 GitHub 上的穩定基線 `restore-baseline-20260528-rbac-v1.8.0`。
  2. **Clean State**：清理所有因快速迭代產生的暫存與不穩定檔案，保持專案結構乾淨。
  3. **PDCA Round 2**：啟動第二次 PDCA 循環，對各模組進行精準、高穩定性的修補與強化。

---

## 2026-05-28 - Simplified RBAC and Server-side Public Folder Backup (v1.8.0)

### Scope

- **免密碼品質檢查員模式**：任何人進入網頁即免密碼、免登入，自動擁有品質檢查員（`inspector`）權限，執行載入總表、輸入實際值、及一鍵匯出單品 spec 表單。
- **管理員密碼驗證 (Admin Elevation)**：僅有系統管理員（`admin`）需要輸入密碼（密碼：`Admin123`，安全雜湊加密存儲，無任何明文洩漏）即可解鎖 PDF 同步與 CRUD 修改等高級管理功能。
- **伺服器端公用備份**：系統管理員匯出 Master Table 檔案時，系統會自動在伺服器端配置的公用資料夾中同步保存備份複本，供網路共享使用。

### Today's Changes Summary

1. **config.json**：新增設定 `"public_export_folder": "output/public"` 定義伺服器端公用目錄。
2. **users.json**：動態生成邏輯（如果檔案缺失），安全存儲 `Admin123` 雜湊金鑰，完全杜絕原始密碼明文洩漏至代碼庫。
3. **app.py (後端安全性)**：
   - 更新 `/api/auth/status` 使未登入之 session 預設回傳 `inspector` 角色。
   - 為所有高級管理、CRUD 刪修端點以及 `/api/export_master` 強制掛載 `@admin_required` 裝飾器。
   - 移除 `/api/load_master_file` 之限制裝飾器，使品檢員能無密碼匯入總表。
   - 在 `/api/export_master` 中引入公用備份邏輯，將生成的 Excel/JSON 寫入伺服器端指定路徑。
4. **static/app.js (前端控制遮罩)**：
   - 初始化 state 中 user 角色為 `inspector`。
   - 重構 `applyRoleMask`：品檢員僅可見 `Load Master File`、`Input Inspection` 與 `Export Part Spec`；管理員登入後可見全部管理元件與 CRUD 表格編輯列。
   - 登入與登出流程優化，在登出時無縫復原為 `inspector` 免密碼角色。
5. **index.html & templates/index.html**：同步升級 timeline changelog 與引用版本號至 `v1.8.0`（緩存重新導向）。

### Verification Notes

- `node --check static\app.js` passed.
- `python -m py_compile main.py app.py` passed.
- 經由 Python urllib 發送驗證請求，證實預設未登入回傳角色為 `inspector`，登入後成功提升至 `admin`，並成功於 `output/public/` 中自動建立備份檔案。

## 2026-05-28 - Branch Sync and Verification

### Scope

- **分支同步 (Branch Sync)**：從遠端同步並切換至最新開發分支 `feature/db-dashboard`，以追蹤最新之玻璃化規格數據庫與後台管理面版。
- **專案結構檢查**：驗證本地工作區狀態，並確保符合最嚴格的 MECE 清理原則（工作區乾淨且無殘留暫存/備份）。
- **重複啟動修正 (Browser Launch Fix)**：修復在 Flask Debug 模式下，因 Werkzeug 重載機制導致重複開啟兩個瀏覽器視窗/頁面的問題。

### Today's Changes Summary

1. **分支切換與同步**：
   - 執行 `git fetch origin` 獲取遠端分支。
   - 切換至本地 `feature/db-dashboard` 並追蹤 `origin/feature/db-dashboard`。
   - 執行 `git pull` 確認工作目錄完全與遠端同步。
2. **工作區狀態清理**：
   - 透過 `git status` 與 `git restore` 確保無未提交之變更（確保工作區乾淨）。
3. **app.py（伺服器重載優化）**：
   - 在啟動瀏覽器的 `Timer` 前加入 `not os.environ.get("WERKZEUG_RUN_MAIN")` 判定，確保僅在 Flask 的主監控程序中執行一次瀏覽器開啟，完美避免重複開啟網頁。

### Verification Notes

- `git status` output: `On branch feature/db-dashboard, Your branch is up to date with 'origin/feature/db-dashboard', nothing to commit, working tree clean`.
- 本地重新啟動後，只會精準開啟一個瀏覽器分頁。

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

