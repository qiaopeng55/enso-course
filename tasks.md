# Ensō — tasks  (the executable list; the board's cards derive from here)

> Each task is small, ordered, and **acceptance-checkable** — it names the spec scenario it satisfies and how
> you'd know it's done. The board's Todo column is this file made physical: *you* author this list, then enqueue
> a task (`add_card`, or `conduct.mjs --add "…"`) and drag it to Doing to build it. ("Planner = the human" is
> honest because you wrote it.) `seed` drops a few sample cards if you just want something to drag.
>
> Format: `[ ]` todo · `[~]` doing · `[x]` done · each line: **task** — *satisfies* S# — **done when** …

## Build tasks (how Ensō builds itself, in order)

- [x] **Baseline todo** — *satisfies* (pre-spec) — done when `index.html` opens and adds/removes a todo. `1-vibe`
- [x] **Apply the Skill** — *satisfies* aesthetic req — done when the surface matches `.claude/skills/enso-design`. `2-skill`
- [x] **Kanban surface** — *satisfies* S1 — done when three columns in a `COLUMNS` array, drag persists. `3-kanban`
- [x] **The implementer (agentic build)** — *satisfies* S2,S5,S6 — done when dragging to Doing builds one card, streams it, and the card reaches Done through `move_card` (never a raw write). `4-agentic`
- [x] **The gate** — *satisfies* S3 — done when `node gate.mjs` blocks slop and the pre-commit hook runs it. `5-gate`
- [x] **The tests** — *satisfies* S4 — done when `node --test` proves behavior and is part of the floor. `6-tests`
- [x] **Spec + constitution** — *satisfies* Art.1 — done when `spec.md` + `constitution.md` exist and the floor enforces them. `7-spec`
- [x] **Release gate (reviewer receipt)** — *satisfies* S7 — done when a build writes a diff-bound `.receipts/<card>.review.json` that gates promotion. `8-release-gate`
- [x] **Reference feature + smoke** — *satisfies* S6 + success criteria — done when the theme-picker ships through the loop and `qa.mjs` passes. `9-reference`
- [x] **The conductor (take-home)** — *satisfies* the loop — done when `conduct.mjs` runs board → floor → commit → `move_card`, no hand on the keyboard. `explore-conductor`

## Open tasks (what a learner / the conductor builds next — the live demo picks one of these)

- [ ] **Add a theme picker** — *satisfies* S6 — done when a light/dark toggle flips `data-theme`, persists, stays zen-faithful, and the floor + smoke pass. *(the `9-reference` demo task)*
- [ ] **Add a "clear Done" affordance** — *satisfies* board req — done when finished cards can be cleared via a restrained drawn mark (no raw glyph), persisted, floor green.
- [ ] **Show card age** — *satisfies* board req — done when each card shows a quiet relative age in `--muted`, no layout shift, floor green.
- [ ] **Cache the ensō dasharray** — *satisfies* Art.10 — done when the ensō geometry is computed once (no per-render recompute), behavior unchanged, tests green.

## How a task becomes a card

`board-mcp.mjs` exposes `add_card` (enqueue a task above), `seed` (a few sample cards), and `move_card`. The board reads
`board.json`. Drag a card to Doing → the implementer builds exactly that task, against `spec.md` + `constitution.md`.
A task is only "done" when its **done-when** check passes *and* the floor is green — not when the agent says so.
