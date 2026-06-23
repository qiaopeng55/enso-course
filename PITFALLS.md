# Ensō — pitfalls (where cold rebuilds actually get stuck)

The real bugs that show up when you rebuild from scratch, and the fix for each.

### The gate
- **`column "todo" not declared in COLUMNS`** — you named the array `COLS`, `columns`, or inlined the
  columns in markup. The gate checks for a literal `COLUMNS` array declaring `todo`/`doing`/`done`. Name it exactly.
- **The commit isn't blocked by the gate** — the hook isn't armed. `git config core.hooksPath .githooks &&
  chmod +x .githooks/*`. A fresh clone is unprotected until you do this (that's the lesson: a client hook is advisory).
- **The gate passes but the feature is broken** — by design. The gate catches *slop*, not *wrong*. That's
  what `node --test` (behavior) and the release gate (audit) are for. Don't ask the gate to prove correctness.

### Tests
- **`node --test` finds nothing** — your files must match the runner's pattern (`test/*.mjs` or `*.test.mjs`).
- **The board test mutates the real board.json** — point it at a temp file with `ENSO_BOARD` before importing
  the tool logic; the module reads that env at load, so set it *first* (a dynamic `import()` after setting env).
- **Importing `board-mcp.mjs` hangs the test** — the stdio transport must be guarded so it only runs when the
  file is executed directly (`if (import.meta.url === pathToFileURL(process.argv[1]).href) serve()`), not on import.

### The agent / server
- **`--mcp-config` errors at build time** — that flag set belongs to the child the *server* spawns at runtime,
  not to your interactive build session. `.mcp.json` doesn't exist until stage 4.
- **`server.mjs` crashes on start** — it imports `report.mjs` and `board-mcp.mjs`. Both are part of stage 4.
- **The board "moves" but the claim is a lie** — if the server writes `board.json` directly, "the agent acts
  through MCP" is false. Route the move through `board.move_card` (the tool) so the claim is true in code.
- **A gate-block nukes the agent's other work** — never `git checkout -- index.html` to revert; snapshot the
  file *before* the build and restore that snapshot, so uncommitted work elsewhere survives.

### The release gate
- **The smoke blocks the commit** — it shouldn't. Smoke + receipt gate *promotion to Done*, not the commit.
  The commit floor (gate + tests) already decided what lands. Keep the layers separate.
- **A stale receipt counts** — bind every receipt to the diff hash; if the diff changes after the receipt was
  written, it's stale and must not count.
- **Playwright isn't installed** — the smoke is optional. It should record "skipped" and exit 0, never break the loop.
