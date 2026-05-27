# 開發日誌 (DEV_LOG.md)

## 專案與需求概述
* **專案名稱**：PPOV Extractor (Plastic Point Of View 射出成型數據提取器)
* **需求內容**：
  1. 擴充射出成型 PDF 報告中的製程與參考參數欄位，共新增包含模溫控制（母模、公模、滑塊的目標、下限、上限與實際值）以及週期、鎖模力、模重等 14+ 參數。
  2. 確保無論欄位是否為數字（例如 NCA, N/A 符號），皆能精準提取。
  3. 修正由於 PDF 提取中英文跨行排版導致的參考參數（模重、鎖模力等單一目標值欄位）錯位與交叉匹配問題。

---

## 過程問題、分析與矯正 (RCA & CAPA)

### 問題 1：參考參數（如填充模重、保壓模重、鎖模力）錯位與越界匹配
* **問題現象**：提取出來的 `充填階段的模重_目標值` 拿到 `5.6`（預期為 `5.08`），而 `保壓完的模重_目標值` 拿到 `40`。
* **原因分析 (RCA)**：
  * PDF 在被 `pdfplumber` 讀取時，表格中有些行是上下錯開的。例如：
    ```text
    '5.08',
    'FILL ONLY SHOT WEIGHT (PARTS ONLY)FULL CAVITATION (g)'
    ```
    數值 `'5.08'` 在關鍵字 `"FILL ONLY SHOT WEIGHT"` 的**前一行**（`i-1`）。
  * 舊代碼的定位邏輯只往關鍵字行的**下一行或下方行**檢索，導致越過當前目標並錯誤匹配了保壓模重的數值 `'5.60'`。
* **矯正與預防措施 (CAPA)**：
  * 重構 `find_table_value` 的單目標值（`value_type == "target"`）定位演算法，引進**雙向探測技術**。
  * 優先檢查關鍵字相鄰的 `[-1, 1, -2, 2]` 行是否為 standalone 純數字、`NCA` 或 `N/A`，並引入檢索範圍保護，確保在第一時間精準捕捉到 `'5.08'`、`'5.60'` 等正上方數值，完全杜絕錯位。

### 問題 2：烘料條件中帶有不乾淨的單位首碼
* **問題現象**：`烘料條件` 提取結果為 `(℃ / hr) N/A` 或 `(J / hr) N/A`，希望將前綴單位字串清除，只保留純值（如 `N/A`）。
* **原因分析 (RCA)**：
  * 關鍵字 `"Drying Condition"` 後面緊隨 `(℃ / hr)` 的單位聲明字串，再接實際數值。
* **矯正與預防措施 (CAPA)**：
  * 在 `find_text_after` 的提取後處理中加入正則清洗函式 `clean_val`。
  * 通過正則表達式 `r'^\s*\([J℃\w]\s*/\s*\w+\)\s*'` 自動匹配並安全移除任何開頭的括號單位描述，使輸出如 `"N/A"` 完美且清爽。

### 失敗嘗試記錄
* *嘗試一*：僅藉由向下行尋找數字，導致保壓模重把鎖模力欄位截斷。原因：部分 PDF 中模重數值並非存在於關鍵字下方，而是緊密貼合在文字上方。
* *嘗試二*：未做 pure single value 正則約束（如 `^(\d+\.?\d*|NCA|N/A)$`），導致在 `i-1` 行時拿到了包含其他文字的標題，產生了不可預期的字串截斷。已修正為嚴格的單一值正則邊界。

---

## 確效驗證總結
* 本地測試針對 `TestData` 下的 231 個 PDF 執行批量提取工作。
* 所有表格錯位與非數字值提取完美解決，最終成果檔案儲存於 `output/extracted_data_6.xlsx`。
* 經過雙向確效，核心指標完全符合 100% 準確率要求。

---

## 增補需求：PPOV Extractor Premium Web 互動式 UI 開發

