# Activity Log

All significant project events, wiki ingests, and architectural decisions are recorded here.

## [2026-08-02] Refactor | Project Architecture Consolidation & Backend Extraction Reversion
*   **Action**: Completed full 5-step SOP project refactor & cleanup (`project-refactor-cleanup` skill).
*   **Changes**:
    - Purged client-side mock PDF generation code and restored pure Python backend `pdfplumber` PDF parameter extraction (`/api/select_folder` & `/api/extract`).
    - Standardized button labels: `"選擇資料夾(PDF檔案)"` (`#btnSelectFolder`) and `"載入現有總表(Excel檔案)"` (`#btnLoadMasterFile`).
    - Implemented Header Alias Normalization Map (`"品號"` -> `"產品型號"`, `"模號"` -> `"模具編號"`, etc.) for seamless master table loading across non-standard Excel/JSON formats.
    - Upgraded Master Table row selection to a 3-tier lookup algorithm (`"檔案名稱"` -> `"產品型號"+ "模具編號"` -> Row Index) matching commit `a0e732a` architecture.
    - Synchronized `DEV_LOG.md`, `docs/DEV_LOG.md`, `wiki/log.md`, `AGENTS.md`, and `GEMINI.md`.
    - Created system-global skill `project-refactor-cleanup` under `C:\Users\3kids\.gemini\config\skills\project-refactor-cleanup\SKILL.md`.
*   **Goal**: Ensure 100% data integrity with real PDF parameters, enforce historical baseline preservation, and eliminate data mismatch.

---

## [2026-08-02] Refactor | GitHub Pages HTML5 Folder Picker & Passwordless Access Control
*   **Action**: Implemented native browser folder selection for GitHub Pages & completely purged password login infrastructure.
*   **Changes**:
    - HTML5 native folder selector (`#inputFolder webkitdirectory`) integrated into `index.html` & `templates/index.html`.
    - Pure client-side in-memory processing engine implemented in `static/app.js` using `FileReader` & `SheetJS` (Zero-Server Upload, 0 HTTP Requests, 100% Client Privacy).
    - Password login modals (`loginOverlay`, `changePasswordModal`), `users.json`, and all password hashing code completely purged.
    - Upgraded 5-click easter egg to 1.5s sliding timestamp window algorithm (`now - t <= 1500`) with zero popups or tooltips for stealthy role elevation.
    - Universal Blob Download Fallback added to `saveBlobWithPathPrompt` ensuring 100% export reliability across Firefox, Safari, and mobile browsers.
    - Synchronized `DEV_LOG.md`, `docs/Password_Management.html`, `docs/System_Admin_Manual.html`, and `wiki/log.md`.
*   **Goal**: Enable 100% feature parity on GitHub Pages with 0 data privacy leakage risks and ultra-streamlined UX.

---

## [2026-08-02] Refactor | Admin Mode 5-Click Unlock & MECE Clean-up
*   **Action**: Refactored Administrator Mode trigger & performed MECE codebase optimization.
*   **Changes**:
    - Replaced explicit "Admin Login" button with a hidden 5-click easter egg on `#btnVersion` tag (1.5s time window).
    - Purged `btnLoginPrompt` HTML button element and all Javascript DOM & handler code paths (`index.html`, `templates/index.html`, `static/app.js`).
    - Enhanced Morandi design tokens and micro-interactions for `.version-badge` UI.
    - Updated documentation across `DEV_LOG.md`, `docs/Password_Management.html`, `docs/System_Admin_Manual.html`, and `wiki/log.md`.
*   **Goal**: Streamline UI interface, enforce robust hidden auth escalation, eliminate dead code, and maintain 100% doc-code alignment.

---

