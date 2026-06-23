# Build Ensō from scratch — the honest, reproducible path

This is the guide for the engineer who refuses to `git checkout` the answer and wants to **build every file
themselves**, understanding why each one exists. The git tags are your safety net (`git diff <tag>` if you get
stuck) — but you should be able to reach each tag on your own from the instructions here.

It is also honest about method. People ask: *"Is this spec-driven, or did you vibe it?"* The truthful answer is
**both, in that order** — and that ordering is the whole lesson. You vibe a toy until the moment autonomy makes
vibing dangerous; *then* you formalize. Each stage below is labelled **VIBE** or **SPEC-DRIVEN** so you always
know which mode you're in and why.

---

## First, the tree (a good teacher holds the whole thing before pointing at a branch)

You are building one small system with four layers. Keep this map in your head; every stage adds exactly one box.

```
Ensō — "an agent you can trust"
│
├─ Act I · the SURFACE            (mode: VIBE — no rigor is needed yet, it's a toy)
│   1  index.html  ............... a todo                         (depends on: nothing)
│   2  .claude/skills/enso-design/SKILL.md  ... taste, written once   → restyles #1
│   3  index.html  ............... a kanban, the COLUMNS contract    → extends #1, the gate will check this
│
├─ Act II · make it ACT           (mode: VIBE-UNDER-STRAIN — this is where vibing starts to hurt)
│   4  board-mcp.mjs  ............ the agent's TOOLS (MCP boundary)
│      .mcp.json  ................ how `claude -p` discovers those tools
│      server.mjs  ............... the LOOP: spawn claude, stream it, orchestrate
│      report.mjs  ............... a cycle report
│
├─ Act III · make it SAFE         (mode: DIRECTED, then SPEC-DRIVEN — you earn each layer)
│   5  gate.mjs + .githooks/pre-commit  ... the deterministic floor + the HOOK that runs it
│   6  test/*.mjs  ............... behavior floor (node --test)      → needs board-mcp.mjs exportable
│   7  spec.md constitution.md plan.md tasks.md  ... formalize it    → tests derive from acceptance scenarios
│   8  qa.mjs + review.mjs  ...... the release gate (smoke + receipt)
│
└─ Act IV · let GO
    9  the theme picker, built live by the loop      (the reference)
   10  scripts/conduct.mjs  ...... the loop runs itself
```

Two dependency facts worth pinning now, because they bite people:
- **#6 (tests) forces a refactor of #4.** To test the board tools, `board-mcp.mjs` must *export* its logic and
  guard its stdio transport so importing it doesn't hang. Build #4 with that in mind (details in stage 6).
- **#3's `COLUMNS` array is a contract.** #5's gate asserts it. Name it exactly `COLUMNS`, declaring
  `todo`/`doing`/`done`, or the gate (rightly) blocks you later.
- **#5's gate also lints `report.mjs`** (a rendered surface), which is created in #4c-iv. If you forget, the gate
  silently skips that check (it's wrapped in a `try`), so you won't notice you diverged from the reference until
  you diff against it. The reference gate has **7** checks, not 5 — see stage 5.

Tooling you need before stage 4: **Node 18+** and the **`claude` CLI, logged in** (`claude`, then `/login`).
Optional, only for stage 8's smoke: **Playwright**.

---

## How to read each stage

**The three modes:** **VIBE** = you prompt freely, no target but "make it nice." **DIRECTED** = you still type the
prompts, but now you're aiming at a fixed target a machine enforces (the gate, the tests) — between free vibing and
human-authored spec. **SPEC-DRIVEN** = a written spec/constitution is the source of truth the work is measured against.

> Already ran the site's `.built` setup? Build this **in a separate, empty folder** — the from-scratch journey and
> the explore-the-tags journey are two different things; don't nest them (and don't arm hooks in the wrong one).

Every stage gives you: **Mode** (vibe / directed / spec-driven) · **Goal** · **The exact prompt** (what you type into the
one open `claude` session) · **What it makes & why** (the reasoning and key decisions) · **Verify it works** (a
command and the output you must see) · **If it fights you** (the real pitfall). Do the verify step every time —
that habit *is* the course.

> Convention: `›` = type into the `claude` session · `$` = a shell command · expected output shown after `→`.

Start clean and open one session you keep for the whole build:
```bash
mkdir enso && cd enso && git init
claude            # keep this open; stages 1–9 are turns in this one conversation
```

---