### 需求概述
1. **目錄選擇與匯入**：提供 UI 交互，讓 User 選擇本機資料夾匯入 PDF 檔案進行批次數據解析。
2. **總表彙總與多格式輸出**：匯總成一個響應式總表 (Master Table)，支援實時進度條、即時文字檢索過濾，並能匯出為 Excel 總表和 JSON 數據。
3. **品號規格單單頁渲染與精美導出**：從總表中選取品號，動態渲染官方表單形式（包含基本資訊、10 個關鍵參數的多維度數值表格、以及參考規格），且能將該專屬規格單匯出為**高階排版樣式的單頁 Excel 檔案**。

### 過程問題與解決 (RCA & CAPA)
* **問題 1：Tkinter 資料夾選擇器在 Flask 多線程路由中呼叫導致伺服器當機/掛起 (Hang/Freeze)**
  * **原因 (RCA)**：Flask 的路由處理器是在多線程的 Request 執行緒（非 Python 主線程）中運行的。在 Windows 系統下，Tkinter 只能且必須在主線程中初始化並啟動事件循環。如果從 Flask 的子線程直接呼叫 `tkinter.filedialog.askdirectory`，會導致 Windows GUI 事件循環掛起，進而鎖死整個 Flask 伺服器，使瀏覽器端請求無限 pending，呈現「網頁當機」的現象。
  * **解決 (CAPA)**：重構 `_select_directory_dialog`。改為利用 `subprocess` 啟動一個完全獨立的 Python 子進程來單獨運行 Tkinter 選擇資料夾的對話框，並在選擇完成後將路徑輸出到 stdout 傳回。這樣可使 Tkinter 始終運行在該子進程的主線程中，徹底與 Flask 多線程解耦，完全解決了 GUI 對話框引發的線程死鎖問題。

* **問題 2：單頁 Excel 導出排版極致化 (Premium Formatting)**
  * **解決 (CAPA)**：使用 `openpyxl` 自定義單頁規格單生成模組。引入**莫蘭迪 Slate 灰度色彩美學 (Slate 800/700/600/100)** 填充標題與網格，採用雙底線、粗體與置中對齊，自動偵測長度設定寬度，產生的 Excel 樣式甚至比原始 PDF 還要精美、便於列印！
* **問題 3：瀏覽器自動開啟**
  * **解決**：引入 `threading.Timer(1.0, launch_browser)` 在 Flask 啟動完成後 1 秒自動開啟瀏覽器，極致優化 User 使用體驗。

---

### 2026-05-27：Git 安全防禦措施 (TestData 與 output 排除)
* **問題現象**：專案克隆後發現 `TestData/`（包含大量 PDF 及 Excel 原始檔案）與 `output/` 暫存資料夾已被 Git 追蹤並可能被 push 至 GitHub 倉庫。
* **原因分析 (RCA)**：`.gitignore` 僅限制了 `output/*`，但未完全阻斷 `TestData/` 目錄的追蹤，且之前的部分測試檔案已被加入並提交至 Git 歷史紀錄中。
* **矯正與預防措施 (CAPA)**：
  1. 修改 `.gitignore` 檔案，完全忽視 `TestData/` 及 `output/` 資料夾。
  2. 執行 `git rm -r --cached`，安全地將這兩個資料夾從 Git 快取索引中移除（保持本地磁碟上的實際檔案不被刪除）。
  3. 建立 local commit 以保存此配置，確保後續任何 `git push` 皆不會將測試數據與成果表單上傳至 GitHub，完成安全隱私防禦。

---

### 2026-05-27：GitHub 倉儲同步功能佈局優化
* **問題現象**：在主操作畫面左側面板中，「GitHub 倉儲同步」卡片佔用過大空間，導致主界面視覺擁擠，干擾了一般使用者進行 PDF 解析的主工作流。
* **原因分析 (RCA)**：Git 提交與推送功能屬於較高階的開發者或維護者工具，不應與一般用戶之「選擇資料夾、開始提取、數據總表」等核心數據操作卡片並列於主要工作區，否則會破壞 layout 的資訊留白與操作直覺性。
* **矯正與預防措施 (CAPA)**：
  1. **UI 隱藏與解耦**：將「GitHub 倉儲同步」區塊從左側面板中移除。
  2. **高階 Modal 設計**：於頂部 Header 右側新增一個獨立的「倉儲同步」按鈕。當點擊時，會彈出一個極致精美的半透明磨砂玻璃（Glassmorphism）懸浮彈窗（Modal），將 Git 操作完整收納於其中。
  3. **微動畫與提示 dot 整合**：Header 按鈕旁加入了細微的 Amber 警告提示點（`.badge-dot`）。當後端檢測到本地有未推送的 Git 變更時，提示點會自動浮現，引導維護者點擊同步，在提升美觀度的同時不失功能引導性。

