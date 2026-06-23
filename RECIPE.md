# Ensō — the recipe (just the prompts, in order)

Ten moves in one `claude` session. `›` = type into the session. Each move is a git tag.
Full context: `WALKTHROUGH.md`. The why behind each: `docs/COURSE.md`.

```
1  1-vibe        › build a minimal single-file todo: index.html, vanilla JS, localStorage. works by opening the file.

2  2-skill       › restyle index.html to follow .claude/skills/enso-design exactly.

3  3-kanban      › convert the todo to a zen kanban: three columns Todo/Doing/Done in a COLUMNS array,
                   native drag-drop, persist. follow the enso-design skill.

4  4-agentic     › add board-mcp.mjs (stdio JSON-RPC: list/add/move/seed/clean; board.json is the store) +
                   .mcp.json + server.mjs (POST /build spawns `claude -p --output-format stream-json --verbose
                   --mcp-config .mcp.json --dangerously-skip-permissions`; SSE; move the card via board.move_card) + report.mjs.
                 $ git add board-mcp.mjs .mcp.json server.mjs report.mjs && git commit -m "agentic"

5  5-gate        › add gate.mjs (parse JS via new Function, no emoji, no #fff/#000, --accent set,
                   COLUMNS declares todo/doing/done) + .githooks/pre-commit running `node gate.mjs || exit 1`.
                 # test: node gate.mjs · add an emoji · git commit → BLOCKED

6  6-tests       › add test/*.mjs (node --test): gate blocks emoji + missing COLUMNS, MCP add/list/move,
                   persistence. wire the hook to `node gate.mjs && node --test`.
                 # test: node --test  → all green

7  7-spec        › write spec.md (stories, acceptance scenarios, success, non-goals), constitution.md,
                   plan.md, tasks.md.

8  8-release-gate › add qa.mjs (thin Playwright smoke → screenshot + receipt) + review.mjs (a separate
                    claude -p audits the diff vs spec + constitution → diff-bound receipt). they gate
                    PROMOTION to Done, never the commit.

9  9-reference   $ node server.mjs → add "a theme picker" → drag to Doing → watch the whole loop ship it.

10 explore-conductor  $ node scripts/conduct.mjs → the loop builds the next task itself.
```

Stuck on a move? `git checkout <tag>` for our clean version, then `git diff <tag>` to see the gap — that diff is the lesson.
