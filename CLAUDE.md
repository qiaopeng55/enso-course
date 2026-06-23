# Ensō — standing orders

Claude loads this file on every task. Keep it a lean index: a few rules + pointers to the detail.
(A bloated memory file is re-read on every prompt — pay for what earns its place.)

## Design
Follow `.claude/skills/enso-design/SKILL.md` — warm near-paper, one accent, subtraction over features.
The ensō (progress ring) is the signature: calligraphic, an open arc = % done. A flat even ring is a bug.

## Engineering
Karpathy-clean: single-concern, no dead code, the smallest real change that satisfies the task.
Plain web platform — no framework. The board state lives in `board.json`; never invent another store.

## Rules (load when they exist)
- `spec.md` — what we're building (acceptance scenarios → the critical ones become tests).
- `constitution.md` — the non-negotiable articles (spec-before-impl, floor-decides, generator≠evaluator).
- The floor (the deterministic leash on every commit): `node gate.mjs && node --test`.
- The board changes only through the typed tools in `board-mcp.mjs` (e.g. `move_card`) — never a raw write.

## When you build a feature
Edit `index.html` only. Do not touch the board, `server.mjs`, or `board-mcp.mjs`.
Honor the gate's contract or the work is reverted: no emoji, no pure #fff/#000 (use `--bg`/`--fg`),
keep the `--accent` token, keep a `COLUMNS` array declaring `todo`/`doing`/`done`.