## Act I — the surface (VIBE)

### Stage 1 — a todo · **VIBE**
**Goal:** `index.html` — a plain working todo, so we have something to improve.
**Prompt:**
```
› build a minimal single-file todo: index.html, vanilla JS, localStorage. works by opening the file.
```
**What it makes & why:** one file, no framework, state in `localStorage`. We deliberately accept ugliness — the
point is to feel how far a single prompt gets you (far, for a toy).
**Verify:** `$ open index.html` → you can add and remove items; reload keeps them.
**If it fights you:** nothing yet. This is the baseline.

### Stage 2 — taste as a Skill · **VIBE** (but now knowledge is written down)
**Goal:** the same todo, restyled by a reusable **Skill**.
First, understand the mechanism: a **Skill** is a markdown file the CLI loads into the model's context. It is not
code and not an API — it changes what the agent *knows*, so its output is shaped by it. The frontmatter says what
it is and when to use it; the body is your taste.
**Prompt — write the skill, then apply it (two turns):**
```
› create .claude/skills/enso-design/SKILL.md. frontmatter: name: enso-design; description: when to apply our
  visual language. body: tokens (--bg #fbfbfa, --fg #1a1a1a, --muted, --line, --accent #e8553e — one accent,
  never pure #fff/#000), system font, calm motion ≤200ms no spring, the ensō as the only progress indicator,
  and a "forbidden" list (emoji, second accent, drop-shadows). keep it tight.
› now restyle index.html to follow .claude/skills/enso-design/SKILL.md exactly. don't change the logic.
```
**What it makes & why:** you wrote the taste **once**. Every future prompt that references the skill inherits it —
you stop re-explaining yourself. (This is "knowledge in.")
**Verify:** `$ open index.html` → warm paper, one vermilion accent, calm. Same todo, now it looks like *you*.
**If it fights you:** if it invents new colors, your skill's "forbidden" list is too soft — tighten it. The skill
is a contract too.

### Stage 3 — a kanban · **VIBE**
**Goal:** the todo becomes a three-column board.
**Prompt:**
```
› convert the todo to a zen kanban per the enso-design skill: three columns Todo/Doing/Done held in a COLUMNS
  array (each {id,title}); native HTML5 drag-and-drop between columns; persist a move to localStorage.
```
**What it makes & why:** note the one instruction that matters later — **"a `COLUMNS` array."** That array is a
*contract*. In stage 5 a dumb script will assert it declares `todo`/`doing`/`done`. Vibing is fine here, but plant
the contract now.
**Verify:** `$ open index.html` → drag a card between columns; reload; it stays.
**If it fights you:** if it inlines the columns in markup instead of a `COLUMNS` array, ask again — the gate needs
the array, and "a value other code depends on lives in one named place" is the actual engineering point.

> **Pause and notice:** three stages, pure vibe, and it works. No spec, no tests, nothing has bitten us. That's
> real — and it's exactly why people believe vibing scales. Now we hand the keyboard to an agent, and it stops
> being true.

---

## Act II — make it act (VIBE-UNDER-STRAIN)

This is the hardest stage and the turning point. You are adding three things at once — a tool server, a process
that spawns the agent, and a streaming UI — and you will *feel* vibing strain here. That strain is the argument
for everything in Act III. Build it in pieces and verify each.

### Stage 4 — the agentic loop · **VIBE-UNDER-STRAIN**
**Concept — two different mechanisms, named honestly.** When the loop runs, the agent does two unrelated things:
it **edits files** with its own built-in file tools, and it **changes the board** through **MCP**. MCP (Model
Context Protocol) is a tiny standard for exposing *tools* — typed functions an agent can call — over a transport.
We expose the board as five tools so the agent can touch the board *and nothing else*. That's the boundary you
control.

