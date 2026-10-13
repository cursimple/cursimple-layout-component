import test from 'node:test';
import assert from 'node:assert/strict';
import {createLayoutSync} from '../plugin-packages/app-layout/ui/layout-rules.js';

const drawer = {mode: 'drawer', items: ['schedule', 'memos']};
const one = {mode: 'bottomBar', items: ['schedule', 'memos']};
const two = {mode: 'bottomBar', items: ['schedule', 'memos', 'plugins']};

function host(outcomes) {
  const sent = [];
  return {sent, send: async state => { sent.push(state); if (outcomes.shift() === false) throw new Error('refused'); }};
}

test('a failed request followed by an accepted one leaves the page showing what the host drew', async () => {
  const h = host([false, true]);
  const sync = createLayoutSync(drawer, h.send);
  sync.apply(one);
  const last = sync.apply(two);
  assert.deepEqual(sync.shown, two, 'shows the newest request while it is pending');
  await last;
  assert.deepEqual(h.sent, [one, two]);
  assert.deepEqual(sync.confirmed, two);
  assert.deepEqual(sync.shown, two);
});

test('when the newest request fails the page returns to the last accepted layout', async () => {
  const h = host([true, false]);
  const sync = createLayoutSync(drawer, h.send);
  sync.apply(one);
  await sync.apply(two);
  assert.deepEqual(sync.shown, one);
});

test('an earlier failure does not snap the page back while a newer request is pending', async () => {
  let release;
  const sent = [];
  const sync = createLayoutSync(drawer, async state => {
    sent.push(state);
    if (state === one) throw new Error('refused');
    await new Promise(resolve => { release = resolve; });
  });
  const failures = [];
  const first = sync.apply(one, ({error}) => { if (error) failures.push(sync.shown); });
  const second = sync.apply(two);
  await first;
  assert.deepEqual(failures, [two]);
  release();
  await second;
  assert.deepEqual(sync.shown, two);
});
