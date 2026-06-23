# MCP vs Skills — knowledge in, actions out

A two-minute mental model for the two ways you extend an agent, why each exists, and when to reach for which.
Engineers ask this immediately; here's the honest answer.

## The one-line version

> **A Skill changes what the agent *knows*. An MCP changes what the agent can *do*.**
> Skill = knowledge *in*. MCP = actions *out*.

## What a Skill is, and why

A **Skill** is a file (or folder) of **knowledge** you hand the model: taste, rules, examples, a procedure. The CLI
loads it into the agent's context, so its **output** is shaped by it. It's how you stop re-explaining yourself every
prompt — you write the standard once, and every build inherits it.

In Ensō: `.claude/skills/enso-design/SKILL.md` is the visual language (warm paper, one accent, the calligraphic
ensō). Point any prompt at it and the result looks like us. The Skill never *does* anything — it informs.

A Skill is the right tool when the gap is **understanding**: "the agent doesn't know our conventions / our domain /
how we like things done." You're teaching, not wiring.

## What an MCP is, and why

**MCP** (Model Context Protocol) is a small standard for exposing **tools** — typed, named functions with schemas —
that an agent can **call** to read or change a real system. An MCP *server* sits at a system boundary (a database,
Jira, GitHub, CI, a filesystem, or here, the board) and offers a stable, permissioned, auditable interface. The agent
doesn't get raw access to your database; it gets `add_card`, `move_card`, `list_cards` — and nothing else.

Why a protocol instead of just letting the model write to the file? Three reasons engineers care about:
1. **A boundary you control.** The agent can only do what the tools expose. That's your least-privilege surface.
2. **Auditable + typed.** Every action is a named call with a schema — loggable, testable, mockable. (Ensō's
   `node --test` exercises the board tools directly.)
3. **Swappable.** The agent calls `move_card`; whether that writes a JSON file, a Postgres row, or a Jira transition
   is behind the tool. Same five tools, different backend. In Ensō `board.json` is a stand-in for a DB precisely to
   make this point — swap the implementation, the agent's interface doesn't change.

An MCP is the right tool when the gap is **capability**: "the agent needs to *act on a system* safely and the same
way every time."

## The distinction that trips people up

**File edits are not MCP.** When the Ensō agent writes `index.html`, it uses the **coding agent's own file tools**,
not an MCP. MCP is reserved for the **system boundary** — the board. So in one build, the agent uses *two different
mechanisms*: file tools to change code, and MCP to change the board. Saying "the agent acts through MCP" about the
code edit would be overclaiming. Name them separately and the lesson stays honest.

## Where gates/hooks fit (a different axis entirely)

Skills and MCP are about giving the agent *more* (knowledge, capability). A **gate** (a deterministic check) and a
**git hook** (what runs it automatically) are about *constraint* — what the agent is allowed to land. Don't confuse
the axes: Skills/MCP expand the agent; gates/hooks/tests bound it. A good agentic setup has both — generous
capability, hard boundaries.

## When to use what — a cheat sheet

| You want the agent to… | Reach for | Example in Ensō |
|------------------------|-----------|-----------------|
| Follow your taste / conventions / domain knowledge | a **Skill** | `enso-design` makes the UI look right |
| Act on a real system through a stable, safe interface | an **MCP** | `board-mcp` changes the board, only the board |
| Write or edit code in the repo | the agent's **file tools** (built in) | editing `index.html` |
| Be prevented from landing slop / broken behavior | a **gate + tests + hook** | `gate.mjs` + `node --test` + pre-commit |

Rule of thumb: **teach with a Skill, empower with an MCP, constrain with a gate.** If you're explaining *what good
looks like*, that's a Skill. If you're handing over *the keys to a system*, that's an MCP. If you're deciding *what's
allowed to ship*, that's the floor.
