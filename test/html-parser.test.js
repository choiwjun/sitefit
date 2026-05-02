import test from 'node:test';
import assert from 'node:assert/strict';

import { attr, findTags } from '../src/diagnosis/html-parser.js';

test('parses quoted unquoted boolean and mixed-case attributes', () => {
  const tag = '<INPUT ID=name type=email aria-label=Email required DISABLED data-score="42">';

  assert.equal(attr(tag, 'id'), 'name');
  assert.equal(attr(tag, 'TYPE'), 'email');
  assert.equal(attr(tag, 'aria-label'), 'Email');
  assert.equal(attr(tag, 'required'), '');
  assert.equal(attr(tag, 'disabled'), '');
  assert.equal(attr(tag, 'data-score'), '42');
});

test('finds opening tags case-insensitively', () => {
  const tags = findTags('<DIV><img src=/a.jpg><IMG src="/b.jpg"></DIV>', 'img');

  assert.equal(tags.length, 2);
  assert.equal(attr(tags[0], 'src'), '/a.jpg');
  assert.equal(attr(tags[1], 'src'), '/b.jpg');
});
