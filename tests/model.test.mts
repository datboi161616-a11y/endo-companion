import { test } from 'node:test';
import assert from 'node:assert/strict';
import { upsert, csv, monthDays, parseBackup } from '../src/model.ts';
const entry = {date:'2026-11-11',pain:7,flow:'Light',symptoms:['Fatigue'],medications:'A, B',notes:'A "hard" day',mood:'Low',sleep:6};
test('editing a day replaces its previous record',()=>{assert.equal(upsert([entry],{...entry,pain:3}).length,1);assert.equal(upsert([entry],{...entry,pain:3})[0].pain,3)});
test('CSV escapes notes and medication commas',()=>{assert.ok(csv([entry]).includes('"A ""hard"" day"'));assert.ok(csv([entry]).includes('"A, B"'))});
test('calendar includes leap day',()=>assert.equal(monthDays(2024,1).filter(Boolean).length,29));
test('backup rejects malformed health records',()=>assert.throws(()=>parseBackup('[{"date":"bad"}]')));
test('backup round trip preserves records',()=>assert.deepEqual(parseBackup(JSON.stringify([entry])),[entry]));
