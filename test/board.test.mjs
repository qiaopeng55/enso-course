// Behavior floor for the board tools (the MCP logic). Proves spec scenarios S1, S5, and persistence.
// We point the board at a temp file via ENSO_BOARD, then import the tool logic directly — no process.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let dir, board, call
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'enso-board-'))
  board = join(dir, 'board.json')
  process.env.ENSO_BOARD = board          // must be set BEFORE importing the module
  ;({ call } = await import('../board-mcp.mjs'))
})
after(() => rmSync(dir, { recursive: true, force: true }))

const text = (r) => r.content[0].text

test('S1 · add_card creates a card and persists it', () => {
  call('clean')
  call('add_card', { text: 'add dark mode' })
  const cards = JSON.parse(text(call('list_cards')))
  assert.equal(cards.length, 1)
  assert.equal(cards[0].text, 'add dark mode')
  assert.equal(cards[0].status, 'todo')                       // defaults to todo
  assert.ok(existsSync(board))                                // persisted to disk
  assert.equal(JSON.parse(readFileSync(board, 'utf8')).cards[0].text, 'add dark mode')
})

test('add_card assigns monotonic ids (max + 1)', () => {
  call('clean')
  call('add_card', { text: 'one' })
  call('add_card', { text: 'two' })
  const cards = JSON.parse(text(call('list_cards')))
  assert.deepEqual(cards.map((c) => c.id), [1, 2])
})

test('S5 · move_card changes status through the tool, not a raw write', () => {
  call('clean')
  call('add_card', { text: 'ship it' })
  const r = call('move_card', { id: 1, status: 'doing' })
  assert.match(text(r), /moved #1 → doing/)
  assert.equal(JSON.parse(text(call('list_cards')))[0].status, 'doing')
})

test('move_card on a missing id is a no-op message, not a crash', () => {
  call('clean')
  assert.match(text(call('move_card', { id: 999, status: 'done' })), /no card 999/)
})

test('seed loads sample cards; clean empties the board', () => {
  call('seed')
  assert.ok(JSON.parse(text(call('list_cards'))).length > 0)
  call('clean')
  assert.equal(JSON.parse(text(call('list_cards'))).length, 0)
})

test('persistence · a fresh read sees what a prior write stored', () => {
  call('clean')
  call('add_card', { text: 'survives reboot', status: 'done' })
  // simulate a "reboot": the data lives in board.json, independent of any in-memory state
  const onDisk = JSON.parse(readFileSync(board, 'utf8')).cards
  assert.equal(onDisk[0].text, 'survives reboot')
  assert.equal(onDisk[0].status, 'done')
})