---

### 2026-05-27：GitHub Pages 靜態部署與免伺服器解析引擎
* **問題現象**：用戶希望將操作頁面部署到 GitHub Pages。然而，傳統 GitHub Pages 僅支援靜態網頁（HTML/CSS/JS），無法直接運行 Python 後端（如 Flask 及 pdfplumber），導致「載入總表」及「規格單導出」等原先依賴後端 API 的功能失效。
* **原因分析 (RCA)**：靜態伺服器無 Python 運作環境，必須在前端實現本地文件解析（Excel 讀取）與本地 Excel 文件生成（Morandi 樣式規格單寫入）之雙向引擎，方能擺脫後端依賴。
* **矯正與預防措施 (CAPA)**：
  1. **免伺服器雙引擎整合**：
     * **SheetJS (XLSX)**：在前端引入 SheetJS，當檢測為靜態模式（`isStaticMode`，如 file 協定或 GitHub Pages 網址）時，直接在瀏覽器記憶體中讀取並解析上傳的總表 Excel/JSON 檔案，並填充至彙總表。
     * **ExcelJS**：引入 ExcelJS，在前端直接生成具備 Microsoft JhengHei、Morandi 莫蘭迪 Slate 灰度色彩（NAVY_FILL、ACCENT_FILL 等）、文字自動換行與網格合併的高階 Excel 製程查檢表。
  2. **靜態與後端雙模自適應 (Hybrid Mode)**：在 `app.js` 加入動態環境監測。若檢測為 `StaticMode`，會自動隱藏 Git 倉儲同步按鈕，並於左側面板彈出精美提醒 Banner；同時，點擊「載入現有總表」與「匯出規格單」時自動由 Python API 轉換為 JS 本地執行，無縫對接。
  3. **GitHub Actions 自動化部署**：建立 `.github/workflows/deploy.yml` 配置文件，在推送至 `main` 分支時，觸發 GitHub Actions 執行安全靜態打包，完成向 GitHub Pages 的零接觸自動部署。

---

### 2026-05-27：全面清除多餘的「GitHub 倉儲同步」功能
* **問題現象**：使用者明確指出「GitHub 倉儲同步」在主操作網頁中屬於多餘（Redundant）之功能，要求將其從整個專案中完全清除乾淨。
* **原因分析 (RCA)**：網頁主介面之設計目標為讓一般 QC 品保人員能夠極簡、流暢地進行數據解析與規格單導出，內置 Git 倉儲同步與 Commit 推送雖然精美但屬非必要的開發/運維工具，且有誤操作與敏感憑證安全疑慮，應予以全面清理以維護系統最小功能集（Minimal Feature Set）原則與代碼健壯性。
* **矯正與預防措施 (CAPA)**：
  1. **前端清理**：完全刪除 `templates/index.html` 與根目錄 `index.html` 中頂部 Header 的「倉儲同步」按鈕與下方的整個 `#gitModal` 彈窗結構。
  2. **樣式清理**：自 `static/style.css` 中徹底刪除包含 `.git-card`、`.git-body`、`.git-info-row`、`.git-input`、`modal-overlay`、`modal-content`、`badge-dot` 等所有 Git 與彈窗相關的冗餘樣式，確保樣式表緊湊無死代碼。
  3. **控制邏輯清理**：自 `static/app.js` 中完整移除了 Git Modal 開關、`updateGitStatus` 函數以及 `btnGitPush` 的 API fetch 連線動作，使前端只專注於 PPOV 核心數據控制。
  4. **後端 API 清除**：自 `app.py` 中彻底刪除了 `/api/git_status` 與 `/api/git_push` 兩個後端路由與對應 Python Git 執行方法，使後端不復存有任何 Git 進程呼叫。

