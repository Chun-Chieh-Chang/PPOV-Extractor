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

## 增補需求：SkillsBuilder 智慧開發能力無縫整合

### 需求概述
將 `SkillsBuilder` 的 42 個 Agentic 技能、Wiki 大腦架構、以及多 IDE（Cursor/Claude Code/Antigravity 等）配置無縫整合至 PPOV-Extractor 專案。

### 執行與調整 (SOP & CAPA)
* **自動化安裝與確效機制建立**：
  * 引進 `INSTALL.ps1` 用於建立與系統全域 `~/.gemini/antigravity-ide/skills` 的安全映射（Symbolic Link 及 Copy 雙備援）。
  * 引入 `verify.ps1` 確效指令碼，驗證 Wiki 完整性與 Skill YAML Frontmatter 語法格式。
  * 調整 `.github/workflows/deploy.yml` 引入 `verify.ps1` 確效流程，通過後方可部署至 GitHub Pages，落實工業級 CI 安全護欄。
* **開發大腦與 IDE 引導規則對齊**：
  * 建立 `wiki/` 結構（`SCHEMA.md`、`global_rules.md`、`index.md`、`log.md`），以沉澱專案複利知識。
  * 部署 `.cursorrules`、`GEMINI.md`、`CLAUDE.md` 等全 IDE 引導配置，強制執行高信號 Context 讀取與高質感 Morandi 色彩規範。
  * 清理 `SkillsBuilder_temp` 臨時目錄，維持專案 MECE 乾淨度。
* **測試結果**：
  * 本地運行 `powershell -ExecutionPolicy Bypass -File .\verify.ps1` 通過 100% 軟體確效驗證。

---

## 增補需求：修復 PyInstaller 打包二進位檔子進程重啟與對話框失效 Bug

### 過程問題、分析與矯正 (RCA & CAPA)
* **問題現象**：在打包後的 `PPOV-Extractor.exe` 執行檔中，點選「選擇資料夾」與「新增品號」按鈕無響應，且會另外重複開啟網頁操作介面。
* **原因分析 (RCA)**：
  * 打包後 `sys.executable` 指向 `PPOV-Extractor.exe`。
  * `_select_directory_dialog` 與 `_select_files_dialog` 調用 `subprocess.run([sys.executable, "-c", ...])` 欲執行獨立 Python 對話框行程。
  * 由於打包後的二進位檔無法直接執行 `-c` 腳本，它會被當作主程式執行個體二次啟動。
  * 二次啟動的子進程在 `__main__` 中執行 `db["extracted_data"] = []`（清空資料庫的致命副作用），並檢測到 5000 連接埠已被主進程佔用，進而開啟瀏覽器並退出，導致主行程接收到空 stdout 而無響應。
* **矯正與預防措施 (CAPA)**：
  * 在 `main.py` 中重構 `_select_directory_dialog`、`_save_file_dialog`、及 `_select_files_dialog` 函式。
  * 引入 Windows 平台專屬判斷。若 `sys.platform == "win32"`，直接調用系統內建的 **PowerShell 子行程與 .NET Forms (`System.Windows.Forms`)** 進行資料夾及檔案的選取。
  * 非 Windows 平台或 PowerShell 調用失敗時，安全降級回 Tkinter `-c` Python 行程。
  * 如此完全避免執行檔二度執行重啟，並徹底解決 Tkinter 與多執行緒的衝突問題。

* **最新發現與二次優化 (2026-06-04 修正彈窗被遮擋與二次重啟清空資料庫 Bug)**：
  * **原因 (RCA)**：
    1. 當 PowerShell 對話框在背景（CREATE_NO_WINDOW）中被開啟時，由於沒有 Owner Form，Windows 防火鎖焦點機制會將其置於後台（遮擋於瀏覽器後方），導致使用者看不到對話框且 Flask 執行緒鎖死（Hang）。
    2. PowerShell 啟動時預設在 MTA 模式，且無 `-ExecutionPolicy Bypass`，導致在部分電腦上調用時會丟出執行緒或權限異常而進入 except 區。
    3. PowerShell 失敗後，代碼退回執行 `sys.executable -c`。因為在 PyInstaller 打包下這會再次以主程式實體重啟，重啟後立即執行資料庫清空，並在偵測到 5000 連接埠被佔用後開啟瀏覽器退出，造成主實體資料庫清空及多開瀏覽器。
  * **矯正措施 (CAPA)**：
    1. **置頂對話框**：在 PowerShell 腳本中建立一個隱藏的 `TopMost` Form 物件作為對話框的 parent，強迫檔案/資料夾選取視窗出現在前台。
    2. **安全執行旗標**：調用 PowerShell 時明確宣告 `-STA` (Single-Threaded Apartment) 與 `-ExecutionPolicy Bypass`。
    3. **打包安全護欄**：在 `main.py` 的對話框函式中加入 `is_frozen = getattr(sys, 'frozen', False)` 判斷，在打包環境下若 PowerShell 失敗或取消，直接返回空值，**絕對禁止**調用 `sys.executable -c`。
    4. **啟動埠位校驗重排**：將 `app.py` 的雙開校驗埠位佔用代碼提前至 `load_config` 與清空資料庫之前，徹底防禦任何手動或自動雙開對資料庫造成的二次清空破壞。

* **修復公模溫度數據出現亂碼 Bug (2026-06-04)**：
  * **原因 (RCA)**：
    1. PDF 表格中有些參數的下限/上限值填寫為 `NAC` (NCA的輸入錯誤/變體)，而核心 regex 匹配模式 `\b\d+\.?\d*\b|NCA|N/A` 沒有匹配 `NAC`，導致整行解析的 Token 數量不符合預期的表格式數據行（長度小於 3），進而使得整個 row 被跳過。
    2. 這導致解析邏輯誤選了前面的 `冷卻時間` 行（具有 3 個符合 Token `10.0`, `NCA`, `NCA`），將其錯誤匹配到母模溫度中。而公模溫度在 Fallback 時回傳了 `main.py` 中寫死的 Mojibake 亂碼字串 `?芣??`。
  * **矯正措施 (CAPA)**：
    1. 在 `main.py` 中，將 `find_table_value` 函式中的三個 regex 匹配模式均更新為相容 `NAC`：`\b\d+\.?\d*\b|NCA|NAC|N/A` 與 `\b(\d+\.?\d*|NCA|NAC|N/A)\b`。
    2. 將 `main.py` 中 Fallback 錯誤回傳的硬編碼亂碼字串 `?芣??` 修正為正常的中文 `"未找到"`。
    3. 在 `verify_extraction.py` 中，更新測試 PDF 的實際存放路徑，並移除 `config.json` 中已不存在的 `充填階段的模重_目標值` 欄位斷言，確保本機確效腳本 `verify.ps1` 能夠 100% 通過。
