// Embed the COMPLETE real source of every load-bearing file into site/index.html, so the tutorial page
// is genuinely self-contained: "The complete source" appendix holds the whole artifact, copyable, with
// nothing fetched at runtime. Re-run after changing any embedded file:  node site/embed-sources.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));   // …/enso/site
const root = resolve(here, "..");                        // …/enso  (the repo root)

// ordered to mirror the teaching arc: the board → the loop → the tools → the floor → the release gate →
// the report → the spine → the taste → the conductor → the history builder.
const FILES = [
  ["index.html",                              "the board — the whole UI + client logic",        "html"],
  ["server.mjs",                              "the agent build loop (drag → claude -p → floor)", "js"],
  ["board-mcp.mjs",                           "the board's MCP tools + JSON-RPC transport",      "js"],
  [".mcp.json",                               "how claude -p discovers the board's tools",       "json"],
  ["gate.mjs",                                "the deterministic commit floor",                  "js"],
  ["test/board.test.mjs",                     "behavior tests — the board + MCP",                "js"],
  ["test/gate.test.mjs",                      "behavior tests — the gate's rules",               "js"],
  [".githooks/pre-commit",                    "the hook that arms the floor on every commit",    "sh"],
  ["qa.mjs",                                  "the release gate — headless smoke + screenshot",  "js"],
  ["review.mjs",                              "the release gate — a diff-bound receipt",         "js"],
  ["report.mjs",                              "the cycle report — a closing ensō",               "js"],
  ["spec.md",                                 "the spine — user stories + acceptance scenarios", "md"],
  ["constitution.md",                         "the spine — the rules the reviewer audits",       "md"],
  ["plan.md",                                 "the spine — the plan",                            "md"],
  ["tasks.md",                                "the spine — where the board's cards come from",   "md"],
  [".claude/skills/enso-design/SKILL.md",     "the taste — the Skill the agent inherits",        "md"],
  ["scripts/conduct.mjs",                     "the conductor — the loop runs itself",            "js"],
  ["course/build-history.sh",                 "builds the ten stage tags into ./.built",         "sh"],
];

const files = [];
for (const [path, label, lang] of FILES) {
  const abs = resolve(root, path);
  if (!existsSync(abs)) { console.warn("  skip (missing): " + path); continue; }
  files.push({ path, label, lang, code: readFileSync(abs, "utf8") });
}

// inline as JSON inside a <script type="application/json">. Escape every '<' so an embedded </script>
// (index.html has real <script> tags) can't break out; JSON.parse decodes < back to '<'.
const json = JSON.stringify({ files }).replace(/</g, "\\u003c");
const idxPath = resolve(here, "index.html");
let html = readFileSync(idxPath, "utf8");
const re = /(<script id="enso-sources" type="application\/json">)([\s\S]*?)(<\/script>)/;
if (!re.test(html)) { console.error("marker <script id=\"enso-sources\"> not found in index.html"); process.exit(1); }
// function replacer — a STRING replacement would interpret $1/$2/$' in the embedded source (shell vars!)
// as capture-group backreferences and corrupt the JSON. The function form inserts json verbatim.
html = html.replace(re, (_m, p1, _p2, p3) => p1 + json + p3);
writeFileSync(idxPath, html);

const bytes = files.reduce((n, f) => n + f.code.length, 0);
console.log(`embedded ${files.length} files · ${(bytes / 1024).toFixed(0)} KB of source · index.html now ${(html.length / 1024).toFixed(0)} KB`);
