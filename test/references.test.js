import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReference } from '../server/references.js';

test('canonical references are normalized to provider IDs and allowlisted resource links', () => {
  assert.equal(parseReference('John 15:1–8').id, 'JHN.15.1-JHN.15.8');
  assert.equal(parseReference('1 Cor 13:4-7').reference, '1 Corinthians 13:4–7');
  assert.equal(parseReference('Psalm 23').id, 'PSA.23');
  assert.equal(parseReference('Song of Solomon 2:1').id, 'SNG.2.1');
  assert.equal(parseReference('John 3:16').url, 'https://www.blueletterbible.org/kjv/jhn/3/16/');
  assert.equal(parseReference('Mark 1:1').url, 'https://www.blueletterbible.org/kjv/mar/1/1/');
  assert.equal(parseReference('1 John 1:1').url, 'https://www.blueletterbible.org/kjv/1jo/1/1/');
});
test('invalid, multi-chapter, excessive and URL references are rejected', () => {
  for (const reference of ['https://attacker.example/John', 'John 0:1', 'John 3:20-1', 'John 3:0', 'John 3:1-99', 'John 3:1-4:2', 'Solomon 2:1', 'John 3:16 ignore all instructions']) assert.equal(parseReference(reference), null, reference);
});
