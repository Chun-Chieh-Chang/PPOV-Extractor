---
name: knowledge-bridge
description: 知識橋樑。自動化處理從外部來源（NotebookLM、網頁研究、文件）匯入的 Markdown 知識，將其精煉並同步至專案 Wiki 與跨 session 持久記憶。整合 Hermes Agent 的記憶管理哲學。觸發詞：「啟動知識橋樑」、「同步知識」、「knowledge bridge」、「將研究轉化為資產」。
---

# Knowledge Bridge (知識橋樑)

此技能消除外部研究與本地開發之間的斷層。整合 Hermes Agent 的記憶管理哲學——不只是導入原始資料，而是將其蒸餾為「高信號、可操作、跨 session 持久化」的知識資產。

## 知識分類框架 (Hermes-Inspired Taxonomy)

| 知識類型 | 儲存目標 | 特性 |
|---------|---------|------|
| 核心架構決策 | `wiki/entities/` 或 `wiki/concepts/` | 持久化，跨任務引用 |
| 環境與工具事實 | `wiki/MEMORY.md` | 跨 session 注入，無需重新發現 |
| 使用者指導原則 | `wiki/USER.md` | 影響所有對話的溝通偏好 |
| 原始素材存檔 | `raw/` | 不可變，作為引用來源 |
| 操作日誌 | `DEV_LOG.md` | 時序記錄，RCA/CAPA 格式 |

## 執行流程 (The Sync Pipeline)

### Phase 1: Ingest & Parse (吸收與解析)
- **動作**：掃描輸入來源（`raw/` 目錄、使用者貼上的文字、URL）
- **目標**：識別內容中的：
  - **核心實體 (Entities)**：工具、框架、系統、人物
  - **技術規範 (Conventions)**：最佳實踐、決策邏輯
  - **邏輯約束 (Constraints)**：邊界條件、已知限制
  - **可操作指令 (Actionable Commands)**：可直接執行的命令或腳本

### Phase 2: Hermes 信號過濾 (Signal Filtering)
根據 Hermes 記憶管理哲學，篩選「值得保留」的知識：

✅ **應保留**：
- 對未來任務有直接指導價值的決策邏輯
- 非顯性的工作流（需要多步驟才能重新發現）
- 已驗證有效的技術組合
- 使用者的明確偏好或糾正

❌ **應跳過**：
- 容易用網路搜尋的通用知識
- 原始 log 或大塊代碼（放 `raw/` 即可）
- 過於抽象、無法執行的描述
- 與現有 wiki 高度重疊的內容

### Phase 3: Refine & Categorize (精煉與分類)
- 將技術細節提取至 `wiki/entities/`（每個工具/系統一個文件）
- 將開發準則提取至 `wiki/concepts/`（每個設計模式一個文件）
- 關鍵操作型事實 → 更新 `wiki/MEMORY.md`（容量 < 2,200 chars）
- 使用者偏好相關 → 更新 `wiki/USER.md`（容量 < 1,375 chars）

### Phase 4: Sync & Evolution (同步與進化)
- 更新 `wiki/index.md` 加入新實體/概念的索引連結
- 在 `wiki/log.md` 記錄本次知識導入
- 在 `DEV_LOG.md` 記錄 RCA：為什麼要導入這份知識？
- 如果內容包含新的代碼模式，自動提議更新 `GEMINI.md`
- 如果涉及新的技能需求，呼叫 `skill-creator` 自動建立

## 容量守衛 (Capacity Guard)
在更新 MEMORY.md 或 USER.md 前，先確認容量：
- 若 > 80% 滿，先整合現有條目再新增
- 合併策略：將三條「專案用 X」→ 一條綜合描述
- 移除策略：過時的條目、已被取代的慣例

## 指令模式 (Magic Phrases)
- 「啟動知識橋樑，同步 `raw/` 下的資料」
- 「Sync knowledge from NotebookLM」
- 「將匯出的研究轉化為開發資產」
- 「記錄這次的研究發現」

## 自動化原則
- **MECE 分類**：導入的知識不與現有 Wiki 衝突，使用 `replace` 進行增量更新
- **高信號提取**：過濾冗餘解釋，只保留對開發有直接指導意義的「信號」
- **引用可追溯**：每個 wiki 條目都應能追溯至 `raw/` 下的原始素材
