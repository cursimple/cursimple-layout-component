import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ITEMS, PICKABLE, normalizeItems, toggle, move} from '../plugin-packages/app-layout/ui/layout-rules.js';

const ALL = ['schedule', 'courses', 'memos', 'components', 'plugins', 'reminders', 'settings', 'about'];

test('defaults are schedule, memos and components', () => {
  assert.deepEqual(DEFAULT_ITEMS, ['schedule', 'memos', 'components']);
  assert.deepEqual(PICKABLE, ['memos', 'components', 'courses', 'reminders', 'plugins', 'about', 'settings']);
});

test('normalize keeps schedule first and at most three middle items', () => {
  assert.deepEqual(normalizeItems(['memos', 'schedule', 'courses', 'plugins', 'about'], ALL), ['schedule', 'memos', 'courses', 'plugins']);
  assert.deepEqual(normalizeItems(['memos', 'memos'], ALL), ['schedule', 'memos']);
  assert.deepEqual(normalizeItems([], ALL), DEFAULT_ITEMS);
  assert.deepEqual(normalizeItems(null, ALL), DEFAULT_ITEMS);
});

test('unknown or host-unsupported ids are dropped', () => {
  assert.deepEqual(normalizeItems(['schedule', 'nope', 'memos'], ALL), ['schedule', 'memos']);
  assert.deepEqual(normalizeItems(['schedule', 'components', 'memos'], ALL.filter(id => id !== 'components')), ['schedule', 'memos']);
  assert.deepEqual(normalizeItems(['nope'], ['schedule', 'courses']), ['schedule', 'courses']);
});

test('turning on a fourth item bumps the last one', () => {
  const result = toggle(['schedule', 'memos', 'components', 'courses'], 'reminders');
  assert.deepEqual(result.items, ['schedule', 'memos', 'components', 'reminders']);
  assert.equal(result.bumped, 'courses');
  assert.deepEqual(toggle(['schedule', 'memos'], 'about'), {items: ['schedule', 'memos', 'about'], bumped: null, refused: false});
});

test('the last middle item cannot be turned off', () => {
  const items = ['schedule', 'memos'];
  const result = toggle(items, 'memos');
  assert.deepEqual(result.items, items);
  assert.equal(result.refused, true);
  assert.deepEqual(toggle(['schedule', 'memos', 'about'], 'memos').items, ['schedule', 'about']);
  assert.deepEqual(toggle(items, 'schedule').items, items);
});

test('move never displaces schedule', () => {
  const items = ['schedule', 'memos', 'components', 'courses'];
  assert.deepEqual(move(items, 'memos', -1), items);
  assert.deepEqual(move(items, 'schedule', 1), items);
  assert.deepEqual(move(items, 'memos', 1), ['schedule', 'components', 'memos', 'courses']);
  assert.deepEqual(move(items, 'courses', -2), ['schedule', 'courses', 'memos', 'components']);
  assert.deepEqual(move(items, 'courses', 5), items);
});
