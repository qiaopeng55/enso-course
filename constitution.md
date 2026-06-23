# Ensō — constitution

> The **constitution** is the engineering rules every build inherits — the non-negotiables an agent must
> respect. The Skill (`.claude/skills/enso-design`) governs *taste* (how it looks); this governs *behavior*
> (how it's built). Taste and rules are different files because they change for different reasons.
>
> Cards are built against this document. The reviewer audits adherence to it. Violating an article is grounds
> to block or send a card back.

## Articles

1. **Spec before implementation.** No feature is built before it exists in `spec.md`. Intent is the source of
   truth; the code is downstream of it.

2. **Tests before autonomy.** An agent is only allowed to act autonomously on a surface that has a deterministic
   floor — `node gate.mjs` (mechanical facts) and `node --test` (behavior). No floor, no autonomy.

3. **The floor decides; everything else advises.** The gate and tests are the only things that may *block a
   commit*. A reviewer sub-agent is a **signal**. A browser check is **smoke**. Neither is correctness, and
   neither overrides a red floor or rescues one.

4. **No hidden agent side effects.** An agent changes only what the task names. Board state changes go through
   the board's tools (MCP), never a raw file write. The diff after a build must be explainable line by line.

5. **Bounded loops.** Every autonomous run is bounded — a timeout and a single task per run. An agent that hasn't
   finished inside its bound is stopped, not extended. No unbounded "keep going."

6. **Least privilege.** Give the narrowest tools that do the job. `--dangerously-skip-permissions` is acceptable
   *only* in a throwaway repo with no secrets and git as the undo; never against a real codebase. There, scope
   `--allowedTools`, sandbox the worktree, and keep prod credentials out of reach.

7. **The gate runs before every commit.** Enforced by `.githooks/pre-commit`. A local hook is the fast floor; the
   same checks must also run in CI, where they cannot be skipped with `--no-verify`. Local hook = floor; CI = wall.

8. **Generator ≠ evaluator.** The thing that writes the code never decides, alone, whether it is good. The
   deterministic floor (a different kind of thing entirely) and an independent reviewer (a different lineage) do.

9. **Receipts, not claims.** A judgment only counts if it leaves an artifact bound to the exact diff it judged —
   inspectable, versioned, stale-detectable. "It looks fine" said in chat is not evidence.

10. **Smallest thing that works.** Karpathy-clean: single-concern functions, no dead code, no dependency added
    without paying rent, no domain modeling a `{ id, text, status }` card doesn't need. Simplicity is a feature
    of the lesson, not a constraint on it.

## How the loop honors this

```
human authors spec + tasks (Art. 1)         →  agent builds ONE task, bounded, least-privilege (Art. 4,5,6)
  →  gate.mjs + node --test = the floor (Art. 2,3,7)  →  reviewer receipt audits adherence (Art. 8,9)
  →  browser smoke proves it renders        →  on a green floor, commit; the card moves via move_card (Art. 4)
```

If any article and a convenience disagree, the article wins — then we fix the convenience.
