#!/usr/bin/env bash
# Ensō — build the ten-stage course history into a fresh git repo.
#
# Each stage is ONE commit + ONE tag, introducing exactly one concept (vibe → earn the discipline).
# We build into a SEPARATE target dir so the builder never has to hide files from itself — the result
# is a clean, reproducible tutorial whose `git log` IS the course.
#
#   bash course/build-history.sh [TARGET_DIR]      # default: ./.built
#   cd <target> && git log --oneline && git checkout 6-tests
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"          # the enso/ repo root (this file lives in course/)
SRC="$ROOT/course/stages"                          # the per-stage index.html checkpoints
TARGET="${1:-$ROOT/.built}"

rm -rf "$TARGET"; mkdir -p "$TARGET"; cd "$TARGET"
git init -q; git config user.email "course@enso"; git config user.name "Ensō course"

# commit the working tree as one stage. --no-verify: we're laying down the reference, not re-gating it.
stage () { git add -A; git commit -q --no-verify -m "$2"; git tag "$1"; printf '  ✓ %-18s %s\n' "$1" "$2"; }
copy ()  { cp -R "$ROOT/$1" "./$2" 2>/dev/null || true; }

echo "building the Ensō history → $TARGET"

# ── ACT I — vibe (it works, because it's a toy) ──────────────────────────────
cp "$SRC/index.1-vibe.html"  index.html
# the self-contained tutorial travels with the repo from the VERY FIRST tag: `git checkout 1-vibe`
# (or any tag) already has the full guided course to follow along with. site/index.html embeds every
# file's complete source, so it is a complete tutorial on its own — no other file is required to read it.
copy site site; copy README.md README.md
stage 1-vibe   "vibe: a one-shot todo (the baseline toy)"

cp "$SRC/index.2-skill.html" index.html
copy .claude .claude; copy CLAUDE.md CLAUDE.md
stage 2-skill  "skill: point it at enso-design — same todo, now it looks like us"

cp "$SRC/index.3-kanban.html" index.html
stage 3-kanban "kanban: vibe it into a board (the COLUMNS contract appears)"

# ── ACT II — the turn: hand it to an agent, then earn each discipline ─────────
cp "$ROOT/index.html" index.html                   # the reference UI: kanban + the agent feed
copy board-mcp.mjs board-mcp.mjs; copy .mcp.json .mcp.json
copy server.mjs server.mjs; copy report.mjs report.mjs; copy board.json board.json
stage 4-agentic "agentic: MCP hands + a streaming build loop — 'how do I trust this?'"

copy gate.mjs gate.mjs
mkdir -p .githooks
printf '#!/bin/sh\n# the commit floor, part 1: mechanical facts\nnode gate.mjs || exit 1\n' > .githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
stage 5-gate   "gate: a deterministic leash — emoji/slop is BLOCKED at commit"

copy test test
printf '#!/bin/sh\n# the commit floor: mechanical facts + behavior\nnode gate.mjs || exit 1\nnode --test || exit 1\n' > .githooks/pre-commit
chmod +x .githooks/pre-commit
stage 6-tests  "tests: node --test — slop isn't the only failure (the floor is complete)"

copy spec.md spec.md; copy constitution.md constitution.md
copy plan.md plan.md; copy tasks.md tasks.md
stage 7-spec   "spec + constitution: write down what the floor enforces (the punchline)"

copy qa.mjs qa.mjs; copy review.mjs review.mjs
printf '.receipts/\n.agent/\n.built/\nnode_modules/\n' > .gitignore
stage 8-release-gate "release gate: smoke → receipt (audit; blocks promotion, not commit)"

copy docs docs                                     # site/ + README.md already travel from 1-vibe (above)
copy WALKTHROUGH.md WALKTHROUGH.md; copy RECIPE.md RECIPE.md
copy PITFALLS.md PITFALLS.md; copy EXERCISE.md EXERCISE.md; copy BEYOND.md BEYOND.md
copy BUILD.md BUILD.md; copy course course
stage 9-reference "reference: the deep guides + blueprint complete (the site has shipped since 1-vibe)"

mkdir -p scripts; copy scripts/conduct.mjs scripts/conduct.mjs
stage explore-conductor "conductor: the loop runs itself (recursion — take-home)"

echo
echo "done — $(git tag | wc -l | tr -d ' ') tags."
git log --oneline --decorate | sed 's/^/  /'
echo
echo "try:  cd $TARGET && git checkout 6-tests && node gate.mjs && node --test"
