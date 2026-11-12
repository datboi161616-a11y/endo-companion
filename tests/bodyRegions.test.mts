import assert from 'node:assert/strict';
import {test} from 'node:test';
import {bodyRegions, toggleBodyRegion} from '../src/bodyRegions.ts';

test('body selection preserves custom and hidden-side locations when toggling', () => {
  const initial = ['Custom pain location', 'Lower back'];
  const selected = toggleBodyRegion(initial, 'Abdomen');
  assert.deepEqual(selected, [...initial, 'Abdomen']);
  assert.deepEqual(toggleBodyRegion(selected, 'Lower back'), ['Custom pain location', 'Abdomen']);
  assert.deepEqual(initial, ['Custom pain location', 'Lower back']);
});

test('both body sides have unique selectable regions and valid path data', () => {
  for (const side of ['front', 'back']) {
    const regions = bodyRegions.filter(region => region.side === side);
    assert.ok(regions.length > 8);
    assert.equal(new Set(regions.map(region => region.name)).size, regions.length);
    assert.ok(regions.every(region => /^M.+Z$/.test(region.path)));
  }
});
