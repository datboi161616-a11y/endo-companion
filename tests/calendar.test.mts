import assert from 'node:assert/strict';
import {test} from 'node:test';
import {calendarDates} from '../src/model.ts';

test('calendar shows adjacent dates to complete full weeks', () => {
  const november = calendarDates(2026, 10);
  assert.equal(november.length, 35);
  assert.equal(november[0], '2026-11-01');
  assert.equal(november.at(-1), '2026-12-05');

  const january = calendarDates(2026, 0);
  assert.equal(january[0], '2025-12-28');
  assert.equal(january.at(-1), '2026-01-31');
});