## [2026-06-03] Integration | Hermes Agent Core Capabilities
*   **Source**: [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
*   **Action**: Integrated Hermes Agent's core capabilities into SkillsBuilder skill library.
*   **Changes**:
    - Heavily upgraded `skills/dev/soul-evolution/SKILL.md` — Hermes SOUL.md dual-zone (IMMUTABLE + EVOLVABLE) architecture.
    - Heavily upgraded `skills/dev/skill-creator/SKILL.md` — Full `skill_manage` protocol (create/patch/edit/write_file/delete).
    - Created `skills/dev/session-memory/SKILL.md` — Dual-track persistent memory (MEMORY.md + USER.md).
    - Created `skills/dev/cron-automations/SKILL.md` — Natural language scheduled automations + Kiro Hooks integration.
    - Upgraded `skills/dev/knowledge-bridge/SKILL.md` — Hermes memory taxonomy + signal filtering framework.
    - Created `wiki/entities/hermes-agent.md` — Complete capability matrix and integration map.
*   **Goal**: Enable SkillsBuilder agents to autonomously grow through closed learning loops — creating skills from tasks, persisting memory across sessions, and scheduling recurring maintenance.

---

## [2026-06-03] Enhancement | Superpowers 4 Core Principles Integration
*   **Source**: [obra/superpowers](https://github.com/obra/superpowers) + oficial docs (obra-superpowers.mintlify.app)
*   **Action**: GAP analysis against Superpowers 4 core principles, hardened existing skills and filled missing ones.
*   **Changes**:
    - Upgraded `skills/dev/tdd-enforcer/SKILL.md` — Added `<HARD-GATE>`, "delete unverified code" rule, 8-item pre-completion checklist.
    - Upgraded `skills/dev/grill-requirements/SKILL.md` — Added `<HARD-GATE>`, YAGNI pruning step, Anti-Pattern warning table.
    - Created `skills/dev/complexity-reduction/SKILL.md` — YAGNI / DRY / Vertical Slices principles with full detection checklist.
*   **Goal**: Ensure all 4 Superpowers principles (TDD / Systematic / Complexity Reduction / Evidence over Claims) have complete, independent skill coverage.

---

## [2026-06-03] Ops | Multi-IDE Auto-Loading Rules Deployment
*   **Action**: Deployed workspace rules to 13 AI tools/IDEs simultaneously.
*   **Changes**: Created `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurfrules`, `.rules`, `.trae/rules/rules.md`, `.kiro/steering/steering.md`, `.qoder/rules/rules.md`, `.antigravity.md`, `AGENTS.md`, `.clinerules`, `.continue/rules/rules.md`, `INSTALL.ps1` (updated).
*   **Goal**: Ensure SkillsBuilder development standards auto-load in every AI assistant session.

---

## [2026-06-02] Feature | Manus Mode Autonomous Executor Integration
*   **Action**: Integrated Manus AI's "Mind to Hand" philosophy as autonomous execution pipeline.
*   **Changes**:
    - Created `skills/dev/autonomous-executor/SKILL.md` — Phase 0-4 pipeline (Socratic → Discovery → Planning → Execution → Evolution).
    - Updated `GEMINI.md` with Manus Mode principles.
*   **Goal**: Enable end-to-end autonomous task completion without user intervention after Phase 0 approval.

---

## [2026-05-31] Ingest | Karpathy AutoResearch Loop
*   **Source**: [Karpathy AutoResearch Repository](https://github.com/karpathy/autoresearch).
*   **Action**: Integrated `autoresearch` autonomous ML experimentation capability into the developer library and synced locally.
*   **Changes**: 
    - Created `skills/dev/autoresearch/SKILL.md` closed-loop experimentation tool.
    - Synthesized `wiki/entities/autoresearch.md` entity.
    - Updated `wiki/index.md` navigation and `README.md` dev list.
*   **Goal**: Enabling the agentic environment with the capability to autonomously modify code, run timebox experiments, and ratchet improvements.

---

## [2026-05-31] Ingest | Vercel Find-Skills Capability
*   **Source**: [Vercel Find-Skills Gist/Repo](https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md).
*   **Action**: Integrated `find-skills` package manager capability into the global library and synced locally.
*   **Changes**: 
    - Created `skills/core/find-skills/SKILL.md` guidance tool.
    - Synthesized `wiki/entities/find-skills.md` entity.
    - Updated `wiki/index.md` navigation and `README.md` core list.
*   **Goal**: Equpping the agentic environment with the capability to autonomously discover and install modular skills.

---

## [2026-05-23] Feature | Graphify Local Graph & Low-Token Query Mandate
*   **Action**: Integrated `graphifyy` into SkillsBuilder to provide serverless codebase indexing.
*   **Changes**: 
    - Created `skills/dev/graphify/SKILL.md` for AI-agent guidance.
    - Updated `INSTALL.ps1` to detect environment, auto-provision `graphifyy` and Git hooks.
    - Added `wiki/global_rules.md` Section 4.5 enforcing 71.5x token budget efficiency.
    - Refined `.gitignore` to exclude `graphify-out/` outputs.
*   **Insight**: Graph-based querying replaces blind grep or deep recursively reading code, massively optimizing token spending.

---

## [2026-05-03] Ingest | ClawHub All-Star Skill Library
*   **Source**: [resource/](file:///f:/Self-developed_Apps/SkillsBuilder/resource/) (ClawHub screenshots).
*   **Action**: Fully populated the library with the "Top 15" industry-standard skills.
*   **Changes**: 
    - Added `core/`: last30days, x-trends, vetter, skill-onboarding.
    - Added `dev/`: github, web-coder, soul-evolution, skill-creator.
*   **Result**: `SkillsBuilder` now manages a total of 15+ high-fidelity skills.

---

## [2026-05-03] Architecture | Global Skill Library Transformation
*   **Action**: Restructured `skills/` and centralized core capabilities.
*   **Changes**: 
    - Created `skills/core/` and `skills/dev/` hierarchy.
    - Stored `tavily`, `summarize`, `planning`, and `youtube` skills in the repo.
    - Upgraded `INSTALL.ps1` for recursive symbolic linking.
    - Created `skill-library.md` concept page.
*   **Goal**: Making `SkillsBuilder` the single source of truth for all agentic capabilities.

---

## [2026-05-03] Sync | Full Documentation Alignment
*   **Action**: Synchronized all project documentation with the new GitNexus & Antigravity-native logic.
*   **Changes**: 
    - Updated `antigravity-ide.md` (Entity), `README.md` (Storefront), and `PROJECT_DEVELOPMENT_SOP.html` (Bootstrap).
    - Integrated GDD into `skills-builder.md` architectural standards.
*   **Goal**: Ensuring 100% consistency across the entire project brain.

---

## [2026-05-03] Persona Alignment | Antigravity-Native GitNexus
*   **Action**: Replaced "Claude Code" with "Antigravity" as the primary agent for GitNexus integration.
*   **Changes**: 
    - Updated `gitnexus.md` and `graph-driven-dev.md`.
    - Created `skills/gitnexus/SKILL.md` for native Antigravity support.
*   **Insight**: Antigravity is now the sole owner of the "God's View" workflow within this ecosystem.

---

## [2026-05-03] Ingest | GitNexus & Graph-Driven Dev (GDD)
*   **Source**: YouTube [Zy6tS-7xg9M](https://www.youtube.com/watch?v=Zy6tS-7xg9M).
*   **Action**: Synthesized the "God's View" workflow into the Wiki.
*   **Changes**: 
    - Created `gitnexus.md` entity.
    - Created `graph-driven-dev.md` concept.
*   **Insight**: Integrating structural graph awareness is the next level of Agentic Coding, moving beyond basic RAG.

---

## [2026-05-03] Feature | Cross-Device Portability
*   **Action**: Created a automated installation script for seamless migration.
*   **Changes**: 
    - Created `INSTALL.ps1` for one-click setup.
    - Created `migration.md` concept page.
    - Updated `README.md` with installation guides.
*   **Goal**: Enabling `SkillsBuilder` to act as a "Portable Brain" across different environments.

---

## [2026-05-03] Polish | Project Face & Metadata Refinement
*   **Action**: Upgraded README and synchronized metadata across core entities.
*   **Changes**: 
    - Rewrote `README.md` to reflect the "Wiki-centric" and "Global KI" status.
    - Updated `skills-builder.md` and `skill-architect.md` entities.
    - Refined `.gitignore`.
*   **Goal**: Professionalizing the project entrance for future collaboration.

---

## [2026-05-03] Cleanup & Entity Expansion
*   **Action**: Archived legacy files and expanded the Entity library.
*   **Changes**: 
    - Moved legacy `.md` files to `raw/legacy/archive/`.
    - Created `tavily.md`, `summarize.md`, `planning.md`, and `youtube.md` entity pages.
*   **Goal**: Professionalizing the wiki structure and identifying external tool capabilities.

---

## [2026-05-03] Ingest | Legacy Skills Manual & Lifecycle
*   **Source**: `raw/legacy/antigravity_skills_manual.md`, `implementation_plan.md`.
*   **Action**: Synthesized legacy knowledge into structured concept pages.
*   **Changes**: Created `skill-triggering.md` and `skill-lifecycle.md`. Updated `index.md`.
*   **Insight**: Transitioned from "CLI-heavy" documentation to "Natural Language Triggering" philosophy.

---

## [2026-05-03] Sync | Skill Architect Upgrade
*   **Action**: Synchronized `skill-architect` patterns with the Wiki.
*   **Changes**: Added "Knowledge Artifact" (Pattern 6) to `references/patterns.md` and mandated the "Archive Phase" in `SKILL.md`.
*   **Goal**: Ensuring all future skills built with this architect natively support the LLM Wiki pattern.

---

## [2026-05-02] Ingest | Karpathy LLM Wiki Pattern
*   **Source**: [Andrej Karpathy's Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
*   **Action**: Initialized the `wiki/` structure in `SkillsBuilder`.
*   **Changes**: Created `SCHEMA.md`, `index.md`, `log.md`, and directory structure.
*   **Goal**: Evolving `SkillsBuilder` from a skill generator to a knowledge-compounding agent.
