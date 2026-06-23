// Ensō backend — the agent runs on DRAG-TO-DOING, not on chat.
// Adding a task is a plain client-side quick-add (no agent). Dragging a card into Doing hits
// POST /build, which spawns `claude -p --output-format stream-json` to implement that one task;
// its thinking + tool calls stream to the browser; the gate guards the commit; on pass → Done.
import { createServer } from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { report } from './report.mjs'   // the cycle report lives in its own gated file
import { call } from './board-mcp.mjs'  // the board's tools — every board mutation goes through these

const PORT = process.env.PORT || 4173
const BOARD = new URL('./board.json', import.meta.url)

const send = (res, status, type, body) => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(body)
}
const body = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)) })

// The agent must do real work, so we tell it what it can touch and to keep the board in board.json.
// Adding a task is a plain client-side quick-add (no agent). The agent runs ONLY when you drag a
// card into Doing → the builder below. One agent action, one direction, no back-and-forth.
const BUILDER = (task) => `You are the Ensō builder, working inside this project directory.
First read .agent/context.json — it grounds you in the files in play, the routes, the floor commands, and
the constraints (the spec, the constitution, the skill). Then implement EXACTLY this one task by editing
index.html (Edit/Write): "${task}".
Follow .claude/skills/enso-design/SKILL.md (read it first); do the smallest real change that satisfies it.
A deterministic gate guards the commit — honor its contract or the work is reverted: NO emoji, NO pure
#fff/#000/#ffffff/#000000 (use the --bg/--fg tokens; for translucency use rgba() of a token's channels),
keep the --accent token, and keep the columns in a COLUMNS array declaring todo/doing/done.
If the task is ambiguous, DO NOT ask questions or wait for confirmation — make a sensible, minimal
choice and build it. Do NOT touch the board, board.json, server.mjs, or board-mcp.mjs. When done, stop.`