**4-0 — adopt the stable shell (a deliberate, named jump).** Before the backend, swap `index.html` to its
reference form once — the kanban *plus* the agent-feed chrome (the streaming panel, the quick-add). You will **not
re-vibe the frontend after this**; from here the UI is a fixed surface and every later stage adds *backend* and
*discipline* around it. So when `git diff 3-kanban 4-agentic` shows a big frontend change, that's on purpose, not a
mistake — file it away and move on. (If you're building purely from prompts, just ask Claude to "add the agent feed
+ quick-add to index.html, keep the kanban," then leave it alone.)

**4a — the tools (the MCP server).** 
```
› add board-mcp.mjs: a stdio JSON-RPC 2.0 server (newline-delimited, no deps). board.json holds the cards.
  tools: list_cards, add_card({text,status?}), move_card({id,status}), seed, clean. ids are monotonic (max+1).
  IMPORTANT: export a pure `call(name,args)` function and the TOOLS array, and only run the stdin transport when
  the file is executed directly (guard with import.meta.url === pathToFileURL(process.argv[1]).href) — so stage 6
  can import and test the logic without the process hanging. allow the board path to come from process.env.ENSO_BOARD.
```
*Why those exact asks:* the export + transport-guard + env-path are not gold-plating — they are what makes the
tools **testable** in stage 6. Building stage 4 with stage 6 in mind is the "hold the tree" move.
**Verify the tools by hand (this is how you learn the protocol):**
```bash
$ printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add_card","arguments":{"text":"hi"}}}' \
  | node board-mcp.mjs
# → one line listing the 5 tools, then one line confirming the add. board.json now has the card.
```

**4b — the wiring.**
```
› add .mcp.json: { "mcpServers": { "board": { "command": "node", "args": ["board-mcp.mjs"] } } }
```
*Why:* this is the file `claude -p` reads to discover the board tools at runtime.

**4c — the loop, in four small steps.** Do **not** do this in one prompt — the "spawn an agent and stream it" jump
is where from-scratch builds fail, because the `stream-json` event shape is undocumented tribal knowledge a prompt
won't reliably reproduce. Build and verify each piece.

*4c-i — just serve the board.*
```
› add server.mjs on port 4173: serve index.html at /, and GET/POST /board reading/writing board.json. nothing else.
```
Verify: `$ node server.mjs` then in another shell `$ curl localhost:4173/board` → your cards as JSON.

*4c-ii — spawn the agent and SEE its raw output (learn the stream before you parse it).*
```
› add POST /build {id,text} to server.mjs: spawn `claude -p "<task>" --output-format stream-json --verbose
  --mcp-config .mcp.json --dangerously-skip-permissions` and for now just console.log every stdout line.
```
**Heads up — this curl spawns a real `claude -p` that edits your files and costs tokens** (each `-p` is a cold, stateless
run — its own context, its own spend). Only acceptable because this is a throwaway repo with no secrets (full
security note in 4c-iv). Verify by hand: `$ curl -XPOST localhost:4173/build -d '{"text":"add a footer"}'`. Watch the server log — **each
line is one JSON event.** Among them you'll see `{"type":"assistant","message":{"content":[…]}}`. *Look at this
shape before trusting any prompt to handle it.* This is the single most important thing to understand in the whole build.

*4c-iii — parse that shape and stream it to the browser (SSE).* These ~8 lines are load-bearing — type them
yourself so you own them, don't prompt-and-pray:
```js
createInterface({ input: child.stdout }).on('line', (line) => {
  let ev; try { ev = JSON.parse(line) } catch { return }
  if (ev.type !== 'assistant') return                  // only assistant turns carry content
  for (const b of ev.message?.content ?? []) {         // walk the content blocks
    if (b.type === 'thinking') sse('reason', b.thinking)          // its reasoning
    if (b.type === 'text')     sse('text',   b.text)              // its narration
    if (b.type === 'tool_use') sse('tool',   b.name + (b.input?.file_path ? ' · ' + b.input.file_path : ''))
  }
})
// guard EVERY write so a closed browser tab can't crash the server; kill the child if the browser leaves:
const sse = (kind, text) => { if (!open) return; try { res.write(`data: ${JSON.stringify({kind,text})}\n\n`) } catch { open = false } }
res.on('close', () => { open = false; child.kill() })   // …plus a ~10-min timeout that kills a runaway build
```
Verify: re-POST /build → the feed shows reasoning, then `tool · index.html`. **Failure signature:** if you see
only "thinking…" and never a `tool` line within ~30s, your parsing is wrong — go back to 4c-ii and re-read the raw
lines until you can point to the `type:"assistant"` envelope.

*4c-iv — the frontend trigger + the report.*
```
› in index.html: a quick-add input in the Todo column (type → Enter → a card, client-side, NO agent), and on
  drag-into-Doing, POST /build and render the streamed feed calmly. add report.mjs (a tiny HTML cycle report) + GET /report.
```
*Why this shape:* **adding a card is not the agent's job** — that's plain client-side. The agent runs **only** on
drag-to-Doing, one task, one direction. That single decision removes a whole class of "the agent did something I
didn't ask for" problems. (And remember stage 5's gate will lint `report.mjs` too — it's a rendered surface.)
*Two honest edges a senior will probe:* this assumes **one in-flight build at a time** — two simultaneous
drag-to-Doings would race on `index.html` (in production you'd lock the card or queue); and the stage-8 commit is
**best-effort** — if it fails, the release gate's `git diff HEAD~1 HEAD` won't reflect the work. Name both; don't
pretend they're solved.
*The security flag, stated plainly:* `--dangerously-skip-permissions` lets the child edit files without
prompting. It is acceptable **here** because this is a throwaway repo with no secrets and git is the undo. You
would never run it like this on a real codebase — there you'd scope `--allowedTools`, sandbox the worktree, and
keep credentials out of reach. Say this out loud; a skeptic will (correctly) ask.
**Verify:** `$ node server.mjs` → open `:4173`, type a task, drag it to Doing → you see the agent's reasoning and
`Edit · index.html` stream live. (It may produce slop — that's the point of Act III.)
**If it fights you:** `--mcp-config` is the *child's* flag, set inside `server.mjs`; it is **not** something you
pass to your interactive build session. And `.mcp.json` must exist before the child runs.

> **The strain you just felt is the curriculum.** Three files, a wire protocol, an unsupervised process that
> edits your code and commits — built by prompting, and you have *no idea if its output is any good*. Acts III is
> us refusing to live like that.

---

## Act III — make it safe (DIRECTED, then SPEC-DRIVEN)

### Stage 5 — the gate + the hook · **DIRECTED**
**Concept — a git hook.** Git runs scripts at lifecycle moments; a **pre-commit** hook runs *before* a commit is
finalized, and **if it exits non-zero, git aborts the commit.** That is the entire mechanism that lets a dumb
script stand between an agent and your history. Hooks live in `.git/hooks` by default, but those aren't version
controlled — so we keep ours in `.githooks/` and point git at it.

**The gate first (the check):**
```
› add gate.mjs — a deterministic Node check on index.html. extract the inline <script> and syntax-check it with
  new Function(js). assert: NO emoji; NO pure #fff/#000/#ffffff/#000000 (use the tokens); NO raw × glyph; the
  --accent token is defined; and the COLUMNS array really declares todo, doing, done (match the quoted strings,
  don't substring-scan). ALSO read report.mjs and apply the same emoji + pure-color checks to it (it's a rendered
  surface too). print the violations and process.exit(1) on any.
```
*That's 7 checks, not 5* — the `×` glyph and the `report.mjs` lint are the two people forget, and the gate's own
`try` around the report read hides the omission. A weaker gate still passes your stage-6 fixtures, so the gap is
silent. This is itself a lesson: **a gate is only as good as the cases its author thought of** (stage's `EXERCISE.md`).
**The hook (the mechanism), written by hand so you see every part:**
```bash
$ mkdir -p .githooks
$ cat > .githooks/pre-commit <<'EOF'
#!/bin/sh
node gate.mjs || exit 1        # nonzero from the gate → git aborts the commit
EOF
$ chmod +x .githooks/pre-commit          # it must be executable
$ git config core.hooksPath .githooks    # point git at our versioned hooks dir
```
*Why each line:* the shebang makes it a runnable script; `node gate.mjs || exit 1` runs the check and propagates
failure; `chmod +x` is mandatory (git silently ignores a non-executable hook); `core.hooksPath` is what makes a
*fresh clone* use it.
**Verify — the hero beat:**
```bash
$ node gate.mjs                       # → ✓ gate passed
# put an emoji in index.html, then:
$ git add -A && git commit -m "x"     # → ✗ GATE BLOCKED — emoji found.  (the commit did NOT happen)
```
**Honest scope (don't oversell it):** the gate catches **slop, not "wrong."** And a client hook is *advisory* —
anyone can `git commit --no-verify`, and a fresh clone is unprotected until `core.hooksPath` is set. **Real
enforcement is the same `gate.mjs` running in CI**, where it cannot be skipped. Local hook = the fast floor; CI =
the wall.
**If it fights you:** "column todo not declared in COLUMNS" means you inlined the columns or renamed the array.
Fix the app, not the gate.

### Stage 6 — tests · **DIRECTED**
**Concept:** the gate proves the file is *clean*; it does not prove the app *works*. Tests prove behavior. We use
Node's built-in runner — `node --test`, zero dependencies.
**Prompt:**
```
› add a test/ suite using node --test (no Jest/Vitest). board.test.mjs: set ENSO_BOARD to a temp file, import
  board-mcp.mjs's call(), and assert add_card persists, ids are monotonic, move_card changes status, seed/clean
  work. gate.test.mjs: run gate.mjs in a temp dir against crafted index.html fixtures and assert it blocks emoji,
  a dropped COLUMNS entry, pure #000, and a JS syntax error, and passes a clean file. then wire the hook to run
  `node gate.mjs && node --test`.
```
The hook now becomes (overwrite `.githooks/pre-commit` — the floor is both layers):
```sh
#!/bin/sh
node gate.mjs || exit 1        # mechanical floor
node --test    || exit 1        # behavior floor — either red aborts the commit
```
*Why it depends on stage 4's shape:* this is why `board-mcp.mjs` had to export `call()` and guard its transport.
If you skipped that, you refactor it now — and you've learned why "build with the test in mind" matters.
**Verify:**
```bash
$ node --test            # → # pass ≥ 10   # fail 0   (your count will differ from ours — that's fine)
# now break persistence FOR REAL and watch it go red (this edit is self-restoring):
$ cp board-mcp.mjs /tmp/bm.bak && sed -i '' 's/const write = (cards) =>/const write = (cards) => true || /' board-mcp.mjs
$ node --test            # → # fail > 0   (add/move/persist all break) — the commit would be blocked
$ cp /tmp/bm.bak board-mcp.mjs    # restore; node --test green again
```
*(On Linux use `sed -i` without the `''`.)*
**If it fights you:** if importing `board-mcp.mjs` in the test *hangs*, the stdio transport isn't guarded — add
the `import.meta.url === pathToFileURL(process.argv[1]).href` guard so `serve()` only runs when executed directly.

### Stage 7 — the spec · **MAKE THE IMPLICIT EXPLICIT**
**The honest answer to "is it spec-driven?"** Look at what you just did: you built a working, gated, tested,
autonomous loop in stages 4–6 **with no `spec.md` in existence.** So be precise — autonomy did *not* force you to
write a spec first. What autonomy forced was the **floor**: the gate, and especially the **tests** (stage 6
genuinely forced the stage-4 refactor — that dependency is real and unavoidable). Stage 7 is the moment you
realize your **gate + tests were already an implicit spec**, and you make it explicit and *human-owned*: you write
down the intent the floor was encoding, so a person — not a test file — is the source of truth. Before here the
project was *test-driven with guardrails*; from here it's *spec-driven*. That honest progression beats the myth
that you must author a constitution before line one — and a sharp learner who `git log`s their own build will see
the spec arrived last, exactly as described.
**Prompt — co-author it from the behavior you already have:**
```
› from how this board already behaves, write spec.md Spec-Kit style: user stories, given/when/then acceptance
  scenarios (these mirror the stage-6 tests), functional requirements, success criteria, assumptions, non-goals.
› write constitution.md: the engineering rules — spec before implementation; tests before autonomy; the floor
  (gate+tests) is the only thing that may block a commit; no hidden agent side effects; bounded loops; least
  privilege; receipts not claims. write plan.md (the technical approach) and tasks.md (the board's seed cards).
```
**What it makes & why:** you're not inventing requirements — you're *surfacing* the ones your tests already
encode, and handing authorship back to a human. The skeptic's correct objection ("you wrote the spec *after* it
worked") is the point: the spec's job from now on is to be what the next change is measured against, and the place
a human overrides the tests when intent changes. The constitution does the same for *how* you build; the reviewer
(stage 8) audits against it.
**Verify (the real check is not "still green"):** read `spec.md`'s acceptance scenarios next to
`test/board.test.mjs` — they must say the same thing in two languages; if they disagree, that's a finding,
reconcile it. (Also: `$ node gate.mjs && node --test` stays green — you wrote docs, not code.)
**If it fights you:** if the spec and tests disagree, that's a *finding*, not a nuisance — reconcile them; that's
the spec doing its job.

### Stage 8 — the release gate · **SPEC-DRIVEN**
**Concept:** the floor (gate+tests) decides what **lands** (the commit). A separate, softer layer decides what is
**promoted to Done** — a browser **smoke** (does it actually render and work?) and a reviewer **receipt**
(generator ≠ evaluator: a *different* agent grades the diff against the spec). The receipt is **bound to the diff
hash**, so a later change makes it stale and it stops counting. Crucially, this layer **never un-commits** — it
holds the card for review.
**Prompt:**
```
› add qa.mjs: a thin Playwright smoke — load the page, assert the columns render and the feature toggles, write a
  screenshot and .receipts/<id>.qa.json. graceful: if Playwright isn't installed, record "skipped" and exit 0.
› add review.mjs: spawn a SEPARATE `claude -p` that reads the diff + spec.md + constitution.md + the smoke result
  and writes .receipts/<id>.review.json {diffHash, specSatisfied, constitutionPreserved, verdict}. exit 1 on
  "changes requested". CRUCIAL — compute the binding exactly: diff = `git diff HEAD~1 HEAD -- index.html`
  (fallback `git diff HEAD`), diffHash = sha256(diff).slice(0,12). That hash is what makes a later edit STALE the
  receipt; without it, "receipts are diff-bound" is just words.
› in server.mjs, after the commit floor passes and commits, run qa then review; only promote the card to Done —
  via board.move_card — if both pass. otherwise hold the card in Doing.
```
**Verify:** `$ node qa.mjs 1` → writes `.receipts/1.qa.json` (or "skipped"). `$ node review.mjs 1 "test"` →
writes a receipt and exits 0/1 by verdict.
**If it fights you:** if the smoke or receipt blocks the *commit*, you've put it in the wrong place — it gates
*promotion*, after the commit. Keep the two layers separate or you've lost the whole distinction.

---

## Act IV — let go

### Stage 9 — the theme picker, live · **SPEC-DRIVEN end to end**
Don't pre-build this. Run the finished loop and let it build a real feature:
```bash
$ node server.mjs    # type "add a theme picker", drag it to Doing
```
Watch: implement → commit floor → commit → smoke → receipt → `move_card` to Done → the board reloads wearing a
dark mode you didn't write. This is the cold-open moment — except now you can name every safeguard between the
agent and your main branch. The result *is* the reference implementation.

### Stage 10 — the conductor · take-home
```bash
$ node scripts/conduct.mjs    # reads the board, builds the next task, with nobody typing the prompt
```
You stopped writing the code at stage 4; you stop typing the prompt here; you never stop owning the spine.

---

## Did it actually work? (reproduce it yourself)

You should be able to prove the whole thing deterministically, end to end, without trusting this document:
```bash
$ node gate.mjs && node --test          # the floor is green
$ git add -A && git commit -m "check"   # commits (floor ran via the hook)
# now sabotage and confirm the leash holds:
$ printf '\xf0\x9f\x9a\x80' >> index.html && git add -A && git commit -m "slip"   # → GATE BLOCKED
```
If you've followed the tags-as-safety-net approach, you can also check your work against ours at any point:
```bash
$ git diff 5-gate                       # how your gate compares to the reference
```
The point of this guide is that you never *need* that diff — but it's there when the build fights you.

---

## Now make it yours (the transfer worksheet)

Ensō is a toy. The *pattern* is not. Before you close this guide, map each piece to a real service you own —
fill these five blanks for a repo you actually ship. If you can answer them, you've learned the pattern, not the toy:

| Ensō piece | The pattern | In *my* codebase… |
|------------|-------------|-------------------|
| `enso-design` skill | taste/knowledge the agent inherits | my conventions live in: `__________` (the one Skill I'd write first) |
| `board-mcp` | the *one* system boundary I'd expose as tools | my agent's safe surface is: `__________` (DB? Jira? deploy API?) — and the 3–5 tools are: `__________` |
| `gate.mjs` + `node --test` | the deterministic **commit floor** | my floor already exists as: `__________` (which lint/typecheck = gate; which suite = the behavior floor) |
| `.githooks` → CI | local floor vs the real wall | my enforcement is: `__________` (which checks are *required* on the protected branch) |
| `qa.mjs` + `review.mjs` | the **release gate** (audit, not proof) | my "promote" check is: `__________` (smoke/e2e + the diff-bound reviewer or human PR) |

If a row is blank, that's your next move — not "adopt agents," but "build the floor that would let me trust one."
The production deltas are real: **CI required, a protected branch, a sandboxed agent in a clean worktree, scoped
`--allowedTools` (never `--dangerously-skip-permissions`), and no autocommit to main — open a PR instead.** Same
pattern; harder boundaries.
