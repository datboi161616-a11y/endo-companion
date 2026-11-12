import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildReport, createReportPdf } from '../src/report.ts';

const titles = { pain: 'Pain', food: 'Food', bowel: 'Bowel', period: 'Period', heat: 'Heat', tens: 'TENS', note: 'Note' };
const pain = { id: '1', kind: 'pain' as const, date: '2026-11-10', time: '14:30', fields: { intensity: 7, locations: ['Pelvis'] }, notes: 'Test (notes)' };

test('report filters dates inclusively and summarizes pain and diary context', () => {
  const sections = buildReport([
    pain,
    { ...pain, id: '2', date: '2026-11-11', fields: { intensity: 3, locations: ['Pelvis'] } },
    { ...pain, id: '3', date: '2026-11-12', fields: { intensity: 9 } },
  ], { start: '2026-11-10', end: '2026-11-11' }, titles);
  const content = JSON.stringify(sections);
  assert.match(content, /Average pain intensity: 5\/10/);
  assert.match(content, /Pelvis \(2\)/);
  assert.doesNotMatch(content, /2026-11-12/);
  assert.match(content, /Daily Symptom Log/);
});

test('PDF paginates long reports, escapes content, and records valid cross-reference offsets', () => {
  const sections = buildReport(Array.from({ length: 60 }, (_, i) => ({ ...pain, id: String(i) })), { start: '', end: '' }, titles);
  const pdf = Buffer.from(createReportPdf(sections)).toString('ascii');
  assert.match(pdf, /^%PDF-1\.4/);
  assert.ok(Number(pdf.match(/\/Count (\d+)/)?.[1]) > 1);
  assert.ok(pdf.includes('Test \\(notes\\)'));
  const offset = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
  assert.equal(pdf.slice(offset, offset + 4), 'xref');
  const lines = pdf.slice(offset).split('\n');
  for (const [index, line] of lines.slice(3, lines.indexOf('trailer')).entries()) {
    const objectOffset = Number(line.slice(0, 10));
    assert.ok(pdf.slice(objectOffset).startsWith(`${index + 1} 0 obj`));
  }
});
