import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHash, validatePlaybooks } from '../js/core.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8'));
const catalog = read('data.json');
const playbooks = read('playbooks.json');

test('real playbooks.json passes validatePlaybooks', () => {
  assert.deepEqual(validatePlaybooks(playbooks), []);
});

test('playbooks.json has the 5 planned playbooks', () => {
  assert.deepEqual(playbooks.map((p) => p.id), ['hardening', 'deploy-node', 'servidor-lento', 'swap-vps', 'backup-mysql']);
});

test('playbook ids never collide with category ids', () => {
  const catIds = new Set(catalog.map((c) => c.id));
  for (const pb of playbooks) assert.ok(!catIds.has(pb.id), pb.id);
});

test('every danger step has a non-empty warn', () => {
  for (const pb of playbooks) for (const s of pb.steps) if (s.danger) assert.ok(s.warn?.trim(), `${pb.id}: ${s.title}`);
});

const cases = [
  ['playbook', '#pb-hardening', { type: 'playbook', id: 'hardening' }],
  ['category', '#ufw', { type: 'category', id: 'ufw' }],
  ['command (hyphenated cat)', '#c-bases-datos-2', { type: 'command', cat: 'bases-datos', index: 1 }],
  ['unknown category', '#c-inexistente-99', null],
  ['index out of range', '#c-ufw-999', null],
  ['index zero', '#c-ufw-0', null],
  ['unknown playbook', '#pb-nope', null],
  ['empty hash', '', null],
];
for (const [name, hash, expected] of cases) {
  test(`parseHash: ${name}`, () => {
    assert.deepEqual(parseHash(hash, catalog, playbooks), expected);
  });
}
