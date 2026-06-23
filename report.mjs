// The cycle report — a self-contained zen page summarizing THIS cycle from the board.
// Lives in its own file (not inside server.mjs) and is checked by the gate, so it can't drift.
// One closing ensō (arc = % done), the count, the quiet list of what shipped, one weighted line.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function report(cards) {
  const done = cards.filter((c) => c.status === 'done')
  const total = cards.length
  const frac = total ? done.length / total : 0
  const C = 2 * Math.PI * 15, GAP = C * 0.16            // same ensō geometry as the board
  const arc = `${frac * (C - GAP)} ${C}`, track = `${C - GAP} ${C}`
  const line = total === 0 ? 'Nothing was set down this cycle. The page is still blank.'
    : frac === 1 ? 'The circle closes. Every card came to rest.'
    : frac === 0 ? 'The circle is open. All of it still waits.'
    : `${done.length} of ${total} came to rest. The arc is still inking.`
  const shipped = done.length
    ? `<ul class="shipped">${done.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>`
    : `<p class="empty">Nothing has settled this cycle.</p>`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The cycle</title>
<link rel="icon" href="data:,">
<style>
  :root { --bg:#fbfbfa; --fg:#1a1a1a; --muted:#9b9b97; --line:#ececea; --accent:#e8553e; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    background:var(--bg); color:var(--fg);
    font:16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing:antialiased;
    display:flex; justify-content:center; padding:14vh 24px;
  }
  main { width:100%; max-width:560px; text-align:center; }
  .enso { width:120px; height:120px; margin:0 auto 40px; display:block; }
  .enso circle { fill:none; stroke-width:2; stroke-linecap:round; }
  .enso .track { stroke:var(--line); }
  .enso .arc { stroke:var(--accent); }
  .count { font-size:13px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
  .count b { color:var(--fg); font-weight:600; }
  .label { font-size:13px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin:56px 0 20px; }
  .shipped { list-style:none; }
  .shipped li { color:var(--muted); text-decoration:line-through; padding:10px 0; border-bottom:1px solid var(--line); }
  .shipped li:last-child { border-bottom:none; }
  .empty { color:var(--muted); opacity:.65; font-size:14px; }
  .line { color:var(--fg); margin-top:56px; line-height:1.7; }
  .back { display:inline-block; margin-top:40px; font-size:13px; color:var(--muted); text-decoration:none; transition:color .15s ease-out; }
  .back:hover { color:var(--accent); }
</style>
</head>
<body>
  <main>
    <svg class="enso" viewBox="0 0 36 36" role="img" aria-label="${done.length} of ${total} done">
      <circle class="track" cx="18" cy="18" r="15" transform="rotate(-45 18 18)" style="stroke-dasharray:${track}"/>
      <circle class="arc"   cx="18" cy="18" r="15" transform="rotate(-45 18 18)" style="stroke-dasharray:${arc}"/>
    </svg>
    <p class="count"><b>${done.length}</b> done&nbsp;/&nbsp;${total}</p>
    <p class="label">What shipped</p>
    ${shipped}
    <p class="line">${line}</p>
    <a class="back" href="/">&larr; back to the board</a>
  </main>
</body>
</html>`
}
