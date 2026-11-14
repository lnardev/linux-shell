import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr, sanitizeInline, stripTags, searchText } from '../js/core.js';

test('escapeHtml escapes &, < and >', () => {
  assert.equal(escapeHtml('a & <b>'), 'a &amp; &lt;b&gt;');
});

test('escapeAttr escapes & and "', () => {
  assert.equal(escapeAttr('a&"b'), 'a&amp;&quot;b');
});

const sanitizeCases = [
  ['strips dangerous tags', '<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
  ['drops attributes on allowed tags', '<b onclick="x">ok</b>', '<b>ok</b>'],
  ['keeps allowed tags', '<b>a</b> <i>b</i> <code>c</code>', '<b>a</b> <i>b</i> <code>c</code>'],
  ['keeps br', 'a<br>b', 'a<br>b'],
  ['escapes script', '<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
  ['escapes bare ampersand', 'a & b', 'a &amp; b'],
  ['empty string', '', ''],
];
for (const [name, input, expected] of sanitizeCases) {
  test(`sanitizeInline: ${name}`, () => {
    assert.equal(sanitizeInline(input), expected);
  });
}

test('stripTags removes tags', () => {
  assert.equal(stripTags('<b>hola</b> <i>mundo</i>'), 'hola mundo');
});

test('searchText excludes tags and is lowercase', () => {
  const text = searchText({ cmd: 'ls -la', desc: 'Lista', flags: '<b>-a</b> todo' });
  assert.equal(text, 'ls -la lista -a todo');
  assert.ok(!text.includes('<b>'));
});

test('searchText works without flags', () => {
  assert.equal(searchText({ cmd: 'pwd', desc: 'Ruta' }), 'pwd ruta');
});
