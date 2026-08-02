# Strix 滲透掃描報告（2026-08-02）

## 執行概況

| 項目 | 狀態 |
|---|---|
| **工具** | Strix 1.1.0（多代理 AI 滲透測試工具，agnes-ai LLM 雲端） |
| **DAST 目標** | `http://127.0.0.1:5000`（Flask 本地服務，deep 模式） |
| **SAST 目標** | 專案核心目錄（排除敏感資料：users.json、ppov_database.json、output/、TestData/） |
| **掃描時間** | 2026-08-02 11:43 ~ 12:25 UTC |

## 掃描限制說明

- **SAST 未完成**：agnes 系列模型與 Strix 工具呼叫協定不相容（`read_file` 工具缺失、無效 JSON tool call），消耗 14.2M tokens 後無產出，已中止。
- **DAST 完成**：產出 4 個發現（見下方），但經人工對照代碼驗證，**部分技術細節為模型幻覺**，已逐一修正。

## 發現清單（已驗證）

| ID | 嚴重度 | 標題 | 驗證結果 |
|----|--------|------|----------|
| vuln-0001 | CRITICAL (9.1) | CWE-798 硬編碼金鑰 | ✅ 真實（細節修正：非 JWT，為 Flask session secret `app.py:51`） |
| vuln-0002 | HIGH (8.8) | CWE-639 IDOR | ❌ 幻覺——`/api/documents/*` 端點不存在，本專案為單一 admin 模型 |
| vuln-0003 | MEDIUM (5.3) | CWE-209 資訊洩漏 | ✅ 真實（多處 `str(e)` 回傳客戶端） |
| vuln-0004 | MEDIUM (4.6) | CWE-79 XSS | ⚠️ 部分真實（依前端渲染方式而定） |

## 人工驗證補充發現（Strix 未報）

1. **認證繞過**：`/api/auth/elevate`（app.py:65）無任何授權即可提升為 admin——但此為**刻意設計**（前端 5 連擊解鎖），已加 `PPOV_DISABLE_ELEVATE=1` 開關可停用。
2. **debug=True**：app.py 原以 debug 模式啟動，已改為 `PPOV_DEBUG` 環境變數控制（預設關閉）。

## 修復紀錄（已完成）

| 修復項目 | 變更 |
|----------|------|
| 硬編碼 secret_key | 改由 `PPOV_SECRET_KEY` 環境變數讀取，未設定時 fallback 並輸出警告 |
| elevate 認證繞過 | 新增 `PPOV_DISABLE_ELEVATE=1` 開關（保留設計意圖，可停用） |
| debug=True | 改由 `PPOV_DEBUG` 環境變數控制（預設關閉） |
| 錯誤訊息洩漏（4 處） | `str(e)` 改為通用訊息 + server 端 log |

## 原始產物

- `strix-dast-20260802.sarif` — SARIF 2.1.0 格式
- `strix-dast-20260802-vulnerabilities.json` / `.csv` — 結構化發現
- `vulnerabilities/vuln-000X.md` — 各發現詳細報告