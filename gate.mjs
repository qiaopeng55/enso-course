#!/usr/bin/env node
// Ensō gate — the deterministic leash. Runs before every commit; blocks slop.
// Checks index.html against the enso-design skill's hard rules + basic sanity.
import { readFileSync } from 'node:fs'

const html = readFileSync('index.html', 'utf8')
const fails = []

// 1. JS must PARSE — syntax only. This does NOT prove it runs or is correct (that's the
//    judge's + the browser's job). A cheap floor, honestly named: catches typos, not logic.
const js = (html.match(/<script>([\s\S]*?)<\/script>/) || [,''])[1]
try { new Function(js) } catch (e) { fails.push(`JS syntax error: ${e.message}`) }

// 2. No emoji as icons (enso-design: forbidden). Real emoji blocks only — NOT arrows/math
//    symbols (those aren't emoji; flagging them was a false-positive the review caught).
if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(html)) fails.push('emoji found (use drawn marks)')

// 3. No pure white / pure black as a VISIBLE colour (enso-design: warm near-white/near-black only).
//    The calligraphic ensō's mask reveal needs #fff — an SVG mask-luminance channel, NOT a design
//    colour — so strip the mask blocks + the mask centreline (.arc) before checking the palette.
const visible = html.replace(/<mask[\s\S]*?<\/mask>/gi, '').replace(/\.enso\s+\.arc\s*\{[^}]*\}/g, '')
if (/#fff(\b|f{3}\b)|#ffffff|#000(\b|000\b)|#000000/i.test(visible)) fails.push('pure #fff/#000 found (use --bg/--fg tokens)')

// 4. No raw multiplication-sign delete glyph
if (/>\s*×\s*</.test(html)) fails.push('raw × glyph found (use a drawn remove affordance)')

// 5. The one accent token must be defined (design system present)
if (!/--accent:\s*#e8553e/i.test(html)) fails.push('zen accent token missing (design skill not applied)')

// 6. Faithful to the kanban contract: assert the COLUMNS array really declares the three
//    columns — NOT a substring scan (those words live in CSS/comments regardless). Composition
//    ("does it look like a kanban") is the judge's job, not a deterministic gate's. Honest scope.
const cols = (html.match(/COLUMNS\s*=\s*\[([\s\S]*?)\]/) || [, ''])[1]
for (const c of ['todo', 'doing', 'done']) if (!cols.includes(`"${c}"`) && !cols.includes(`'${c}'`)) fails.push(`column "${c}" not declared in COLUMNS`)

// 7. The cycle report is a rendered surface too — gate it for the same visual slop (it used to escape).
try {
  const rpt = readFileSync('report.mjs', 'utf8')
  if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(rpt)) fails.push('emoji in report.mjs (the report is a surface too)')
  if (/#fff(\b|f{3}\b)|#ffffff|#000(\b|000\b)|#000000/i.test(rpt)) fails.push('pure #fff/#000 in report.mjs')
} catch {}

if (fails.length) {
  console.error('\n  ✗ GATE BLOCKED — ' + fails.length + ' violation(s):')
  for (const f of fails) console.error('    • ' + f)
  console.error('  the leash held. fix, then commit.\n')
  process.exit(1)
}
console.log('  ✓ gate passed — calm, clean, faithful.')
