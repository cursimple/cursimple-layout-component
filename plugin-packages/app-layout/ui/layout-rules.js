// Bottom bar rules shared by the page and tests. The host appends "me" and validates again.
export const DEFAULT_ITEMS = ['schedule', 'memos', 'components'];
export const PICKABLE = ['memos', 'components', 'courses', 'reminders', 'plugins', 'about', 'settings'];
export const MAX_MIDDLE = 3;

/** Bar items the host can draw: schedule first, then 1–3 known destinations. */
export function normalizeItems(saved, destinations) {
  const allowed = new Set(destinations || ['schedule', ...PICKABLE]);
  const pick = ids => [...new Set(ids)].filter(id => PICKABLE.includes(id) && allowed.has(id)).slice(0, MAX_MIDDLE);
  let middle = pick(Array.isArray(saved) ? saved : []);
  if (!middle.length) middle = pick(DEFAULT_ITEMS);
  if (!middle.length) middle = pick(PICKABLE).slice(0, 1);
  return ['schedule', ...middle];
}

/** Turns [id] on or off. A fourth middle item bumps the last one; the last middle item stays. */
export function toggle(items, id) {
  if (id === 'schedule' || !PICKABLE.includes(id)) return {items, bumped: null, refused: true};
  const middle = items.slice(1);
  if (middle.includes(id)) {
    if (middle.length <= 1) return {items, bumped: null, refused: true};
    return {items: items.filter(item => item !== id), bumped: null, refused: false};
  }
  const bumped = middle.length >= MAX_MIDDLE ? middle[middle.length - 1] : null;
  const kept = bumped ? middle.slice(0, -1) : middle;
  return {items: ['schedule', ...kept, id], bumped, refused: false};
}

/** Moves [id] by [delta] places; schedule never moves and nothing passes it. */
export function move(items, id, delta) {
  const from = items.indexOf(id);
  if (from < 1) return items;
  const to = from + delta;
  if (to < 1 || to > items.length - 1 || to === from) return items;
  const next = items.slice();
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/**
 * Sends layout requests one at a time. While any is pending the page shows the newest request;
 * once none are, it shows what the host last accepted, so a failure can never leave the page and
 * the host drawing different layouts.
 */
export function createLayoutSync(initial, send) {
  let confirmed = initial;
  let latest = initial;
  let pending = 0;
  let busy = Promise.resolve();
  return {
    get confirmed() { return confirmed; },
    get shown() { return pending ? latest : confirmed; },
    /** Takes a state read from the host as accepted. */
    accept(state) { confirmed = state; latest = state; },
    apply(next, onSettle) {
      latest = next;
      pending++;
      busy = busy.then(async () => {
        let error = null;
        try { await send(next); confirmed = next; } catch (caught) { error = caught; }
        pending--;
        onSettle?.({state: next, error});
      });
      return busy;
    },
  };
}
