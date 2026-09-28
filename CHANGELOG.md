# PRECEDENT Change Log

This document records each project change, the affected workflow, and the process used. The repository currently contains planning documents; the application has not been implemented yet.

## 2026-09-27 — Establish the PRECEDENT application name

### Change

- Replaced the former names DecisionTrace and RecallGuard with PRECEDENT throughout the project documents.
- Removed the provisional-name note from the problem statement and updated the README title.
- Added links from the README to the project documents and this change log.

### Planned feature workflow

The documented MVP lets a team record a technical decision with its goal, attempted approach, outcome, reasoning, alternatives, assumptions, and conditions for reconsideration. Hindsight retains that context. When an engineer proposes a similar approach, PRECEDENT recalls related decisions and shows the historical evidence. The engineer can provide changed circumstances, and PRECEDENT compares them with the original assumptions. The engineering team makes the final decision.

### Process

Read all project documents, searched for application-name references, updated the inconsistent names, and checked the documents again for the former names. This entry describes a documentation change; it does not claim that the planned workflow is implemented.

## 2026-09-28 — Revert the Person 1 memory and AI merge

### Change

- Reverted merge `ebb790c` from `main`, removing the Hindsight memory module, its demo fixtures and scripts, package files, tests, setup guide, and README link.
- The Person 1 feature branch remains available for later work.

### Feature behavior

`main` now contains no executable memory or AI service. Retain, recall, analysis, and reassessment remain planned behaviors in the project documents.

### Process

Applied `git revert -m 1` to the merge in an isolated worktree and checked the resulting file changes. This creates a new commit while retaining the merge in Git history.

## 2026-09-28 — Revert the frontend merge

### Change

- Reverted merge `b3ed205` from `main`, removing the initial React and Vite frontend and its assets and package files.
- The frontend feature branch remains available for later work.

### Feature behavior

`main` now has no runnable frontend. The planned proposal inbox, memory matches, decision records, timeline, and assumption check remain described in the project documents.

### Process

Applied `git revert -m 1` to the frontend merge after reverting the newer memory merge. Checked that the frontend files were removed and the planning documents remained.
