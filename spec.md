# Ensō — spec  (intent is the source of truth, not the code)

> Ensō is an **agentic kanban board**: you plan in plain tasks; a leashed agent builds them; a deterministic
> floor decides whether the work lands. This spec is Spec-Kit-shaped — stories, acceptance, requirements,
> success criteria, assumptions, non-goals. The acceptance scenarios below *become the tests* in `test/`.

## User stories

- **As the planner (a human)**, I can add a task to the board so the work is captured before anything is built.
- **As the planner**, I can drag a task into **Doing** to start a build of exactly that task — and nothing
  builds until I do, so I stay in command.
- **As the planner**, I can watch the agent's reasoning and tool calls stream live, so latency is legible and I
  can stop it.
- **As the planner**, I can trust that work only lands when a deterministic floor (gate + tests) is green, so a
  confident-but-wrong agent cannot ship slop.
- **As a reviewer (later, or in CI)**, I can read a diff-bound receipt to see whether a build satisfied the spec
  and the constitution.
- **As a learner**, I can `git checkout` any stage and rebuild forward, because each stage is one clean commit.

## Acceptance scenarios  (given / when / then — the testable heart)

1. **Add a task.** *Given* an empty Todo column, *when* I type "add dark mode" and press Enter, *then* a card
   `{text:"add dark mode", status:"todo"}` appears at the top of Todo and persists across reload.
2. **Drag starts a build.** *Given* a card in Todo, *when* I drag it to Doing, *then* exactly one build run starts
   for that card and no other.
3. **The floor blocks slop.** *Given* a build whose output contains an emoji or drops the `COLUMNS` contract,
   *when* the gate runs, *then* the commit is **blocked** and the card stays in Doing.
4. **The floor blocks broken behavior.** *Given* a change that breaks board persistence or an MCP tool, *when*
   `node --test` runs, *then* it fails and the commit is **blocked**.
5. **Board mutations go through tools.** *Given* a build that completes, *when* the card is moved to Done, *then*
   the move happens through `move_card` (the board tool), not a raw `board.json` write.
6. **Green floor lands the work.** *Given* a build whose diff passes gate + tests, *when* it finishes, *then* it
   commits, the card moves to Done, and the board reloads showing the new feature.
7. **Receipts are diff-bound.** *Given* a reviewer receipt for a build, *when* the diff changes after the receipt
   was written, *then* the receipt is detected as **stale** and does not count.

## Functional requirements

- **Board:** three columns — Todo / Doing / Done in a `COLUMNS` array. Add a card; drag between columns; order and
  status persist (survive reboot) via `board.json`.
- **Agentic build:** dragging a card to Doing spawns a bounded `claude -p` child that builds *that one task* by
  editing `index.html`, streaming reasoning + tool calls over SSE; on a green floor it commits and the card → Done.
- **Tools (MCP):** `list_cards / add_card / move_card / seed / clean` over stdio JSON-RPC; `board.json` is a JSON
  stand-in for a DB. All board mutations go through these tools.
- **Floor:** `node gate.mjs` (mechanical facts) + `node --test` (behavior), wired to `.githooks/pre-commit`.
- **Audit:** a reviewer receipt (`.receipts/<card>.review.json`) bound to the diff; an optional thin browser smoke.
- **Self-managing:** the board can hold its own dev tasks (from `tasks.md`) and work them.
- **Report:** a closing cycle report (an open ensō + what shipped).

## Success criteria

- A cold `git clone` + `course/build-history.sh` reproduces all ten stages; each runs as documented.
- `node gate.mjs && node --test` is green at every gated stage; breaking a rule blocks a commit.
- The theme-picker (`9-reference`) builds through the full loop and its smoke passes.
- A skeptical engineer cannot catch a false claim on stage (verified by an independent reviewer).

## Assumptions

- Node 18+ and a logged-in `claude` CLI are available. (Playwright + a browser only for the optional smoke.)
- The demo runs in a throwaway repo with **no secrets**; git is the undo.
- One build at a time; the human chooses what to build by dragging.

## Non-goals

- Not a production task tracker (no auth, multi-user, real DB, deploy).
- No domain modeling beyond `{ id, text, status }` — no DDD, no entities/aggregates.
- No multi-agent swarm — one implementer, one reviewer, one smoke. (Lanes generalize; we teach the pattern.)
- Not proof of *correctness* from the LLM layers — receipts are audit, smoke is rendering. The floor is the proof.

---

*This spec is what the gate and tests enforce, and what every task in `tasks.md` points back to.*
