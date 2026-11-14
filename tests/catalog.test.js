import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCatalog, sanitizeInline, stripTags } from '../js/core.js';

const data = JSON.parse(readFileSync(new URL('../js/data.json', import.meta.url), 'utf8'));

test('real catalog passes validateCatalog', () => {
  assert.deepEqual(validateCatalog(data), []);
});

test('validateCatalog reports duplicate ids and missing fields', () => {
  const errors = validateCatalog([
    { id: 'a', title: 't', desc: 'd', items: [{ cmd: 'x' }] },
    { id: 'a', title: 't', desc: 'd', items: [] },
  ]);
  assert.ok(errors.some((e) => e.includes('duplicate id: a')));
  assert.ok(errors.some((e) => e.includes('a[0]') && e.includes('desc')));
});

test('sanitizing real HTML fields never loses visible text', () => {
  for (const cat of data) {
    for (const item of cat.items) {
      for (const field of ['desc', 'flags', 'warn']) {
        if (!item[field]) continue;
        const clean = stripTags(sanitizeInline(item[field]).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
        assert.equal(clean, stripTags(item[field]), `${cat.id}: ${item.cmd} [${field}]`);
      }
    }
  }
});
