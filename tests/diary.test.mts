import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createLog, migrateEntries, parseDiary, saveLog} from '../src/diary.ts';

test('keeps more than one log on the same day and replaces an edited log by ID', () => {
  const first = createLog('pain', '2026-11-12', '08:05');
  const second = createLog('pain', first.date, '18:30');
  const logs = saveLog(saveLog([first], second), {...first, notes: 'Updated'});
  assert.deepEqual(logs.map(item => item.notes), ['', 'Updated']);
  assert.deepEqual(parseDiary(JSON.stringify(logs)), logs);
});

test('migrates prior pain, flow, symptoms and notes without losing their original values', () => {
  const [pain, period] = migrateEntries([{
    date: '2026-11-12', pain: 5, flow: 'Medium', symptoms: ['Cramps'], medications: 'Heat',
    notes: 'After dinner', mood: 'Good', sleep: 8,
  }]);
  assert.equal(pain.fields.intensity, 5);
  assert.equal(pain.notes, 'After dinner');
  assert.equal(period.fields.flow, 'Medium');
});

test('rejects invalid dates and duplicate identifiers when loading a diary', () => {
  const log = createLog('bowel', '2026-11-12', '08:30');
  assert.throws(() => parseDiary(JSON.stringify([{...log, date: '2026-02-30'}])));
  assert.throws(() => parseDiary(JSON.stringify([log, log])));
});
