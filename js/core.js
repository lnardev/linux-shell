const ALLOWED_TAG = /<(\/?)(b|i|code)(?:\s[^>]*)?>|<br\s*\/?>/gi;

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Escapes everything except bare <b>, <i>, <code> and <br>; attributes are dropped. */
export function sanitizeInline(html) {
  let out = '';
  let last = 0;
  for (const m of html.matchAll(ALLOWED_TAG)) {
    out += escapeHtml(html.slice(last, m.index));
    out += m[0].toLowerCase().startsWith('<br') ? '<br>' : `<${m[1]}${m[2].toLowerCase()}>`;
    last = m.index + m[0].length;
  }
  return out + escapeHtml(html.slice(last));
}

export function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

export function searchText(item) {
  return stripTags(`${item.cmd} ${item.desc} ${item.flags ?? ''}`)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Returns a list of human-readable errors; empty when the catalog is valid. */
export function validateCatalog(data) {
  const errors = [];
  const ids = new Set();
  for (const cat of data) {
    for (const field of ['id', 'title', 'desc']) {
      if (!cat[field]) errors.push(`${cat.id ?? '?'}: missing ${field}`);
    }
    if (ids.has(cat.id)) errors.push(`duplicate id: ${cat.id}`);
    ids.add(cat.id);
    (cat.items ?? []).forEach((item, i) => {
      for (const field of ['cmd', 'desc']) {
        if (!item[field]) errors.push(`${cat.id}[${i}]: missing ${field}`);
      }
    });
  }
  return errors;
}

const VAR_PATTERN = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;

export function extractVars(cmd) {
  return [...new Set([...cmd.matchAll(VAR_PATTERN)].map((m) => m[1]))];
}

/** Replaces {{var}} with its value; empty or missing values stay visible as {{var}}. */
export function applyVars(cmd, values) {
  return cmd.replace(VAR_PATTERN, (whole, name) => (values[name] ? values[name] : whole));
}

/** Returns a list of human-readable errors; empty when the playbooks are valid. */
export function validatePlaybooks(playbooks) {
  const errors = [];
  const ids = new Set();
  for (const pb of playbooks) {
    for (const field of ['id', 'title', 'desc']) {
      if (!pb[field]) errors.push(`${pb.id ?? '?'}: missing ${field}`);
    }
    if (ids.has(pb.id)) errors.push(`duplicate id: ${pb.id}`);
    ids.add(pb.id);
    const declared = new Set((pb.vars ?? []).map((v) => v.name));
    (pb.steps ?? []).forEach((step, i) => {
      const where = `${pb.id}.steps[${i}]`;
      for (const field of ['title', 'cmd', 'desc']) {
        if (!step[field]) errors.push(`${where}: missing ${field}`);
      }
      if (step.danger && !step.warn) errors.push(`${where}: danger step needs warn`);
      for (const name of extractVars(step.cmd ?? '')) {
        if (!declared.has(name)) errors.push(`${where}: undeclared variable ${name}`);
      }
    });
  }
  return errors;
}

export function toScript(playbook, values) {
  const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', '', `# ${playbook.title}`, ''];
  playbook.steps.forEach((step, i) => {
    lines.push(`# ${i + 1}. ${step.title}`);
    if (step.danger) lines.push(`# ⚠ PELIGRO: ${step.warn}`);
    const cmd = applyVars(step.cmd, values);
    lines.push(step.danger ? cmd.split('\n').map((l) => `# ${l}`).join('\n') : cmd, '');
  });
  return lines.join('\n');
}

export function readStored(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw === null || raw === undefined ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStored(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): state stays in memory only */
  }
}

/** Resolves a location hash to a target that exists, or null. Command anchors are 1-based: #c-<cat>-<n>. */
export function parseHash(hash, catalog, playbooks) {
  const id = hash.replace(/^#/, '');
  if (id.startsWith('pb-')) {
    const pbId = id.slice(3);
    return playbooks.some((p) => p.id === pbId) ? { type: 'playbook', id: pbId } : null;
  }
  const cmdMatch = /^c-(.+)-(\d+)$/.exec(id);
  if (cmdMatch) {
    const cat = catalog.find((c) => c.id === cmdMatch[1]);
    const index = Number(cmdMatch[2]) - 1;
    return cat && index >= 0 && index < cat.items.length ? { type: 'command', cat: cat.id, index } : null;
  }
  return catalog.some((c) => c.id === id) ? { type: 'category', id } : null;
}
