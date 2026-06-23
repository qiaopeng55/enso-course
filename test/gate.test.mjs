// Behavior floor for the gate. Proves spec scenario S3: the deterministic gate BLOCKS slop
// (emoji, a dropped COLUMNS contract) and PASSES clean, faithful output.
// We run the real gate.mjs in a temp dir against crafted index.html fixtures.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const GATE = join(dirname(fileURLToPath(import.meta.url)), '..', 'gate.mjs')

let dir
before(() => { dir = mkdtempSync(join(tmpdir(), 'enso-gate-')) })
after(() => rmSync(dir, { recursive: true, force: true }))

// Run the gate in `dir` against a given index.html body; return its exit code (0 = passed).
function runGate(html) {
  writeFileSync(join(dir, 'index.html'), html)
  try { execFileSync('node', [GATE], { cwd: dir, stdio: 'pipe' }); return 0 }
  catch (e) { return e.status ?? 1 }
}

const CLEAN = `<!doctype html><html><head><style>
  :root { --bg:#fbfbfa; --fg:#1a1a1a; --accent:#e8553e; }
</style></head><body><script>
  const COLUMNS = ["todo","doing","done"];
  console.log(COLUMNS.length);
</script></body></html>`

test('S3 · a clean, faithful surface PASSES the gate', () => {
  assert.equal(runGate(CLEAN), 0)
})

test('S3 · an emoji is BLOCKED', () => {
  assert.equal(runGate(CLEAN.replace('<body>', '<body><p>launch 🚀</p>')), 1)
})

test('S3 · a dropped COLUMNS contract is BLOCKED', () => {
  assert.equal(runGate(CLEAN.replace('"todo","doing","done"', '"todo","doing"')), 1)
})

test('pure #000 (instead of the --fg token) is BLOCKED', () => {
  assert.equal(runGate(CLEAN.replace('--fg:#1a1a1a', '--fg:#000000')), 1)
})

test('a missing --accent token (skill not applied) is BLOCKED', () => {
  assert.equal(runGate(CLEAN.replace('--accent:#e8553e;', '')), 1)
})

test('a JS syntax error is BLOCKED', () => {
  assert.equal(runGate(CLEAN.replace('COLUMNS.length);', 'COLUMNS.length;')), 1)  // unbalanced paren
})
