---
name: autonomous-executor
description: Execute complex goals autonomously using the Manus-style "Mind to Hand" pipeline. Trigger when the user says "啟動全自動開發模式" or provides a high-level objective that requires research, planning, and execution.
---

# Autonomous Executor (Manus Mode)

This skill implements a high-autonomy pipeline that bridges the gap between a high-level "Mind" (concept) and a finished "Hand" (result). It is designed to run non-stop inside an AI IDE (like Antigravity) once the initial agreement is reached.

## The Pipeline

When this skill is triggered, follow these phases. **Crucially: Phase 0 is interactive. Once Phase 0 is approved, Phase 1 through 4 must execute continuously without stopping to ask the user, utilizing positive feedback loops (TDD/Validation) to correct course autonomously.**

### Phase 0: Socratic Alignment (The Agreement)
- **Action**: Invoke the `grill-requirements` AND `spec-architect` skills.
- **Goal**: Use Socratic questioning to understand the user's intent. Then, let `spec-architect` translate those intentions into technical **Verifiable Completion Criteria** (e.g., "All tests pass", "UI matches design tokens exactly", "No console errors").
- **Gate**: Present the final "Translation" to the user for confirmation. Once approved, the Agent is locked onto these technical targets.

### Phase 1: Discovery (The Mind)
- **Action**: Use `tavily-research` or `google_web_search` to understand the domain, competitors, and technical requirements.
- **Output**: Write findings to `findings.md`.

### Phase 2: Architecting (The Plan)
- **Action**: Use `planning-with-files` to create a `task_plan.md`.
- **Refinement**: Break down the goal into MECE (Mutually Exclusive, Collectively Exhaustive) phases. Integrate the Verifiable Completion Criteria into the final step.
- **Checkpoint**: Briefly summarize the plan to the user using `update_topic`. Do not wait for input; proceed immediately.

### Phase 3: Continuous Implementation (The Hand)
- **Action**: Use `subagent-driven-development` to execute the plan.
- **Positive Feedback Loop**: 
  - Subagents must write tests first (`tdd-enforcer` principle).
  - If a test fails or a build errors out, the subagent diagnoses (`bug-diagnose`), fixes, and re-tests. *This loop happens autonomously without user intervention.*
- **Monitoring**: Update `progress.md` after every sub-task.
- **Gate**: Before claiming success, the system MUST invoke `verification-before-completion`. It must run the agreed-upon tests/builds and read the output to prove the Completion Criteria are met.

### Phase 4: Evolution (The Memory)
- **Action**: Perform a post-execution reflection.
- **Learning**: Update `DEV_LOG.md` with RCA/CAPA from any autonomous fixes made during Phase 3.
- **Optimization**: If a general pattern emerged, propose an update to the project's `GEMINI.md` or create a new `SKILL.md`.

## Principles of Operation
1.  **Uninterruptible Momentum**: Once Phase 0 is cleared, do not stop to ask "Should I continue?" If you hit an error, read the logs and fix it.
2.  **Autonomous Recovery**: If a tool fails completely, use the "3-Strike Error Protocol" from `planning-with-files` before escalating to the user.
3.  **High-Signal Reporting**: Use `update_topic` to describe *actions taken* ("Writing tests for X", "Fixing compilation error in Y") rather than just status.

## Trigger Phrases
- 「啟動全自動開發模式」
- 「Manus Mode」
- 「從頭到尾幫我搞定...」
- 「執行全自動任務：[目標]」
