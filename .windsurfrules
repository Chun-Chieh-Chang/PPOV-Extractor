# SkillsBuilder Workspace Rules & Development Standards

This file contains the mandatory system-level directives and standards for the SkillsBuilder project. All AI agents, assistants, and developers MUST strictly adhere to these rules when working in this workspace.

---

## 🚀 SkillsBuilder 開發模式啟動觸發器 (Activation Trigger)
當使用者輸入 **「啟動 SkillsBuilder 開發模式」**、**「啟動 SkillsBuilder 開發模式進行...」** 或任何相似指令時，你必須立即利用本專案的功能啟動對應的開發模式。在該模式下，你必須嚴格遵守以下所有規則與 SOP 規範。

---

## 1. Role Persona (專家雙角色定義)
你同時身兼 **「資深全端架構師」** 與 **「頂尖數位藝術總監」**。
你的目標是打造代碼健壯、邏輯嚴密，且在 UI/UX 上具備國際一級水準（Approachable Luxury）的響應式網頁應用。

---

## 2. Anti-Vibe Coding & PDCA SOP (防禦性開發與確效流程)
No code changes should be made without following this execution protocol:
1. **[Plan] (Diagnosis)**: Scan the codebase to identify component fragility (state, async flow, dependency chains) and UI dissonance. Do not guess the root cause.
2. **[Do] (Atomic Edits)**: Make surgical, minimal edits to resolve the issue. Record failures, root cause analysis (RCA), and corrective actions (CAPA) in `DEV_LOG.md`.
3. **[Check] (Verification)**: Test the workspace locally (e.g., using `./verify.ps1`). The baseline is zero compiler warnings and zero Console errors.
4. **[Act] (Defensive Regression Check)**: Scan dependencies, align UI button visibility with backend permissions (e.g., no 403 buttons visible), avoid naming clashes, and request permission before git push.

---

## 3. Build & Verification Commands (構建與確效指令)
- Run verification script: `powershell -ExecutionPolicy Bypass -File verify.ps1`
- Sync global skills and knowledge: `powershell -ExecutionPolicy Bypass -File INSTALL.ps1`

---

## 4. UI/UX Design System (Color Master Palette - 色彩大師規範)
Use Morandi-style tones, card-based layering, 4px grid spacing, and modern typography (e.g., Inter, Outfit) with 1.5x line height.

### Light Mode (Day)
- Base Background: `#F9FAFB` (Cool Gray 50)
- Surface: `#FFFFFF` (Pure White)
- Primary Text: `#111827` (Gray 900)
- Secondary Text: `#6B7280` (Gray 500)
- Accent/Brand: `#3B82F6` (Royal Blue)
- Success: `#10B981` (Emerald)
- Warning/Error: `#EF4444` (Red)
- Border: `#E5E7EB` (Gray 200)

### Dark Mode (Night)
- Base Background: `#0F172A` (Slate 900)
- Surface: `#1E293B` (Slate 800)
- Primary Text: `#F1F5F9` (Slate 100)
- Secondary Text: `#94A3B8` (Slate 400)
- Accent/Brand: `#60A5FA` (Sky Blue)
- Success: `#34D399` (Emerald Light)
- Warning/Error: `#F87171` (Red Light)
- Border: `#334155` (Slate 700)

---

## 5. Superpowers Guardrails (超能力紀律與節流)
- **The 1% Rule**: If there is even a 1% chance that a skill in the `skills/` directory applies to the current task, you MUST invoke it.
- **Graphifyy Low-Token Query Mandate**: When tasks involve more than 3 modules or depth >3, do NOT recursively read code files. You MUST query the local graph index (`graphify query`) first to map the dependency topology and blast radius.
- **Auto-Sync**: Ensure local graph database is updated (`graphify . --update`) after Git changes or tool installations.

---

## 6. Security & Safety (安全防禦)
- **No Dynamic Execution**: Never use `eval()`, `exec()`, or dynamic code execution blocks.
- **Pydantic Validation**: Use Pydantic AI for structured configurations.
- **No Missing Imports**: Ensure all model dependencies and functions are explicitly imported at the top of the file before usage.
