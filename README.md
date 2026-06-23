# Ensō — an agentic kanban board (a teaching artifact)

> Build an agent you can **trust**, in ten moves. We vibe a toy that works, then hand the keyboard to an
> agent — and earn, one tiny concept at a time, every safeguard that makes that safe.
>
> *The human owns the spine. The agent gets tools. The floor decides what lands. The release gate audits the loop.*

## Two ways through — pick one lane and stay in it

- **Lane A · Explore the reference** (fastest). Generate the ten stage tags, then read + run each:
  `bash course/build-history.sh .built && cd .built && git checkout 1-vibe`. Move forward with `git checkout <stage>`
  and `git diff <stage>`. The **site** (`site/index.html`) is this guided tour. *(At stage 4 the reference adds the
  whole agentic backend at once — that's intentional; you're reading the answer, not deriving it.)*
- **Lane B · Build it yourself from scratch** (deepest). An empty folder, one `claude` session, **no tags**. Follow
  **`BUILD.md`** — it breaks the hard stage (the agentic loop) into four small, verifiable steps. (`WALKTHROUGH.md`
  is a terser, prompt-per-stage middle path.)

Don't mix them: a from-scratch build goes in its **own empty folder**, never inside `.built`.

## Run it

    node server.mjs        # → http://localhost:4173

Type a task in the Todo column, press Enter (a plain client-side add — no agent). **Drag a card into Doing**
and a bounded `claude -p` builds that one task: its reasoning streams, the **commit floor** (`gate.mjs` +
`node --test`) decides whether it lands, the **release gate** (smoke → receipt) decides whether it's promoted,
and on success the card moves itself to Done through `board.move_card` and the board reloads. `/report` shows
the cycle report — a closing ensō.

**Run it safely (without `--dangerously-skip-permissions`):** by default the loop skips the permission prompt
— no human is in the loop, so the *floor* (not a person) is what catches bad work. To run it against a repo
you care about, start it as `ENSO_ALLOWLIST=1 node server.mjs`: the agent is then pre-approved for only the
file-edit tools (Edit/Write/Read), never arbitrary shell. Same loop, scoped trust.

## Learn it — the git log is the tutorial

Every move is a tag. Check one out, read its diff, rebuild forward:

    bash course/build-history.sh        # builds the ten-stage history into ./.built
    cd .built
    git checkout 6-tests && node gate.mjs && node --test     # the floor, green
    git diff 5-gate 6-tests                                    # what 'tests' added — the lesson

The arc (vibe → engineered): `1-vibe` → `2-skill` → `3-kanban` → `4-agentic` → `5-gate` → `6-tests` →
`7-spec` → `8-release-gate` → `9-reference` → `explore-conductor`.

## The course

- **`BUILD.md`** — **start here if you want to build it yourself.** The honest, from-scratch path: the whole
  dependency tree first, then exact prompts + the mechanics of writing the hook / MCP / gate by hand + a
  verify-it-works step at every stage. No blind `git checkout` — you construct every file and understand why.
- **`site/index.html`** — the zen teaching site. *Present* mode (for the speaker) and *Follow* mode
  (self-paced, copy-paste commands per stage). Open it in a browser.
- **`docs/COURSE.md`** — the blueprint: every stage's concept, why, demo, pacing, the production translation.
- **`docs/concepts/mcp-vs-skills.md`** — MCP vs Skills, knowledge-in vs actions-out.
- **`WALKTHROUGH.md`** — the hands-on workshop guide (this repo, stage by stage).
- **`RECIPE.md`** — just the prompts, in order. **`PITFALLS.md`** — where cold rebuilds get stuck.
  **`EXERCISE.md`** — the `broken-gate` debugging exercise.
- **`BEYOND.md`** — the real Claude Code features the video deferred to keep the spine clean: `/init`,
  permissions / plan-mode / budget caps, `/mcp`, context management, session resume, install troubleshooting.

## What's here

`index.html` (the board) · `server.mjs` (the build loop) · `board-mcp.mjs` + `.mcp.json` (the board's tools) ·
`gate.mjs` + `test/` + `.githooks/` (the commit floor) · `qa.mjs` + `review.mjs` (the release gate) ·
`spec.md` `constitution.md` `plan.md` `tasks.md` (the spine) · `.claude/skills/enso-design/` (the taste) ·
`report.mjs` · `scripts/conduct.mjs` (the conductor).

## Not a production CI/CD architecture

This is a teaching artifact. In production: **CI required** (the same `gate.mjs` + `node --test` server-side),
a **protected branch**, a **sandboxed agent** in a clean worktree, **scoped tools** (no
`--dangerously-skip-permissions`), and **no autocommit to main**. The pattern is the same; the boundaries are harder.

Requires Node 18+ and the `claude` CLI (logged in). Playwright is optional, only for the smoke.
