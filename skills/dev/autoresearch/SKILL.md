---
name: autoresearch
description: Use when the task involves conducting autonomous machine learning or code optimization experiments. This skill sets up a closed-loop "Ratchet" workflow (Propose -> Edit -> Run -> Evaluate -> Keep or Revert) to iteratively improve performance metrics under a fixed time budget.
---

# AutoResearch

This skill enables you to act as an autonomous researcher that optimizes machine learning models or general code logic through a strict closed-loop "Ratchet" experimentation process.

## When to Use This Skill

Use this skill when:
- The task is to optimize model architecture, hyperparameters, or training performance.
- You are working in a sandbox setup where experiments can be run and evaluated programmatically.
- You want to autonomously run consecutive experiments, measure results, and keep only successful improvements while discarding failures.

---

## ⚙️ The Setup Phase

Before starting the experimentation loop, perform the following setup steps:

1. **Agree on a Run Tag**: Propose an experimental tag based on today's date (e.g. `mar5`, `may31`). Verify that a git branch named `autoresearch/<tag>` does not already exist.
2. **Create the Experimental Branch**: Checkout a new clean branch from master/main:
   ```bash
   git checkout -b autoresearch/<tag>
   ```
3. **Analyze the Experiment Scope**: Identify and read the relevant project files:
   - Identify which files are read-only (e.g., data preparation, constants, evaluation harnesses like `prepare.py`). Do NOT modify these files.
   - Identify the primary training sandbox file to be modified (e.g., `train.py` or the core logic script).
4. **Verify Data & Dependencies**: Ensure datasets, pre-trained tokenizers, or dependencies are correctly installed and cached in the system.
5. **Initialize the Results Log**: Create a tab-separated values file named `results.tsv` (if it does not exist) with appropriate headers to track each experiment's validation metrics (e.g., `val_bpb`, `peak_vram_mb`, `mfu_percent`, `training_seconds`, `commit_hash`).
6. **Establish Baseline**: Run the training script as-is before making any modifications, and record its results in `results.tsv` as the baseline.

---

## 🔄 The Ratchet Experimentation Loop

Once the baseline is established, run the following loop recursively:

### Step 1: Propose a Hypothesis
Read the current code, the previous experiment results, and stdout/stderr logs. Formulate a clear hypothesis (e.g., "Increasing attention heads will improve loss", "Using AdamW instead of SGD will accelerate convergence").

### Step 2: Surgical Modification
Edit **only** the training sandbox file (e.g., `train.py`). Keep your modifications surgical and clean:
- Avoid adding hacky code for tiny gains.
- All else being equal, **simpler is better**. If deleting code yields equal or better results, keep the deletion (a simplification win).

### Step 3: Run the Experiment
Execute the training script under a fixed wall-clock time budget (e.g. 5 minutes) to ensure comparable results:
```bash
uv run train.py
```

### Step 4: Extract and Evaluate Metrics
Once the run completes, inspect the output summary. Extract key metrics:
- **Primary Metric**: E.g., validation bits per byte (`val_bpb`) or validation loss.
- **Hardware Constraints**: E.g., `peak_vram_mb`. VRAM should not blow up dramatically.
- **Training Efficiency**: E.g., model FLOPs utilization (`mfu_percent`).
- **Time Elapsed**: E.g., `training_seconds`.

### Step 5: Keep or Revert (The Ratchet Decision)
- **If the metric IMPROVES**:
  1. Record the success in `results.tsv`.
  2. Git Commit the change:
     ```bash
     git add train.py results.tsv
     git commit -m "autoresearch: val_bpb improved to <val_bpb> (hypothesis: <brief description>)"
     ```
- **If the metric DEGRADES or crashes**:
  1. Discard the changes immediately to return to the last known stable state:
     ```bash
     git checkout -- train.py
     ```
  2. Document the failure in your session notes/log to prevent repeating the same mistake.

---

## ⚠️ Prohibited Actions

- **Never** modify read-only evaluation files (e.g., `prepare.py` or the test harness).
- **Never** modify the baseline validation calculation logic.
- **Never** proceed to the next experiment if the current one crashed. You must reset the sandbox before proposing a new hypothesis.
- **Do not** add speculative dependencies or external packages not registered in the project configuration.
