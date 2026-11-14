# AGENTS.md

## What this repo is
Static HTML page (`index.html`) with separate CSS (`styles.css`) and JS (`app.js`) files — a searchable Linux/VPS command cheat-sheet ("Autogestión de un VPS"). The cheat-sheet content lives in `js/data.json` and is loaded via `fetch()`, so the site requires an HTTP server (local or GitHub Pages). No build tool, no dependencies, no CI. `package.json` only declares `type: module` and `npm test` (`node --test`).

## Running / verifying changes
- Serve the folder over HTTP and open http://localhost:8000: python -m http.server 8000 (or GitHub Pages). file:// no longer works — the browser blocks fetch() of js/data.json by CORS.
- Run `node --test` for the logic/data tests (`tests/`), then verify visually in the browser.

## Content structure (read before editing)
- All cheat-sheet content lives in `js/data.json`.
- `js/data.json` is a list of categories: `{ id, title, desc, items: [...] }`.
- Each item: `{ cmd, desc, flags?, warn?, danger? }`.
  - `flags`: optional HTML string shown in monospace below the description (use `<b>` for emphasis, e.g. explaining flags).
  - `warn`: optional string shown with a red ⚠ warning line.
  - `danger: true`: adds red-tinted border/styling to the card (for destructive commands).
- `js/core.js` holds the pure logic (sanitizing, vars, validation, script export, hash parsing) and is unit-tested; `js/playbooks-ui.js` renders playbooks.
- `js/playbooks.json` is a list of `{ id, title, desc, time?, vars: [{name,label,default?}], steps: [{title,cmd,desc,warn?,danger?}] }`. Commands use `{{var}}` placeholders declared in `vars`; `danger` steps require `warn`; playbook ids must not equal category ids. Never put secrets in `default` (values persist in localStorage).
- The page is rendered entirely client-side by JS that reads the JSON and builds the TOC nav + cards — do not hand-edit generated DOM/HTML sections (hero, cards, TOC), edit `js/data.json` instead.
- CSS is in `styles.css`, linked from `index.html`.
- Content language is Spanish — keep new entries in Spanish for consistency.

## Gotchas
- The page fetches js/data.json — it won't render when opened via file://. Serve over HTTP.
- The footer category count is computed from `js/data.json` (`#cat-count`); don't edit it by hand.
- `cmd` is escaped via `escapeHtml`/`escapeAttr`. `desc`, `flags`, `warn` and titles go through `sanitizeInline`: only bare `<b>`, `<i>`, `<code>`, `<br>` survive, everything else is shown as text. Don't pre-escape.
- Search filtering matches `cmd + desc + flags` (tags stripped, lowercased) via the `data-search` attribute.
- Deep links: `#pb-<id>` (playbook), `#c-<category>-<n>` (command, 1-based), `#<category>`.
