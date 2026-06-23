---
name: enso-design
description: The Ensō visual language. Apply to any surface so it stays calm, minimal, and coherent — Karpathy-clean code, Steve-Jobs-calm design. Use before building or restyling any UI in this project.
---

# Zen design — the Ensō visual language

Small yet elegant. Subtraction, not features. Every mark earns its place.

## Tokens (the only palette — no bespoke hex on surfaces)
```
--bg:     #fbfbfa   /* near-white paper, never pure #fff */
--fg:     #1a1a1a   /* warm near-black ink */
--muted:  #9b9b97   /* secondary text, resting affordances */
--line:   #ececea   /* hairline separators */
--accent: #e8553e   /* ONE accent (warm vermilion). Used to MEAN, never to decorate */
```
One accent per viewport. No second accent, no gradients, no shadows-as-decoration.
**Use the tokens, not raw hex.** Reach for `var(--bg/--fg/--muted/--line/--accent)`. For a translucent tint, use `rgba()` of the token's channels (e.g. `rgba(232,85,62,0.08)` for accent), **never** `#fff`/`#000` or `rgba(255,255,255,…)`/`rgba(0,0,0,…)`. The shadow of "white" is still warm paper, not pure white.

## Gate contract — checked deterministically; a violation BLOCKS the commit (`node gate.mjs`)
Build to pass it the first time. On `index.html` (and `report.mjs`) the gate rejects:
1. **Emoji** anywhere — use drawn marks (thin SVG strokes), never glyph icons.
2. **Pure `#fff` / `#ffffff` / `#000` / `#000000`** (any case) — use `--bg`/`--fg`; for translucency use `rgba()` of a token's channels, never of 255/255/255 or 0/0/0.
3. A missing **`--accent`** token (it must be defined).
4. Columns not in a **`COLUMNS`** array declaring `todo`, `doing`, `done`.
5. An inline `<script>` that doesn't **parse**.
6. A raw `×` delete glyph (`>×<`) — use a restrained drawn remove affordance instead.
7. The same emoji + pure-color checks also run on `report.mjs` (it's a rendered surface too) — **seven checks in all**.
If you need a near-white/near-black, the tokens already are exactly that — don't reach past them.

## Type
System stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), 16px/1.5, antialiased.
Section labels: 13px, 600, uppercase, letter-spacing .12em, in `--muted`. Body in `--fg`.

## Layout
Centered single column, generous air (≥14vh top padding). Hairline (`--line`) separators, never boxes/cards with borders+shadows. Let whitespace do the dividing.

## Motion (calm-flat)
Hover = subtle tint or affordance reveal. Focus = accent, not a heavy ring. **No shadow/elevation change on state.** Transitions ≤200ms ease-out. **No springs, no bounce.** Entrance/exit of list items gets a quiet fade/height transition so the surface feels like a calm object, not a spreadsheet.

## Affordances
Checks = thin circle → fills with `--accent` + check when done. Destructive/remove = a restrained drawn mark that fades in on hover (never a loud raw glyph). Done text → `--muted` + strikethrough.

## Progress = the ensō (signature)
Any progress/loading/completeness uses an **ensō** (an open ink ring whose arc = % done, opening at top-right) — never a spinner, bar, or percent-only. The gap it hasn't closed is the point.

**The ensō must be calligraphic, not geometric.** It is a single brush stroke, not a perfect progress ring: uneven stroke width (thicker at the start of the sweep, tapering to a dry, thinning end), a slightly irregular path (a hand, not a compass), and a visible open gap that never closes. Implement with a variable-width path (or a stroke whose `stroke-width` + opacity taper toward the tail) and `stroke-linecap: round`; avoid a uniform `stroke-width` circle. A flat, even ring is a bug, not the ensō.

## Agentic step feed (when an agent works on a surface)
When an agent does work, the user must SEE it think and act — calmly, never a frozen spinner. Stream it live:
- Forward the agent's **reasoning** (its `thinking` blocks), its **narration** (text), and **every tool call** as they happen (SSE / a stream).
- Each step **fades IN** (≤280ms ease-out, a few px of translateY), rests at ~0.9 opacity; old steps **fade OUT gracefully** (a `leaving` class transitions opacity→0, removed on `transitionend`) — **never snap-remove**. Keep ~6 visible. When the run settles, the whole feed **fades out**, never blanks abruptly.
- Distinguish quietly by weight, not color noise: **reasoning** = italic muted; **narration** = muted; **tool calls** = ink. The working indicator is the **ensō**, never a spinner bar.
- The point: latency made legible — you watch the agent think and act, and it feels like a calm object, not a loading screen.

## Code (Karpathy-clean — the design extends to the source)
Single concern per function, well-named, no dead code, readable top-to-bottom, smallest that works. The code is part of the craft; an elegant surface on ugly code fails the bar.

## Empty states
Purposeful and quiet — a single calm line, on-brand, never a blank void or a loud illustration.

## Forbidden
Emoji as icons · pure-white/black · multiple accents · drop-shadow cards · spring animation · raw `×`/clip-art glyphs · clutter, chrome, or anything that doesn't earn its place.
