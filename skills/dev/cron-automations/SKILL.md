---
name: cron-automations
description: 自然語言排程自動化任務。實作 Hermes Agent 的 Scheduled Automations 機制——用自然語言定義定期任務（每日報告、夜間備份、週期審查），並整合至本專案的 hooks 與 verify.ps1 確效流程。觸發詞：「排程任務」、「定期執行」、「cron」、「自動化」、「每天/每週執行」。
---

# Cron Automations (排程自動化)

此 skill 實作 Hermes Agent 的 Scheduled Automations 機制，讓 AI 代理能夠：
1. 用自然語言定義排程任務
2. 將任務轉換為本專案的 hooks 或 PowerShell 排程
3. 無人值守地執行定期維護、驗證與報告

## 自然語言 → 排程轉換

使用者說：「每天晚上 11 點幫我同步一次 skills」
↓ 代理轉換為：
```
時間：23:00 daily
動作：powershell -ExecutionPolicy Bypass -File INSTALL.ps1
通知：更新 DEV_LOG.md 記錄同步結果
```

### 支援的時間表達方式
| 自然語言 | Cron 等效 | 範例 |
|---------|---------|------|
| 每天 X 點 | `0 X * * *` | 「每天早上 9 點」 |
| 每週一 | `0 9 * * 1` | 「每週一早上」 |
| 每小時 | `0 * * * *` | 「每小時檢查一次」 |
| 工作日 | `0 9 * * 1-5` | 「每個工作日」 |
| 每次 commit | Git hook (post-commit) | 「每次 push 後」 |
| 每次儲存 | fileEdited hook | 「每次存檔後」 |

## 本專案排程整合方式

SkillsBuilder 支援兩種排程機制：

### 1. Kiro Hooks（首選，整合於 IDE）
適用於：IDE 事件驅動的自動化（檔案儲存、任務完成、commit 後）

```json
{
  "name": "Auto Verify on Save",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.md", "skills/**/*.md"]
  },
  "then": {
    "type": "runCommand",
    "command": "powershell -ExecutionPolicy Bypass -File verify.ps1"
  }
}
```

Hook 文件存放路徑：`.kiro/hooks/`

### 2. Windows 工作排程器（適用於時間驅動任務）
使用 PowerShell 建立系統級排程：

```powershell
# 建立每日同步任務
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File C:\Self-developed_Apps\SkillsBuilder\INSTALL.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "23:00"
Register-ScheduledTask -TaskName "SkillsBuilder-DailySync" `
    -Action $action -Trigger $trigger -RunLevel Highest
```

## 常用排程任務範本 (SkillsBuilder 專用)

### 任務 1：每日 skills 同步
```
時機：每天 23:00
命令：powershell -ExecutionPolicy Bypass -File INSTALL.ps1
用途：確保全域 skills 池與本專案同步
記錄：在 DEV_LOG.md 追加同步狀態
```

### 任務 2：每次 skill 修改後自動驗證
```
時機：*.md 文件存檔（fileEdited hook）
命令：powershell -ExecutionPolicy Bypass -File verify.ps1
用途：確保 SKILL.md frontmatter 格式合規
```

### 任務 3：Git push 前自動確效
```
時機：pre-push Git hook
命令：powershell -ExecutionPolicy Bypass -File verify.ps1
用途：阻止未通過確效的代碼推送到遠端
```

### 任務 4：每週 wiki 健康檢查
```
時機：每週一 09:00
動作：檢查 wiki/ 目錄的死連結、孤兒頁面
記錄：輸出報告至 wiki/log.md
```

## 執行流程

### 建立新排程任務
1. **理解需求**：確認觸發條件（時間 vs 事件）
2. **選擇機制**：Kiro hook（事件驅動）or Windows 工作排程器（時間驅動）
3. **撰寫命令**：確認命令在 PowerShell 中可獨立執行
4. **測試執行**：手動觸發一次確認正確
5. **記錄**：在 DEV_LOG.md 記錄新增的排程任務

### Kiro Hook 建立步驟
```
1. 確認 hook 類型（fileEdited / userTriggered / postTaskExecution 等）
2. 設計 JSON 結構（符合 Hook File Schema）
3. 存至 .kiro/hooks/{hook-name}.json
4. 在 IDE 中驗證 hook 已正確載入
```

## 排程任務管理

### 列出現有 hooks
```powershell
Get-ChildItem .kiro/hooks/ -Filter "*.json"
```

### 列出 Windows 排程任務
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like "SkillsBuilder*"}
```

### 停用排程任務
```powershell
Disable-ScheduledTask -TaskName "SkillsBuilder-DailySync"
```

## 安全原則
- 排程命令只執行本專案的 `.ps1` 腳本，不執行動態產生的命令字串
- 絕不在 hook 命令中硬編碼 API keys 或密碼
- 排程命令執行前應有 `verify.ps1` 保護，確保不在損壞狀態下執行同步
