
# PPOV Extractor - 可執行檔打包說明

## 打包完成 ✅

已成功打包成單一可執行檔！

### 檔案位置
```
PPOV-Extractor/dist/PPOV-Extractor.exe
```

### 使用方式
1. 雙擊 `PPOV-Extractor.exe` 執行
2. 瀏覽器會自動開啟 http://127.0.0.1:5000
3. 使用方式與原來完全相同

### 包含的功能
- ✅ PDF 資料提取
- ✅ 保壓壓力顯示 X/Y 兩個數值
- ✅ 保壓壓力單位動態顯示
- ✅ 現場生產查檢紀錄
- ✅ 匯出 Excel 規格單
- ✅ 匯出總表（Excel/JSON）

### 系統需求
- Windows 作業系統
- 不需要安裝 Python
- 不需要安裝任何依賴套件

---

## 開發者說明

### 重新打包
如果需要重新打包，使用專案根目錄的 `build.spec`（內含完整的 hiddenimports 設定）：

1. 安裝 PyInstaller
```bash
pip install pyinstaller
```

2. 執行打包（使用 build.spec 設定檔）
```bash
pyinstaller build.spec
```

3. 打包完成的檔案在 `dist/` 資料夾中

### 打包設定（build.spec）
- 產物名稱：`PPOV-Extractor.exe`
- `datas`：加入 `static/`、`templates/` 與 `config.json`
- `hiddenimports`：預先打包 `pdfplumber`、`pandas`、`openpyxl`、`flask`