// stream a `claude -p` child's reasoning + tool calls over SSE. onClose(touchedCode, safe) → reloadCode.
function streamAgent(res, system, request, onClose) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' })
  let alive = true
  const safe = (ev) => { if (!alive) return; try { res.write(`data: ${JSON.stringify(ev)}\n\n`) } catch { alive = false } } // never crash on write-after-close
  safe({ type: 'step', kind: 'start', text: 'thinking…' })
  const dir = new URL('.', import.meta.url)
  // The agent runs unattended, so no human is there to approve edits. Default: skip the prompt — that's the
  // demo's whole point (the deterministic FLOOR catches slop, not a human). SAFER real-repo path: set
  // ENSO_ALLOWLIST=1 to pre-approve ONLY the file-edit tools (never arbitrary Bash), so it works without the
  // dangerous flag — exactly what you'd do on a codebase you care about.
  const perm = process.env.ENSO_ALLOWLIST ? ['--allowedTools', 'Edit,Write,Read'] : ['--dangerously-skip-permissions']
  const cl = spawn('claude', ['-p', `${system}\n\nRequest: ${request}`, '--output-format', 'stream-json', '--verbose', '--mcp-config', '.mcp.json', ...perm],
    { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
  const timer = setTimeout(() => { try { cl.kill() } catch {} }, 600_000)   // 10 min — real builds can be slow
  res.on('close', () => { alive = false; try { cl.kill() } catch {} })
  let touchedCode = false
  createInterface({ input: cl.stdout }).on('line', (line) => {
    let ev; try { ev = JSON.parse(line) } catch { return }
    if (ev.type !== 'assistant') return
    for (const b of ev.message?.content ?? []) {
      if (b.type === 'thinking' && b.thinking?.trim()) safe({ type: 'step', kind: 'reason', text: b.thinking.trim() })
      if (b.type === 'text' && b.text.trim()) safe({ type: 'step', kind: 'think', text: b.text.trim() })
      if (b.type === 'tool_use') {
        const f = b.input?.file_path || b.input?.path || ''
        if (/index\.html/.test(f)) touchedCode = true
        safe({ type: 'step', kind: 'tool', text: `${b.name}${f ? ' · ' + f.split('/').pop() : ''}` })
      }
    }
  })
  cl.stderr.on('data', (d) => safe({ type: 'step', kind: 'note', text: String(d).slice(0, 120) }))
  cl.on('close', async () => {
    clearTimeout(timer)
    let reloadCode = false
    try { reloadCode = await onClose(touchedCode, safe) } catch (e) { safe({ type: 'step', kind: 'note', text: 'post: ' + e.message }) }
    safe({ type: 'done', reloadCode }); try { res.end() } catch {}
  })
  cl.on('error', (e) => { clearTimeout(timer); safe({ type: 'step', kind: 'note', text: 'agent error: ' + e.message }); safe({ type: 'done' }); try { res.end() } catch {} })
}

// Context-grounding: hand the agent a small artifact (the files in play, routes, floor, tools, constraints)
// BEFORE it runs, so it isn't context-blind. This is the Spec-Kit "Agents" lesson, made concrete.
function writeContext(card) {
  const ctx = {
    task: card.text,
    files_in_play: ['index.html'],
    do_not_touch: ['board.json', 'server.mjs', 'board-mcp.mjs', 'gate.mjs', 'test/'],
    routes: { build: 'POST /build', board: 'GET/POST /board', report: 'GET /report' },
    commit_floor: ['node gate.mjs', 'node --test'],
    release_gate: ['node qa.mjs <id>', 'node review.mjs <id> "<task>"'],
    mcp_tools: ['list_cards', 'add_card', 'move_card', 'seed', 'clean'],
    constraints: { skill: '.claude/skills/enso-design/SKILL.md', constitution: 'constitution.md', spec: 'spec.md' },
  }
  try { mkdirSync(new URL('./.agent/', import.meta.url), { recursive: true }); writeFileSync(new URL('./.agent/context.json', import.meta.url), JSON.stringify(ctx, null, 2)) } catch {}
}

// BUILD = execute one card. COMMIT FLOOR (gate + tests) decides what lands; the RELEASE GATE (smoke +
// receipt) decides what's promoted to Done. The card moves through the board tool (move_card), never a raw write.
function build(card, res) {
  const INDEX = new URL('./index.html', import.meta.url)
  let snapshot = ''
  try { snapshot = readFileSync(INDEX, 'utf8') } catch {}   // remember the file as-is, BEFORE the agent touches it
  writeContext(card)                                         // ground the agent first
  streamAgent(res, BUILDER(card.text), `Build this: ${card.text}`, async (touchedCode, safe) => {
    const dir = new URL('.', import.meta.url)
    // 1. THE COMMIT FLOOR — mechanical facts (gate) + behavior (tests). Either red → revert, hold the card.
    try { execFileSync('node', ['gate.mjs'], { cwd: dir }); execFileSync('node', ['--test'], { cwd: dir }) }
    catch {
      try { writeFileSync(INDEX, snapshot) } catch {}   // restore the pre-build file — never nuke uncommitted work
      safe({ type: 'step', kind: 'note', text: 'commit floor RED — reverted · card held in Doing' })
      return false
    }
    if (!touchedCode) { safe({ type: 'step', kind: 'note', text: 'no code change — card stays in Doing' }); return false }
    // 2. floor green → commit. --no-verify: the floor just ran. If the commit FAILS there is nothing to
    //    promote, so hold the card in Doing (the work stays on disk for a retry — we never revert good work).
    let committed = false
    try { execFileSync('git', ['add', 'index.html'], { cwd: dir }); execFileSync('git', ['commit', '-q', '--no-verify', '-m', `enso: ${card.text.slice(0, 60)}`], { cwd: dir }); committed = true; safe({ type: 'step', kind: 'tool', text: 'commit floor green · committed' }) }
    catch { safe({ type: 'step', kind: 'note', text: 'commit FAILED — card held in Doing (work kept; not promoted)' }) }
    if (!committed) return true   // no commit → nothing to release → stay in Doing; reload shows the live work
    // 3. THE RELEASE GATE — smoke then receipt (audit). Blocks PROMOTION to Done, never the commit.
    let released = true
    try { execFileSync('node', ['qa.mjs', String(card.id)], { cwd: dir }); safe({ type: 'step', kind: 'tool', text: 'smoke ok' }) }
    catch { released = false; safe({ type: 'step', kind: 'note', text: 'smoke failed — held for review' }) }
    try { execFileSync('node', ['review.mjs', String(card.id), card.text], { cwd: dir }); safe({ type: 'step', kind: 'tool', text: 'receipt written' }) }
    catch { released = false; safe({ type: 'step', kind: 'note', text: 'reviewer requested changes — held for review' }) }
    // 4. promote to Done THROUGH THE BOARD TOOL (move_card) — only if the release gate passed
    if (released) {
      try { call('move_card', { id: card.id, status: 'done' }); safe({ type: 'step', kind: 'tool', text: 'board.move_card → done' }) } catch {}
      safe({ type: 'step', kind: 'note', text: 'built · reloading the board…' })
    } else {
      safe({ type: 'step', kind: 'note', text: 'committed · card held in Doing for review' })
    }
    return true   // reload either way — the committed code is live; promotion depends on the release gate
  })
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://x`)
  if (req.method === 'GET' && url.pathname === '/') return send(res, 200, 'text/html', readFileSync(new URL('./index.html', import.meta.url)))
  if (req.method === 'GET' && url.pathname === '/board') {
    const b = existsSync(BOARD) ? await readFile(BOARD, 'utf8') : '{"cards":[]}'
    return send(res, 200, 'application/json', b)
  }
  if (req.method === 'POST' && url.pathname === '/board') { await writeFile(BOARD, await body(req)); return send(res, 200, 'application/json', '{"ok":true}') }
  if (req.method === 'POST' && url.pathname === '/build') { const { id, text } = JSON.parse(await body(req) || '{}'); return build({ id, text }, res) }
  if (req.method === 'GET' && url.pathname === '/report') {
    const b = existsSync(BOARD) ? await readFile(BOARD, 'utf8') : '{"cards":[]}'
    return send(res, 200, 'text/html', report(JSON.parse(b).cards || []))
  }
  send(res, 404, 'text/plain', 'not found')
}).listen(PORT, () => console.log(`enso — http://localhost:${PORT}`))
