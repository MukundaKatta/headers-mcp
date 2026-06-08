import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parse, stringify } from '../src/server.js';

test('parses single-line headers', () => {
  const r = parse('Content-Type: application/json\nContent-Length: 42');
  assert.equal(r['content-type'], 'application/json');
  assert.equal(r['content-length'], '42');
});

test('CRLF separators', () => {
  const r = parse('A: 1\r\nB: 2');
  assert.equal(r['a'], '1');
  assert.equal(r['b'], '2');
});

test('set-cookie is always an array', () => {
  const r = parse('Set-Cookie: a=1');
  assert.deepEqual(r['set-cookie'], ['a=1']);
});

test('multiple set-cookies collect', () => {
  const r = parse('Set-Cookie: a=1\nSet-Cookie: b=2');
  assert.deepEqual(r['set-cookie'], ['a=1', 'b=2']);
});

test('repeated non-cookie header becomes array', () => {
  const r = parse('X-Trace: 1\nX-Trace: 2\nX-Trace: 3');
  assert.deepEqual(r['x-trace'], ['1', '2', '3']);
});

test('lowercases names', () => {
  const r = parse('CONTENT-TYPE: text/html');
  assert.equal(r['content-type'], 'text/html');
  assert.equal(r['CONTENT-TYPE'], undefined);
});

test('stringify round-trips', () => {
  const orig = { 'content-type': 'application/json', 'set-cookie': ['a=1', 'b=2'] };
  const s = stringify(orig);
  const back = parse(s);
  assert.deepEqual(back, orig);
});

test('stringify emits a single line for a string value', () => {
  assert.equal(stringify({ 'content-type': 'text/html' }), 'content-type: text/html');
});

test('stringify uses CRLF between lines', () => {
  assert.equal(stringify({ a: '1', b: '2' }), 'a: 1\r\nb: 2');
});

test('parse keeps the value after the first colon only', () => {
  const r = parse('Location: http://example.com/x:y');
  assert.equal(r['location'], 'http://example.com/x:y');
});

test('parse trims surrounding whitespace from name and value', () => {
  const r = parse('  X-Foo  :   bar  ');
  assert.equal(r['x-foo'], 'bar');
});

test('parse skips blank and colon-less lines', () => {
  const r = parse('\nnot-a-header\nA: 1\n   \n');
  assert.deepEqual(r, { a: '1' });
});

test('parse keeps empty header values', () => {
  const r = parse('X-Empty:');
  assert.equal(r['x-empty'], '');
});
