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

test('daily means, symptom days and explicit period comparisons do not overweight repeated entries', () => {
  const sections = buildReport([
    { ...pain, fields: { intensity: 8, symptoms: ['Fatigue'] } },
    { ...pain, id: '2', fields: { intensity: 4, symptoms: ['Fatigue'] } },
    { ...pain, id: '3', date: '2026-11-11', fields: { intensity: 2 } },
    { ...pain, id: '4', kind: 'period', fields: { flow: 'Heavy' } },
  ], { start: '', end: '' }, titles, { name: 'Zoë 李', dob: '1995-04-03' });
  assert.deepEqual(sections[0].trend, [{ date: '2026-11-10', pain: 6, period: true }, { date: '2026-11-11', pain: 2, period: false }]);
  assert.match(JSON.stringify(sections), /Fatigue: 1 days; same-day average pain 6\/10/);
  assert.match(JSON.stringify(sections), /logged period days: 6\/10/);
  assert.equal(sections[3].blocks[0].heading?.startsWith('2026-11-11'), true);
});

test('HTML report preserves Unicode, escapes patient text, and leaves missing scores absent', async () => {
  const { createReportHtml } = await import('../src/report.ts');
  const sections = buildReport([{ ...pain, fields: { intensity: '' } }], { start: '', end: '' }, titles, { name: '<script>李</script>', dob: '' });
  const html = createReportHtml(sections);
  assert.match(html, /&lt;script&gt;李&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /No pain scores recorded/);
  assert.deepEqual(sections[0].trend, []);
});

test('report groups same-day logs into four columns and shows recorded location percentages', async () => {
  const { createReportHtml } = await import('../src/report.ts');
  const sections = buildReport([pain, { ...pain, id: 'food', kind: 'food', fields: { foods: ['Rice'] }, notes: '' }], { start: '', end: '' }, titles);
  assert.equal(sections[3].dailyRows?.length, 1);
  assert.match(sections[3].dailyRows![0].pain.join(' '), /Intensity: 7\/10/);
  assert.match(sections[3].dailyRows![0].tracking.join(' '), /Rice/);
  assert.match(sections[3].dailyRows![0].relief.join(' '), /Test \(notes\)/);
  const html = createReportHtml(sections);
  assert.match(html, /<th>Pain and symptoms<\/th><th>Other tracking<\/th><th>Relief and notes<\/th>/);
  assert.match(html, /Pelvis <strong>100%<\/strong>/);
  assert.match(html, /Percentage of distinct days with pain tracking/);
  assert.doesNotMatch(html, /silhouettes|<path/);
});


test('location percentages count distinct pain-tracked days rather than entries', () => {
  const sections = buildReport([pain, { ...pain, id: 'duplicate' }, { ...pain, id: 'next', date: '2026-11-11', fields: { intensity: 3 } }], { start: '', end: '' }, titles);
  assert.deepEqual(sections[2].locations, [{ name: 'Pelvis', days: 1, percent: 50 }]);
});
