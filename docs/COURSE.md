# Ensō (円相) — the course blueprint

> **Ensō** is the open ink circle: incomplete closure, the human's hand still on it. The course/product is
> Ensō; the app it builds is *"an agentic kanban board."*
>
> The teaching arc is **vibe until it hurts, then earn the discipline.** We vibe a toy that works, then try to
> hand the keyboard to an agent — and the danger that creates is what *motivates* every piece of engineering
> rigor, one tiny concept at a time (Karpathy-style). The end state is fully spec-driven; we *discover* it
> instead of preaching it.
>
> This file is the backbone. Site, script, and git history derive from it. If a slide disagrees, this wins.

---

## The shape of the talk (a "making of": cold open, then rewind)

The best making-of videos open on the finished thing, *then* rewind to show how it was built — it earns
attention before it asks for patience. So:

> **PROLOGUE — the cold open (~45s, no explanation).** On a clean board, drag a card that says *"add a
> theme picker."* The agentic loop builds it live — reasoning streams, the floor runs, the card moves
> itself to Done, the whole UI flips to dark. The room leans in. Then: *"That board just wrote its own
> feature. Let me show you how to build the entire thing — from an empty file, in ten moves."*

Then the two acts run from scratch — and we **arrive back at the theme picker at stage 9**, except now the
room understands every layer that made that cold-open moment safe. The theme picker **bookends** the talk:
the hook *and* the earned payoff. (So it is NOT pre-baked into the reference — it's genuinely built live.)

```
ACT I — vibe (it works, because it's a toy)        ACT II — the turn: hand it to an agent → earn each discipline
  1  vibe a todo            (raw generation)          4  make it agentic  (MCP hands)   ← "wait, how do I trust this?"
  2  point it at a Skill    (taste, reusable)         5  the gate         (stop the slop) ← the leash, born from the danger
  3  vibe it into a kanban  (vibing goes far)         6  tests            (slop isn't the only failure)
                                                      7  spec + constitution  ← autonomy forced the FLOOR; the floor was an implicit spec — now make it explicit
                                                      8  release gate     (smoke + receipt — a second pair of eyes)
                                                      9  reference        (theme picker, the whole loop, live)
                                                     10  conductor        (recursion — take-home)
```

The emotional spine: *vibe-coding is fine until you want an agent to do it unattended; autonomy is what forces you
to build a **floor** — a gate and tests — which turns out to have been an implicit spec all along.* That arc earns
the rigor instead of front-loading it.

---

## Two words, kept separate (the core distinction)

The whole course hangs on one clean separation. Don't blur them:

- **The commit floor** — `node gate.mjs && node --test`. Deterministic. **Always blocks the commit.** Mechanical
  facts (gate) + behavior (tests). The only thing that decides whether code is *allowed into history*.
- **The release/audit gate** — a browser **smoke** + a reviewer **receipt**. **Blocks promotion** of a card to
  **Done** — *not* the basic commit. It audits the loop; it doesn't decide correctness.

> The commit floor decides what lands. The release gate decides what's *trusted enough to call done.* A red floor
> is fatal; a failing release gate holds the card for review.

Metaphor discipline — only two load-bearing metaphors: **Stage 1 is the baseline** (a throwaway toy); **Stage 5–6
are the floor.** Everything else is "the release gate," "the audit," "the smoke." (Don't say "floor of quality /
floor of control" — just *baseline* and *floor*.)

---

## The thesis (the sentence the talk must land)

> **The human owns the spine. The agent gets tools. The floor decides what lands. The release gate audits the loop.**

---

## Who it's for & what they leave with

**Audience:** strong engineers, new to agentic dev / the Claude CLI. They can code; they're skeptical "agentic" is
more than a demo toy. The arc is built to win exactly that person.

**Seven course objectives** (full set; the live talk collapses to **four** — see Pacing). By the end a learner can:
1. Vibe-build with a **Skill** so output inherits their taste — and know vibing's ceiling.
2. Give an agent **MCP** hands on a *system boundary*, with **context-grounding** and a **bounded** loop.
3. Build the **commit floor**: `gate.mjs` + a `node --test` suite, wired to a git hook (and why the hook is a
   floor, not a wall — CI is).
4. Write a Spec-Kit-shaped **spec** + **constitution** as the source of truth the floor enforces.
5. Add a **release gate** — a thin browser **smoke** then a reviewer **receipt** bound to the diff — and say why it
   audits rather than proves.
6. Explain **generator ≠ evaluator**, **spec-driven / human-in-command**, and when *not* to use an agent.
7. Translate the toy to production (CI required, protected branch, sandboxed agent, scoped tools, no autocommit).

---

## What is MCP, and how is it different from a Skill?

(Full version: `docs/concepts/mcp-vs-skills.md`. One paragraph here, because engineers ask immediately.)

A **Skill** is *knowledge* you hand the model — a file of taste, rules, examples — loaded into context so its
*output* is shaped by it. It changes what the agent **knows**. An **MCP server** is *capability* — a typed,
permissioned set of **tools** the agent can **call** to read or change a real system (a DB, Jira, CI, or here, the
board). It changes what the agent can **do**. **Skill = knowledge in; MCP = actions out.** Reach for a Skill when the
agent needs to *understand* something (our visual language, our rules); reach for an MCP when it needs to *act on a
system* through a stable, auditable interface. In Ensō: `enso-design` (a Skill) makes it look right; `board-mcp` (an
MCP) is how the agent changes the board — and *only* the board. **File edits are not MCP** — those use the coding
agent's own file tools. MCP is the **system boundary**; the Skill is the knowledge; the file tools are how it writes code.

---

## The mental model — the assembly line (what runs when a card enters Doing)

```
  HUMAN owns              AGENT implements          COMMIT FLOOR (blocks commit)   RELEASE GATE (blocks promotion)
  spec · constitution     one task, bounded,     →  gate.mjs && node --test     →  smoke (qa.mjs) → receipt (review.mjs)
  · tasks                 context-grounded                                          bound to the diff
       │                       │                            │                               │
       └── cards from tasks ───┘  file edits via the agent's file tools;       commit on green floor; promote to
                                  board changes via MCP (move_card)             Done only if the release gate passes
```

- **Human** owns the spine and never leaves command.
- **Implementer = a bounded `claude -p`.** It **edits files with its file tools** and **changes the board through
  MCP** (`board.move_card`) — two mechanisms, named honestly.
- **Commit floor = `gate.mjs` + `node --test`** — the only thing that blocks a commit.
- **Release gate = smoke then receipt** (that order, so the reviewer audits the whole evidence bundle — it records
  `testsPassed` *and* `smokePassed`). Blocks promotion to Done, not the commit.

ONE reviewer, ONE smoke. Real pipelines split into code-quality / QA / security lanes — same pattern, more lanes.
**No DDD** — a card is `{ id, text, status }`.

---

## The spine — ten stages (each = one concept, born from the last stage's pain)

| # | Tag | The concept (and why it appears now) | What it ADDS | Live? |
|---|-----|--------------------------------------|--------------|-------|
| 1 | `1-vibe` | Raw generation — the **baseline** toy | `index.html` (plain todo, localStorage) | **LIVE** |
| 2 | `2-skill` | A **Skill** = reusable taste; vibing with standards | `.claude/skills/enso-design` (restyle) | narrate |
| 3 | `3-kanban` | Vibing goes far — a real kanban, still no rigor | kanban + drag + persist (`COLUMNS`) | **LIVE** (it just works) |
| 4 | `4-agentic` | Hand it to an **agent** (MCP hands) → *"how do I trust this?"* | `board-mcp.mjs` `.mcp.json` `server.mjs` `report.mjs` | narrate + brief live |
| 5 | `5-gate` | The **gate** — stop the slop. Commit floor, part 1 | `gate.mjs` + `.githooks/pre-commit` | **LIVE** ★ |
| 6 | `6-tests` | **Tests** — slop isn't the only failure. Commit floor, part 2 | `test/*.mjs` (`node --test`); hook runs both | **LIVE** ★ |
| 7 | `7-spec` | **Spec + constitution** — write down what the floor enforces | `spec.md` `constitution.md` `plan.md` `tasks.md` | narrate (the punchline) |
| 8 | `8-release-gate` | The **release gate** — smoke → receipt, a second pair of eyes | `qa.mjs` + `review.mjs` | narrate |
| 9 | `9-reference` | It all composes — ships a **real feature** live; the **reference impl** | theme-picker end-to-end | **LIVE** ★ |
| 10 | `explore-conductor` | **Recursion** — the loop runs itself; you still hold the spine | `scripts/conduct.mjs` | take-home |

★ = beats that must land. The floor block (5–6) and theme-picker (9) are low-risk live; everything risky is pre-baked.

---

## Stage detail

### Stage 1 — `1-vibe` · the baseline
One prompt → a plain working todo (`index.html`, localStorage). The bar everyone knows — a throwaway toy. We climb
from here. **Prompt:** `build a minimal single-file todo: index.html, vanilla JS, localStorage.`

### Stage 2 — `2-skill` · taste, codified once
Point the same app at a **Skill** (`.claude/skills/enso-design/SKILL.md`) — warm paper, one vermilion accent, the
**calligraphic ensō** (an open brush stroke, never a perfect ring). Same todo, now it looks like *us*. You wrote the
taste once; every prompt inherits it. **Prompt:** `restyle index.html to follow .claude/skills/enso-design exactly.`
*(Still pure vibe — no spec, no gate yet. That's the point.)*

### Stage 3 — `3-kanban` · vibing goes far
Vibe the todo into a **kanban**: three columns in a `COLUMNS` array, native drag/drop, persist. It *works* — and it's
still just vibing, because it's a toy. Note the word `COLUMNS`; it becomes a contract the gate checks later.
**Prompt:** `convert the todo to a zen kanban: three columns Todo/Doing/Done in a COLUMNS array, native drag-drop, persist. follow the enso-design skill.`

### Stage 4 — `4-agentic` · hand it to an agent (the turn)
Now the dangerous, exciting part: let an **agent** change the app. The board gets **MCP** hands and a streaming loop —
drag a card to Doing and a bounded `claude -p` builds that task, editing `index.html` with its file tools and moving
the card through `board.move_card`. You watch its reasoning + tool calls stream live. **And immediately the question
lands: how do I trust this? It can write anything.** That felt danger is the engine for stages 5–8.
- **Adds:** `board-mcp.mjs` (stdio JSON-RPC: `list/add/move/seed/clean`; `board.json` = a JSON stand-in for a DB) ·
  `.mcp.json` · `server.mjs` (bounded build on drag-to-Doing; SSE; writes a context artifact first) · `report.mjs`.
  **Honest note:** stage 4 also swaps `index.html` to the reference UI in final form (the agent feed + board chrome).
  That's deliberate — the frontend becomes the *stable surface* every later stage builds discipline *around*; we
  don't re-vibe it after this. So `git diff 3-kanban 4-agentic` is a big frontend jump on purpose, and `index.html`
  is then byte-stable through `9-reference` (the later stages add backend, not UI).
- **MCP, precisely:** the agent acts on the **board** through MCP (the system boundary); it edits **files** with its
  own file tools. Two mechanisms — say both. **Security, plainly:** `--dangerously-skip-permissions` here only because
  it's a throwaway repo with no secrets and git is the undo (see Non-goals for the production translation).

### Stage 5 — `5-gate` · the leash · commit floor (part 1) ★
The answer to "how do I trust it": a **deterministic gate** the agent can't argue past — a machine, not the author,
says no. `gate.mjs` (7 checks): JS parses, no emoji, no raw `×` glyph, no pure `#fff/#000`, `--accent` defined, `COLUMNS` declares todo/doing/done, and `report.mjs` linted the same way (the two people forget — see BUILD.md).
`.githooks/pre-commit` runs it. **Hero beat (deterministic, safe live):** `node gate.mjs` → green; add an emoji →
`git commit` → **BLOCKED**. *That's* why you can hand an agent the keyboard. **Honest scope:** the gate catches
**slop, not wrong**; a client hook is advisory (`--no-verify` bypasses; a fresh clone needs `core.hooksPath`) — the
same check in **CI** is the wall.

### Stage 6 — `6-tests` · behavior · commit floor (part 2) ★
The gate proves it's *clean*, not that it *works*. Add **tests** — Node's built-in runner (`node --test`, no Jest):
gate blocks emoji · gate blocks missing `COLUMNS` · MCP add/list/move · persistence. The hook becomes
`node gate.mjs && node --test`. **Now the commit floor is complete: clean + correct-behavior, both deterministic,
both blocking.** **Live:** break persistence → `node --test` red → commit blocked.

### Stage 7 — `7-spec` · make the implicit explicit (the punchline)
We've been telling the agent what we want one prompt at a time. Stop — **write it down once.** `spec.md` (Spec-Kit
shape: stories, acceptance scenarios, success, non-goals — the acceptance scenarios are literally the tests from
stage 6), `constitution.md` (the engineering rules — floor decides, receipts not claims, bounded loops, least
privilege), and `plan.md` + `tasks.md` (the approach + the task list the board's cards derive from). **The honest
reveal — and the stronger one:** you built a working, gated, tested loop in stages 4–6 with *no spec*, so autonomy
didn't force a spec — it forced the **floor** (the gate, and especially the tests). Your floor was already an
implicit spec; stage 7 makes it explicit and hands authorship back to a human. The gate + tests are that spec *made
executable*; the cards are `tasks.md` made physical. This is the moment "spec-driven" stops being a slogan — *because
you earned it, not because you declared it first.*

### Stage 8 — `8-release-gate` · the audit (smoke → receipt; blocks promotion, not commit)
A second pair of eyes that isn't the author. After the commit floor is green and committed, the **release gate**
decides whether the card may be promoted to **Done**, in order:
1. **Smoke** (`qa.mjs`) — one thin Playwright check: page loads, columns render, the feature toggles; writes
   `.receipts/<card>.png` + `.receipts/<card>.qa.json`.
2. **Receipt** (`review.mjs`) — a *separate* `claude -p` reads the diff + `spec.md` + `constitution.md` *and the smoke
   result*, then writes `.receipts/<card>.review.json` (`{ card, diffHash, specSatisfied, constitutionPreserved,
   testsPassed, smokePassed, concerns, verdict, at }`).

The reviewer audits the **whole evidence bundle.** A failing/stale release gate **holds the card in Doing for review**
— it does **not** un-commit. *"LLM review is a signal; the smoke is rendering; the floor is the proof."* Receipts are
diff-bound, so a later change makes them **stale**.

### Stage 9 — `9-reference` · the ultimate test = the reference implementation ★
The whole spine on a feature nobody pre-wrote: **add a theme picker** (light/dark, zen-faithful). Human adds the card
→ Implementer → commit floor → commit → release gate (smoke → receipt) → promote to Done → the board reloads wearing
the feature. This polished, tested end-state **is the reference implementation** — the demo's guaranteed fallback, the
workshop's target, the embodiment of "done".

### Stage 10 — `explore-conductor` · the circle opens (take-home)
`scripts/conduct.mjs` reads the board/`tasks.md` and runs the loop with nobody typing the prompt — you still hold the
constitution, spec, and floor. Recursion; a take-home, not a live beat.

---

## Pacing

### The 15-minute live talk — **four** on-stage objectives
Collapse to: **(1) the human owns the spine · (2) gate + tests are the floor · (3) MCP gives hands · (4) smoke +
receipt audit the loop.** Run **live:** stage 1 (vibe), stage 3 (the kanban — "it just works"), stages 5–6 (the floor
block), stage 9 (theme-picker). **Narrate:** stage 2 (skill), stage 4 (MCP) briefly, stage 7 (the spec reveal),
stage 8 from the reference build's receipts. **Compress/cut:** reviewer mechanics, Playwright detail, the conductor.

| Min | Beat | On screen |
|-----|------|-----------|
| 0:00–0:45 | Open on the finished board, drag a card, it builds (live or clip) | the wow |
| 0:45–1:45 | The arc: "I'll vibe a toy, then hand it to an agent — and show you what that costs" | the two-act diagram |
| 1:45–4:00 | Stages 1–3 vibe → skill → kanban (LIVE) | one prompt → todo → styled → kanban |
| 4:00–5:30 | Stage 4 make it agentic (MCP) | drag-to-Doing stream; "how do I trust this?" |
| 5:30–8:30 | Stages 5–6 THE FLOOR (LIVE) ★ | emoji → commit → BLOCKED; `node --test` red on a broken change |
| 8:30–10:00 | Stage 7 the spec reveal | spec.md + constitution.md; "autonomy forced the floor; now make it explicit" |
| 10:00–10:45 | Stage 8 release gate | the smoke screenshot + the diff-bound receipt |
| 10:45–12:45 | Stage 9 REFERENCE (LIVE) ★ | theme-picker ships, then toggle it |
| 12:45–14:00 | Proof + take-home | numbers, the git-tag curriculum, prereqs |
| 14:00–15:00 | Close (recap the four) + Q&A | the open ensō |

### The 45-minute workshop
Same ten stages, hands-on. Students `git checkout` each tag, read the diff, rebuild forward, run the commit floor +
release gate against `9-reference` as the target. `PITFALLS.md` + the `broken-gate` exercise are the real teachers.

### Live-demo failure plan
Every stage is a tag. Pre-record the agent stream + theme-picker + conductor as hotkey clips. Run live only the
deterministic floor block and — if healthy — the vibe/kanban/theme-picker builds; else cut to the clip, no apology.
Narrate streams against the spec. Pre-flight `claude` + a phone hotspot. `9-reference` is always the fallback.

---

## Format

One **zen teaching site** (`site/`, single HTML): **Present mode** (fullscreen, script + commands, for the presenter) and
**Follow mode** (the ten stages, self-paced, copy-paste commands + "what you'll see" + the checkpoint). Plus the repo
(git checkpoints) as the lab, and the copy-paste prompts in `RECIPE.md`.

---

## Non-goals (say them out loud)

- **This is not a production CI/CD architecture.** It's a teaching artifact. The production translation: **CI
  required** (the same `gate.mjs` + `node --test` server-side), a **protected branch**, a **sandboxed agent** in a
  clean worktree, **scoped tools** (no `--dangerously-skip-permissions`), and **no autocommit to main** (open a PR).
- Not a real task tracker (no auth, multi-user, real DB, deploy). No DDD. No multi-agent swarm. The LLM layers are
  **audit, not proof of correctness** — the floor is the proof.

---

## Definition of done (prove in a clean clone BEFORE building courseware)

1. All ten tags exist and match the arc.
2. `node gate.mjs` passes at every gated stage (5+).
3. `node --test` exists and passes (behavior, not just parse) from stage 6+.
4. Breaking a rule (emoji / missing `COLUMNS` / broken persistence) **blocks the commit**.
5. A stale/missing receipt blocks **promotion to Done only**, never the commit.
6. Smoke is **optional and thin** (loads, renders, toggles, screenshots).
7. The MCP claim is **true in code** (`board.move_card` moves the card; file edits use file tools — named honestly).
8. All docs use **Ensō**, `enso-design`, `/build`, current routes/timeout, commit-floor vs release-gate language.
9. No video / five-move drift; no dead tags.
10. A skeptical engineer **cannot catch a false claim on stage** (a fresh sub-agent, generator≠evaluator, verifies).
