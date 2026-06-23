#!/usr/bin/env node
// board MCP — the agent's hands on the board (the "db" = board.json).
// A minimal Model Context Protocol server over stdio (newline-delimited JSON-RPC 2.0),
// no dependencies, so it's checked in and clone-runs. Claude connects via .mcp.json and
// manages the board ONLY through these tools — never by editing the file directly.
//
// The TOOL LOGIC (`call`) is exported so `node --test` can exercise it without a process;
// the stdio TRANSPORT only runs when this file is executed directly (see the guard at the
// bottom). The board path is overridable via ENSO_BOARD so tests use a temp file.
import { readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

const BOARD = new URL(process.env.ENSO_BOARD || './board.json', import.meta.url)
const read = () => { try { return JSON.parse(readFileSync(BOARD, 'utf8')).cards || [] } catch { return [] } }
const write = (cards) => writeFileSync(BOARD, JSON.stringify({ cards }, null, 2))
const ok = (text) => ({ content: [{ type: 'text', text }] })

export const TOOLS = [
  { name: 'list_cards', description: 'List every card on the board.', inputSchema: { type: 'object', properties: {} } },
  { name: 'add_card', description: 'Add a card.', inputSchema: { type: 'object', properties: { text: { type: 'string' }, status: { type: 'string', enum: ['todo', 'doing', 'done'] }, label: { type: 'string' } }, required: ['text'] } },
  { name: 'move_card', description: 'Move a card to a column (set its status).', inputSchema: { type: 'object', properties: { id: {}, status: { type: 'string', enum: ['todo', 'doing', 'done'] } }, required: ['id', 'status'] } },
  { name: 'seed', description: 'Reset the board to a small sample set.', inputSchema: { type: 'object', properties: {} } },
  { name: 'clean', description: 'Remove every card (empty board).', inputSchema: { type: 'object', properties: {} } },
]

export function call(name, args = {}) {
  const cards = read()
  if (name === 'list_cards') return ok(JSON.stringify(cards))
  if (name === 'add_card') { const id = cards.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1; cards.push({ id, text: args.text, status: args.status || 'todo', ...(args.label ? { label: args.label } : {}) }); write(cards); return ok(`added "${args.text}" (#${id})`) }
  if (name === 'move_card') { const c = cards.find((c) => String(c.id) === String(args.id)); if (!c) return ok(`no card ${args.id}`); c.status = args.status; write(cards); return ok(`moved #${args.id} → ${args.status}`) }
  if (name === 'seed') { write([{ id: 1, text: 'Draft the spec', status: 'todo' }, { id: 2, text: 'Wire the gate', status: 'doing' }, { id: 3, text: 'Ship it', status: 'todo' }]); return ok('seeded') }
  if (name === 'clean') { write([]); return ok('cleaned') }
  return ok(`unknown tool ${name}`)
}

// ── stdio transport — only when run directly (`node board-mcp.mjs`), not when imported ──
function serve() {
  const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')
  createInterface({ input: process.stdin }).on('line', (line) => {
    let req; try { req = JSON.parse(line) } catch { return }
    const { id, method, params } = req
    if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'board', version: '0.1.0' } } })
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    if (method === 'tools/call') return send({ jsonrpc: '2.0', id, result: call(params?.name, params?.arguments) })
    if (id !== undefined) send({ jsonrpc: '2.0', id, result: {} })   // ack anything else that expects a reply
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) serve()
