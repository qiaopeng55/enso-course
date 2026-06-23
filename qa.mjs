#!/usr/bin/env node
// qa.mjs — the smoke. ONE thin headless-browser check that the work actually RENDERS and behaves:
// page loads, the three columns render, the theme toggle (if present) flips data-theme. It writes a
// screenshot + a receipt. Smoke is RENDERING proof, not correctness — it audits, it doesn't block the
// commit. Optional by design: if Playwright isn't installed, it records that and exits 0.
// Usage: node qa.mjs <cardId> [url]   (url defaults to the local file)
import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const [, , cardId = '0', url] = process.argv
const target = url || new URL('./index.html', import.meta.url).href
mkdirSync(new URL('./.receipts/', import.meta.url), { recursive: true })
const shot = new URL(`./.receipts/${cardId}.png`, import.meta.url)
const receiptPath = new URL(`./.receipts/${cardId}.qa.json`, import.meta.url)

let diffHash = '0'
try { diffHash = createHash('sha256').update(execFileSync('git', ['diff', 'HEAD'], { encoding: 'utf8' })).digest('hex').slice(0, 12) } catch {}

function write(receipt) { writeFileSync(receiptPath, JSON.stringify({ card: cardId, diffHash, at: new Date().toISOString(), ...receipt }, null, 2)) }

let chromium
try { ({ chromium } = await import('playwright')) }
catch {
  write({ checks: [], smokePassed: null, note: 'playwright not installed — smoke skipped (it is optional)' })
  console.log('  smoke skipped — playwright not installed (optional layer)')
  process.exit(0)
}

const browser = await chromium.launch()
const page = await browser.newPage()
const checks = []
try {
  await page.goto(target, { waitUntil: 'load' })
  const columns = await page.locator('.col, [data-status]').count()
  checks.push({ name: 'columns render', ok: columns > 0 })

  const toggle = page.locator('.theme, [data-theme-toggle], #theme')
  if (await toggle.count()) {
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    await toggle.first().click()
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    checks.push({ name: 'theme toggle flips data-theme', ok: before !== after })
  }
  await page.screenshot({ path: fileURLToPath(shot) })
  const smokePassed = checks.every((c) => c.ok)
  write({ checks, shot: `.receipts/${cardId}.png`, smokePassed })
  console.log(`  smoke ${smokePassed ? 'passed' : 'FAILED'} → .receipts/${cardId}.qa.json`)
  await browser.close()
  process.exit(smokePassed ? 0 : 1)
} catch (e) {
  await browser.close()
  write({ checks, smokePassed: false, note: 'smoke error: ' + e.message })
  process.exit(1)
}
function fileURLToPath(u) { return decodeURIComponent(u.pathname) }
