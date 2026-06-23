# Ensō — plan  (the technical approach: how we satisfy the spec)

> The bridge from `spec.md` (what) to `tasks.md` (the executable list). Small, dependency-light, single-file UI
> plus a tiny Node backend. Everything here traces back to a requirement in the spec and a rule in the constitution.

## Architecture (the whole thing is a handful of small files)

| File | Role | Spec requirement it serves |
|------|------|-----------------------------|
| `index.html` | the board UI — single file, vanilla JS, the `COLUMNS` contract, quick-add, drag, the SSE feed | Board; agentic build (UI) |
| `board.json` | the store — a JSON stand-in for a DB | Board persistence |
| `board-mcp.mjs` | the board's **tools** over stdio JSON-RPC (`list/add/move/seed/clean`) | Tools (MCP); "mutations go through tools" |
| `.mcp.json` | how `claude -p` discovers the board tools | Agentic build |
| `server.mjs` | serves the board; on drag-to-Doing runs a **bounded** build; forwards SSE; runs the floor; moves the card via `move_card` | Agentic build; floor; Art. 4/5 |
| `gate.mjs` | the deterministic **mechanical** floor (parse, no emoji, no pure #fff/#000, `--accent`, `COLUMNS`) | Floor (layer 1) |
| `test/*.mjs` | the **behavior** floor — Node's built-in runner (`node --test`) | Floor (layer 2) |
| `.githooks/pre-commit` | runs `node gate.mjs && node --test` before every commit | Constitution Art. 7 |
| `review.mjs` | a **separate** agent that writes a diff-bound receipt | Audit |
| `qa.mjs` | one thin Playwright **smoke** (loads, renders, toggles, screenshots) | Audit |
| `report.mjs` | the closing cycle report | Report |
| `scripts/conduct.mjs` | the take-home conductor (loop runs itself) | Self-managing |

## The build loop (when a card enters Doing)

```
1. CONTEXT     server builds a small context artifact for the task:
               real files in play · routes · the floor commands · the MCP tools · constraints
               from constitution.md + the skill.  (Prevents context blindness — Spec-Kit "Agents" lesson.)
2. IMPLEMENT   spawn a BOUNDED `claude -p --output-format stream-json --verbose --mcp-config .mcp.json`
               with the task + the context; it edits index.html; stream reasoning + tool calls over SSE.
3. FLOOR       on close: `node gate.mjs` then `node --test`. Red → restore the pre-build snapshot, card
               stays in Doing, reasons streamed. (The floor is the only thing that blocks.)
4. COMMIT      green floor → commit index.html (`--no-verify`: the floor just ran). Commit fails → hold in Doing.
5. RELEASE     the audit, on the committed diff: `qa.mjs` (smoke) then `review.mjs` (reviewer receipt, diff-bound).
6. PROMOTE     released → move the card to Done **through `move_card`**; the board reloads. (Promotion ≠ commit.)
```

Bound = a timeout (Art. 5) and exactly one task per run. Least-privilege tools (Art. 6). No board write except
through the tools (Art. 4).

## The gate stack (cheapest first; only 1–2 block)

1. `node gate.mjs` — instant mechanical facts. **Blocks.**
2. `node --test` — behavior (gate rules, MCP tools, persistence). **Blocks.**
3. browser smoke (`qa.mjs`) — rendering. *Audit/optional.*
4. reviewer receipt (`review.mjs`) — judgment, diff-bound. *Audit/optional.*

## Constraints

- No dependencies in the core artifact (the smoke's Playwright is dev-only, isolated).
- Single-file UI; a Node backend with no framework.
- Additive changes; `board.json` is the system of record; confirm-before-write for any mutation.
- Every stage is one clean commit so the git log reads like the tutorial.

## Risks & mitigations

- **Live build stalls on stage** → every stage is a pre-baked git tag; `9-reference` is the guaranteed fallback;
  pre-recorded clips on a hotkey.
- **Agent forgets to move the card** → the server reconciles by calling `move_card` itself (same tool path), so
  the claim stays true and the result is reliable.
- **Playwright/browser unavailable** → smoke is optional and isolated; the floor (gate + tests) never depends on it.
