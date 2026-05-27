
# 問題記錄 (Issue Record)

## 問題 001: 無法匯出檔案到專案資料夾以外的地方

### 日期
2026-05-27

### 問題描述
- 現象：匯出品號規格單或總表時，無法存檔到專案資料夾以外的地方
- 影響：用戶無法自由選擇存檔位置

---

## PDCA 循環

### P (Plan) - 問題分析
1. 可能原因：tkinter 檔案對話框在 Flask 伺服器環境中有權限問題
2. 測試計劃：
   - 簡化 _save_file_dialog 函式
   - 啟用 debug 模式查看錯誤
   - 改回直接下載方式（不透過 tkinter）

### D (Do) - 執行
1. **第一輪**：簡化 `_save_file_dialog` 函式，移除 subprocess 呼叫 → 失敗
2. **第二輪**：啟用 Flask debug 模式 → 失敗
3. **第三輪**：把後端改為直接下載（不透過 tkinter）→ 需要修改前端
4. **第四輪**：同時修改後端和前端，處理二進制回應 → 成功

### C (Check) - 檢查
- ✅ 確認：用戶可以正常匯出並存檔到任意資料夾
- ✅ 確認：保壓壓力顯示 X/Y 兩個數值
- ✅ 確認：保壓壓力單位根據被勾稽的項目動態顯示

### A (Act) - 行動
1. 記錄 RCA 和 CAPA
2. 提交修改到 git
3. 建立此問題記錄檔案

---

## RCA (根本原因分析)

### 問題描述
tkinter 檔案對話框在 Flask 伺服器環境中有權限問題，特別是在 Windows 上存取特定資料夾（如下載資料夾）時會有問題。

### 根本原因
1. **環境問題**：tkinter 在 Flask 後端伺服器環境中運行時，與原生桌面應用程式的運行環境不同
2. **權限問題**：Windows 對某些資料夾（如下載）有額外的權限保護
3. **UI 元件不匹配**：後端伺服器不應該依賴原生 UI 元件（如 tkinter）來與用戶互動

---

## CAPA (糾正與預防措施)

### 糾正措施 (Corrective Action)
1. **後端修改**：
   - `export_master` 改為直接下載方式（不透過 tkinter）
   - `export_part_excel` 改為直接下載方式（不透過 tkinter）
   - 使用 `io.BytesIO()` 和 `send_file()` 返回二進制檔案

2. **前端修改**：
   - `export_master` 後端模式：改為處理二進制回應，使用 `response.arrayBuffer()`
   - `export_part` 後端模式：改為處理二進制回應，使用 `response.arrayBuffer()`
   - 使用 `Blob` 和 `saveBlobWithPathPrompt` 讓瀏覽器處理下載

### 預防措施 (Preventive Action)
1. **設計原則**：
   - 在 Flask 後端中，**盡量避免使用 tkinter 等原生 UI 元件**
   - 優先使用瀏覽器原生的下載功能，這樣更穩定且跨平台

2. **測試要求**：
   - 如果需要使用原生對話框，要確保在不同作業系統（Windows/macOS/Linux）和不同環境下測試過
   - 測試存檔到不同位置（桌面、下載、文件夾等）

3. **程式碼準則**：
   - 後端只負責數據處理和傳輸
   - 用戶互動（如選擇存檔位置）應該由前端/瀏覽器處理

---

## 修改的檔案
- `app.py`：修改 `export_master` 和 `export_part_excel`
- `static/app.js`：修改後端模式的匯出處理

---

## 驗證結果
✅ 用戶確認可以正常匯出並存檔到任意資料夾

