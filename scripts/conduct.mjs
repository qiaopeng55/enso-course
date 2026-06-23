#!/usr/bin/env node
/**
 * conduct.mjs — Claude conducts the Ensō build, from Ensō's OWN board.
 *
 * The loop turned on itself. No human, no external system: the kanban (board.json) is the
 * source of truth. For the next 'todo' card, the conductor:
 *   1. moves it to 'doing',
 *   2. has CLAUDE build it (claude -p edits index.html, following the enso-design skill),
 *   3. runs the LEASH (gate.mjs) — block ⇒ the card stays 'doing',
 *   4. (optional) grades it with a second model (gemini),
 *   5. records cost, commits index.html, and moves the card to 'done'.
 * You authored the loop in ten moves; here the loop authors the work with no hand on the keyboard.
 *
 *   node scripts/conduct.mjs                      # conduct the next 'todo' card
 *   node scripts/conduct.mjs --card 3        # conduct a specific card id
 *   node scripts/conduct.mjs --add "text"    # enqueue a build card, then exit
 *
 * Run from the repo root (board.json, index.html, gate.mjs live there).
 * Self-test (no live CLI): ZENBAN_CONDUCT_SELFTEST=1 makes a tiny safe edit instead of calling Claude
 * — proves the board→gate→commit→done loop end-to-end without a logged-in `claude`.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = process.env.ZENBAN_REPO || process.cwd()
const BOARD = join(REPO, 'board.json')
const INDEX = join(REPO, 'index.html')
const arg = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null }
const sh = (cmd, a, o = {}) => execFileSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 << 20, cwd: REPO, ...o })

const readBoard = () => { try { return JSON.parse(readFileSync(BOARD, 'utf8')).cards || [] } catch { return [] } }

// The board changes ONLY through the typed board tools (board-mcp's `call`) — never a raw write — the
// same invariant the build agent obeys. ENSO_BOARD points the tools at THIS repo's board.json.
process.env.ENSO_BOARD = BOARD
const { call } = await import(new URL('../board-mcp.mjs', import.meta.url))

// --add: enqueue a build card THROUGH the tool and stop (handy for staging the demo).
const addText = arg('--add')
if (addText) {
  call('add_card', { text: addText })
  console.log(`+ queued "${addText}"`); process.exit(0)
}

// 1. The board = source of truth: pick the stage to conduct.
const cards = readBoard()
const wantId = arg('--card')
const card = wantId
  ? cards.find((c) => String(c.id) === String(wantId))
  : cards.filter((c) => c.status === 'todo').sort((a, b) => Number(a.id) - Number(b.id))[0]
if (!card) { console.error('no ‘todo’ card to conduct. add one:  node scripts/conduct.mjs --add "your stage"'); process.exit(1) }
console.log(`▸ conducting "${card.text}" (#${card.id})`)

// 2. Move it to 'doing' THROUGH THE TOOL (never a raw write).
call('move_card', { id: card.id, status: 'doing' })

// 3. Claude drives the RUNNER (claude -p), editing index.html per the card.
const index = existsSync(INDEX) ? readFileSync(INDEX, 'utf8') : ''
const t0 = Date.now()
let cost = 0, turns = 0
if (process.env.ZENBAN_CONDUCT_SELFTEST) {
  // self-test: a tiny, gate-safe edit standing in for Claude's build
  writeFileSync(INDEX, index.replace('</body>', `<!-- conducted: ${card.text} -->\n</body>`))
  console.log('  runner: (self-test) tiny safe edit')
} else {
  const prompt = `You are advancing ONE stage of Ensō, a single-file zen kanban. Read and FOLLOW .claude/skills/enso-design/SKILL.md exactly.
STAGE: ${card.text}
Rules: edit index.html only; single file, no dependencies; Karpathy-clean, smaller-is-better, calm. Keep what works; change only what this stage needs. When done, stop.
Current index.html:\n\n${index}`
  let runner
  try { runner = JSON.parse(sh('claude', ['-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions'])) }
  catch (e) { console.error('runner failed: ' + e); process.exit(1) }
  cost = runner.total_cost_usd ?? 0; turns = runner.num_turns ?? 0
  console.log(`  runner: $${cost} · ${Math.round((Date.now() - t0) / 1000)}s · ${turns} turns`)
}
const secs = Math.round((Date.now() - t0) / 1000)

// 4. The LEASH — the FULL floor: gate (mechanical) + tests (behavior), per constitution.md.
//    Either red ⇒ the card stays 'doing'.
let gatePass = true
try { console.log('  ' + sh('node', ['gate.mjs']).trim()); sh('node', ['--test']) }
catch (e) { gatePass = false; console.log((e.stdout || '').trim() + '\n  ✗ floor blocked — card held at ‘doing’.') }

// 5. (optional) a second model grades it — generator never certifies itself.
if (gatePass && !process.env.ZENBAN_CONDUCT_SELFTEST) {
  try {
    const g = `Independent reviewer, DIFFERENT lineage. Score ONLY these /10 each, HIGH bar (naming any flaw caps below 10): Works, Karpathy-code, Jobs-design, A11y, Faithful-to-enso-design, Small. Output 6 scores + sum/60 + one-line verdict. Terse. index.html:\n\n${readFileSync(INDEX, 'utf8')}`
    console.log('  ── grade ──\n' + sh('gemini', ['--skip-trust', '-p', g], { env: { ...process.env, GEMINI_CLI_TRUST_WORKSPACE: 'true' } }).trim().split('\n').map((l) => '  ' + l).join('\n'))
  } catch { console.log('  grade skipped (no second model).') }
}

// 6. Record cost, commit index.html, move the card to 'done' (only if the leash passed).
appendFileSync(join(REPO, 'metrics.jsonl'),
  JSON.stringify({ stage: card.text, cost_usd: cost, secs, turns, gatePass, ts: new Date().toISOString().slice(0, 19) }) + '\n')
if (gatePass) {
  sh('git', ['add', 'index.html'])
  let committed = false
  try { sh('git', ['commit', '-q', '-m', `conduct: ${card.text}`]); committed = true } catch {}
  if (committed) {
    call('move_card', { id: card.id, status: 'done' })   // promote THROUGH the tool, never a raw write
    console.log(`✓ Claude conducted "${card.text}" → done, committed, $${cost} logged.`)
  } else {
    console.log(`▸ "${card.text}" built + floor-green, but the commit failed — held at ‘doing’.`)
  }
} else {
  writeFileSync(INDEX, index)   // restore the pre-build snapshot — never `git checkout` (see PITFALLS.md)
  console.log(`▸ "${card.text}" held at ‘doing’ — the leash did not pass it. (index.html restored.)`)
}
