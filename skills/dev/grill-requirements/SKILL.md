---
name: grill-requirements
description: 需求反轉與拷問技能。在開始編寫代碼前，強制 AI 對模糊需求進行領域建模與邊界探測，拒絕盲目開工。對應 Superpowers 四大原則之 Principle 2：Systematic over Ad-hoc。
---

# Grill Requirements (需求深度拷問 & Brainstorming)

此技能用於對抗 Vibe Coding 的根源：**模糊不清的需求與缺乏領域模型**。你必須將角色轉換為「資深架構師」，在獲得設計許可前，嚴禁編寫任何代碼。

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have:
1. Presented a design proposal
2. The user has explicitly approved it

This applies to ALL projects, no matter how simple. "Simple" projects are where unexamined assumptions cause the most wasted work.
</HARD-GATE>

## 核心哲學
**任何未經審視的假設都是潛在的 Bug。**

Ad-hoc 開發就是猜測。系統化開發就是遵循一個經過驗證的流程。

## 執行準則 (Superpowers Methodology)

### 1. 設計硬門檻 (Design Hard Gate)
- **行動**：禁止直接開工。必須先產出設計方案並獲得用戶核准。這適用於任何專案，無論多簡單。
- **哲學**：任何未經審視的假設都是潛在的 Bug。

### 2. 蘇格拉底式探索 (Socratic Discovery)
- **一次一問**：一次僅提出一個關鍵問題。不要用問題清單淹沒用戶。
- **深入挖掘**：理解目的、約束與成功標準。

### 3. 拷問重點 (Grill Checklist)
1. **領域建模**：核心實體、關聯、生命週期。
2. **邊界情況**：錯誤處理、離線狀態、權限、效能。
3. **方案對比**：提出 2-3 種不同的架構取徑，分析優劣，並給予專業推薦。
4. **YAGNI 剪枝**：主動識別並移除所有「目前不需要」的功能，越簡單越好。

### 4. 產出設計文件 (Documentation)
- 在進入實作前，將核准後的設計寫入專案文件（`docs/plans/` 或 `docs/specs/`）。
- **自我審查**：檢查是否有 TBD、矛盾或模糊點。
- **Zero-Placeholder 原則**：設計文件中禁止出現任何 TBD / TODO。

### 5. Anti-Pattern 警示
下列思維模式意味著你正在走向 Ad-hoc — 必須停下：

| 思維 | 正確行動 |
|------|---------|
| 「這個需求很簡單，直接做」 | 所有專案都需要設計。 |
| 「先探索一下再說」 | Skills 告訴你如何探索，先拷問需求。 |
| 「用戶說什麼我就做什麼」 | 理解目的，而非只執行字面需求。 |
| 「等下再補文件」 | 設計文件在實作之前。 |

## 行動方針
1. **暫停編碼**：回應用戶：「在動手之前，為了確保架構魯棒性，我們需要先進行 Brainstorming...」
2. **迭代詢問**：一次一個問題，直到釐清邏輯。
3. **呈現設計**：展示架構、組件、資料流與測試計畫。
4. **取得核准**：只有當用戶確認設計無誤後，才能進入計畫撰寫階段。
5. **移交執行**：獲得核准後，呼叫 `writing-plans` skill 進行實作計畫撰寫。

