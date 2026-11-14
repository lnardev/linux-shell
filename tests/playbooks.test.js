import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractVars, applyVars, validatePlaybooks, toScript } from '../js/core.js';

test('extractVars returns unique names in order', () => {
  assert.deepEqual(extractVars('adduser {{usuario}} && chown {{usuario}} {{ruta}}'), ['usuario', 'ruta']);
});

test('extractVars returns [] when there are no placeholders', () => {
  assert.deepEqual(extractVars('ls -la'), []);
});

test('applyVars inserts values literally (no $ pattern expansion)', () => {
  assert.equal(applyVars('echo {{x}}', { x: 'a&b $& "q" <t>' }), 'echo a&b $& "q" <t>');
});

test('applyVars keeps {{var}} visible when value is empty or missing', () => {
  assert.equal(applyVars('ssh {{usuario}}@{{host}}', { usuario: '' }), 'ssh {{usuario}}@{{host}}');
});

const base = {
  id: 'pb', title: 'T', desc: 'D', time: '5 min',
  vars: [{ name: 'usuario', label: 'Usuario', default: 'deploy' }],
  steps: [{ title: 'S', cmd: 'adduser {{usuario}}', desc: 'd' }],
};

test('validatePlaybooks accepts a valid playbook', () => {
  assert.deepEqual(validatePlaybooks([base]), []);
});

test('validatePlaybooks flags undeclared variable with playbook id', () => {
  const bad = { ...base, steps: [{ title: 'S', cmd: 'rm {{otra}}', desc: 'd' }] };
  const errors = validatePlaybooks([bad]);
  assert.ok(errors.some((e) => e.includes('pb') && e.includes('otra')));
});

test('validatePlaybooks flags duplicate ids and missing step fields', () => {
  const errors = validatePlaybooks([base, { ...base, steps: [{ title: 'S' }] }]);
  assert.ok(errors.some((e) => e.includes('duplicate id: pb')));
  assert.ok(errors.some((e) => e.includes('cmd')));
});

test('validatePlaybooks flags danger step without warn', () => {
  const bad = { ...base, steps: [{ title: 'S', cmd: 'x', desc: 'd', danger: true }] };
  assert.ok(validatePlaybooks([bad]).some((e) => e.includes('warn')));
});

test('toScript builds a strict bash script with applied vars', () => {
  const script = toScript(base, { usuario: 'ana' });
  assert.ok(script.startsWith('#!/usr/bin/env bash\nset -euo pipefail\n'));
  assert.ok(script.includes('# 1. S\nadduser ana'));
});

test('toScript leaves danger steps commented out with PELIGRO notice', () => {
  const pb = { ...base, steps: [{ title: 'Borrar', cmd: 'rm -rf /x', desc: 'd', danger: true, warn: 'irreversible' }] };
  const script = toScript(pb, {});
  assert.ok(script.includes('# ⚠ PELIGRO: irreversible\n# rm -rf /x'));
  assert.ok(!script.split('\n').includes('rm -rf /x'));
});

import { readStored, writeStored } from '../js/core.js';

const throwing = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('readStored returns fallback when storage throws', () => {
  assert.deepEqual(readStored(throwing, 'k', { a: 1 }), { a: 1 });
});

test('readStored returns fallback on corrupt JSON', () => {
  assert.deepEqual(readStored({ getItem: () => '{oops' }, 'k', []), []);
});

test('writeStored does not throw when storage throws and round-trips otherwise', () => {
  assert.doesNotThrow(() => writeStored(throwing, 'k', { a: 1 }));
  const mem = new Map();
  const ok = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  writeStored(ok, 'k', { a: 2 });
  assert.deepEqual(readStored(ok, 'k', null), { a: 2 });
});
