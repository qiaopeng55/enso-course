# Beyond the video — the Claude Code features we left out

The video keeps to the spine: **skill → MCP → floor → release gate → conductor.** To keep that line clean,
a handful of real Claude Code features were deliberately deferred. If you're building this for real, these
are the ones to reach for. (Canonical docs: <https://code.claude.com/docs>.)

## Onboarding
- **`/init`** — don't hand-write `CLAUDE.md` from blank. `/init` drafts it from your repo; then you prune to
  a lean index. (The video writes it by hand only to show the *shape*.)

## Controlling the agent
- **Permissions / allowlist** — `/permissions`, `--allowedTools`, or the per-edit approval prompt. The video
  runs `claude -p --dangerously-skip-permissions` because it's a **sandboxed demo** with a fenced agent and a
  real floor. On a real repo you keep the prompt, or allowlist one tool at a time. `--dangerously-skip-permissions`
  is exactly `bypassPermissions` — **never a default.**
- **Plan mode** — the canonical interaction loop is *explore (read-only) → plan → code → commit*. The video
  front-loads the architecture; in practice, drop into plan mode first, approve the plan, then let it build.
- **Budget / turn caps** — `--max-turns`, `--max-budget-usd`. This is what makes the conductor safe to leave
  running: it can't run away.

## Tools & context
- **`/mcp`** — verify the agent actually *sees* your tools: it lists connected servers, tool counts, and
  pending approvals. Run it right after wiring `.mcp.json` — "discovered at run time" becomes evidence.
- **Context management** — `/clear` between unrelated tasks; `/compact` when context fills. The conductor
  gets this for free (a fresh context per card); a long *manual* session does not — clear deliberately.
- **Sub-agents** — delegate investigation to a fresh context. `review.mjs` is this pattern, hard-coded: a
  model that didn't write the diff grades it.

## Sessions
- **Resume** — `claude --continue` / `--resume`, and `/rename`. A multi-evening build survives; you don't
  lose the thread.

## Install / run troubleshooting
- **Node** from <https://nodejs.org> (or `brew install node`); **git** via the Xcode CLT (`xcode-select --install`).
- `node server.mjs` needs **Node ≥ 18** (built-in `--test` runner + global `fetch`).
- If `POST /build` hangs: confirm `claude` is on `PATH` and authenticated — run `claude` once interactively
  to log in. If the floor never blocks, confirm the hook is wired: `git config core.hooksPath .githooks`.
