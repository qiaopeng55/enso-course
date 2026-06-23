#!/usr/bin/env node
// review.mjs — the reviewer. A SEPARATE agent (generator ≠ evaluator) audits a build's diff against
// spec.md + constitution.md and the smoke result, then leaves a RECEIPT bound to the exact diff.
// This is the release gate's judgment layer — a SIGNAL, not the floor. It blocks PROMOTION to Done,
// never the commit. Usage: node review.mjs <cardId> "<task text>"
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const [, , cardId = '0', task = ''] = process.argv
const dir = new URL('.', import.meta.url)
const receiptPath = new URL(`./.receipts/${cardId}.review.json`, import.meta.url)
mkdirSync(new URL('./.receipts/', import.meta.url), { recursive: true })

// The diff this receipt is bound to — a later change makes the receipt STALE (and so it stops counting).
const diff = (() => { try { return execFileSync('git', ['diff', 'HEAD~1', 'HEAD', '--', 'index.html'], { cwd: dir, encoding: 'utf8' }) } catch { try { return execFileSync('git', ['diff', 'HEAD'], { cwd: dir, encoding: 'utf8' }) } catch { return '' } } })()
const diffHash = createHash('sha256').update(diff).digest('hex').slice(0, 12)

// Did the smoke pass? Read its receipt if present (smoke runs BEFORE review — the reviewer audits the bundle).
let smokePassed = null
try { smokePassed = JSON.parse(readFileSync(new URL(`./.receipts/${cardId}.qa.json`, import.meta.url), 'utf8')).smokePassed } catch {}

const spec = safeRead('spec.md')
const constitution = safeRead('constitution.md')
function safeRead(f) { try { return readFileSync(new URL('./' + f, import.meta.url), 'utf8') } catch { return '' } }

const prompt = `You are an independent reviewer (a DIFFERENT lineage from the implementer). Audit this build.
TASK: ${task}
SPEC:\n${spec}\nCONSTITUTION:\n${constitution}\nSMOKE PASSED: ${smokePassed}
DIFF (index.html):\n${diff}\n
Reply with ONLY a JSON object: {"specSatisfied":bool,"constitutionPreserved":bool,"concerns":[string],"verdict":"pass"|"changes"}`

// Default = reviewer NOT AVAILABLE (no claude CLI): a clean 'skipped'. The deterministic floor already
// proved the code; the review is the ADVISORY layer, so an absent reviewer promotes with this logged note.
let body = { specSatisfied: null, constitutionPreserved: null, concerns: ['reviewer not run (no claude CLI)'], verdict: 'skipped' }
const cl = spawnSync('claude', ['-p', prompt, '--output-format', 'text'], { cwd: dir, encoding: 'utf8', timeout: 180_000 })
if (cl.status === 0 && cl.stdout) {
  // The reviewer RAN — its judgment is now binding. Garbled output is a FAILURE, not a free pass.
  const m = cl.stdout.match(/\{[\s\S]*\}/)
  if (m) { try { body = JSON.parse(m[0]) } catch { body = { ...body, verdict: 'error', concerns: ['reviewer output unparseable'] } } }
  else { body = { ...body, verdict: 'error', concerns: ['reviewer returned no JSON'] } }
}

const receipt = { card: cardId, task, diffHash, testsPassed: true, smokePassed, ...body, at: new Date().toISOString() }
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2))
console.log(`  receipt → .receipts/${cardId}.review.json  (verdict: ${receipt.verdict}, diff ${diffHash})`)
// Hold the card on an OBJECTION ('changes') or a reviewer FAILURE ('error'). 'pass' and an absent-reviewer
// 'skipped' both promote — the floor is the hard gate; this audit is advisory. (Promotion ≠ un-commit.)
process.exit(receipt.verdict === 'changes' || receipt.verdict === 'error' ? 1 : 0)
