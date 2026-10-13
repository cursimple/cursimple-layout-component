import {materialIcon as icon} from './material-icons.js';
import {DEFAULT_ITEMS, PICKABLE, normalizeItems, toggle, move, createLayoutSync} from './layout-rules.js';

const sdk = window.CurSimpleComponent;
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
const LABELS = {schedule:'课表', courses:'管理列表', memos:'备忘录', components:'组件', plugins:'插件', reminders:'提醒', settings:'设置', about:'关于'};
const STORE_KEY = 'app-layout.items';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const caps = sdk?.capabilities?.layouts;
const destinations = Array.isArray(caps?.destinations) ? caps.destinations : null;
let mode = 'drawer';
let items = normalizeItems(readSaved(), destinations);
let otherOwner = false;
let notice = null;
let expanded = null;
const sync = createLayoutSync({mode, items}, state =>
  sdk.request('layout.apply', state.mode === 'bottomBar' ? {shell:'bottomBar', items:state.items} : {shell:'drawer'}));

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
function save(next) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* storage is optional */ }
}
function theme(value) {
  const t = value?.context?.theme;
  const root = document.documentElement;
  root.style.setProperty('--font-scale', String(value?.context?.fontScale || 1));
  if (!t) return;
  for (const [key, variable] of Object.entries({background:'bg', surface:'surface', surfaceVariant:'soft', onSurface:'text', onSurfaceVariant:'muted', primary:'accent', onPrimary:'on-accent', outlineVariant:'line', error:'error', primaryContainer:'accent-soft', onPrimaryContainer:'on-soft', surfaceContainerLow:'surface-low'})) {
    if (/^#[\da-f]{6,8}$/i.test(t[key] || '')) root.style.setProperty('--' + variable, t[key]);
  }
  root.style.colorScheme = t.dark ? 'dark' : 'light';
  root.dataset.theme = t.dark ? 'dark' : 'light';
}
let toastTimer = 0;
function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

/** Sends one layout change at a time; the page always settles on what the host accepted. */
function apply(nextMode, nextItems, message) {
  notice = message ? {text: message} : null;
  sync.apply({mode: nextMode, items: nextItems}, ({state, error}) => {
    if (error) {
      notice = {text: error?.message || '没能应用布局，请重试', error: true};
    } else {
      if (state.mode === 'bottomBar') save(state.items);
      otherOwner = false;
    }
    ({mode, items} = sync.shown);
    render();
  });
  ({mode, items} = sync.shown);
  render();
}

function row(id, {locked = false, onBar = false, movable = false, hint = '', indent = false} = {}) {
  const label = id === 'me' ? '我的' : LABELS[id];
  const handle = movable
    ? `<button class="handle" data-handle="${id}" aria-label="调整「${esc(label)}」的位置" aria-expanded="${expanded === id}">${icon('drag')}</button>`
    : `<span class="spacer${indent ? ' wide' : ''}"></span>`;
  const trailing = locked
    ? `<span class="lock" role="img" aria-label="固定">${icon('lock')}</span>`
    : '<span class="switch" aria-hidden="true"></span>';
  const body = locked
    ? `<div class="body">${icon(id)}<span class="label"><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span>${trailing}</div>`
    : `<button class="body" role="switch" aria-checked="${onBar}" data-toggle="${id}">${icon(id)}<span class="label"><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span>${trailing}</button>`;
  const at = items.indexOf(id);
  const moves = movable && expanded === id
    ? `<div class="moves"><button class="pill" data-move="${id}" data-delta="-1" ${at <= 1 ? 'disabled' : ''}>${icon('up')}上移</button><button class="pill" data-move="${id}" data-delta="1" ${at >= items.length - 1 ? 'disabled' : ''}>${icon('down')}下移</button></div>`
    : '';
  return `<div class="row${onBar ? ' on' : ''}" data-row="${id}">${handle}${body}</div>${moves}`;
}

function render() {
  if (!sdk || !caps) {
    app.innerHTML = `<div class="page"><p class="blocked"><strong>需要课简 0.7.11 或更新版本</strong>当前课简还不能切换布局，请先在「关于」里检查更新。</p></div>`;
    return;
  }
  const scroll = window.scrollY;
  const middle = items.slice(1);
  const off = PICKABLE.filter(id => !middle.includes(id) && (!destinations || destinations.includes(id)));
  const preview = [...items, 'me'].map((id, index) =>
    `<span class="${index === 0 ? 'on' : ''}"><i>${icon(id)}</i><b>${esc(id === 'me' ? '我的' : LABELS[id])}</b></span>`).join('');
  const bar = mode === 'bottomBar';
  app.innerHTML = `<div class="page">
    <header class="top"><span class="logo">${icon(bar ? 'bottombar' : 'sidebar')}</span><div><h1>布局</h1><p>选择课简的导航方式，随时可以换回来</p></div></header>
    <div class="segs" role="radiogroup" aria-label="导航方式" data-mode="${mode}"><span class="seg-thumb"></span>
      <button role="radio" aria-checked="${!bar}" data-mode="drawer">${icon('sidebar')}侧边栏</button>
      <button role="radio" aria-checked="${bar}" data-mode="bottomBar">${icon('bottombar')}底边栏</button>
    </div>
    ${notice ? `<div class="notice${notice.error ? ' error' : ''}">${icon(notice.error ? 'about' : 'check')}<span>${esc(notice.text)}</span></div>` : ''}
    ${otherOwner && !bar ? `<div class="notice">${icon('about')}<span>另一个组件正在管理课简的布局；在这里选择底边栏会接管它。</span></div>` : ''}
    ${bar ? `
      <div class="preview" aria-label="底栏预览">${preview}</div>
      <section class="group"><h2>底栏入口</h2><div class="list">
        ${row('schedule', {locked:true, hint:'固定在第一个', indent:true})}
        ${middle.map(id => row(id, {onBar:true, movable:true})).join('')}
        ${row('me', {locked:true, hint:'固定在最后，收纳其余页面', indent:true})}
      </div></section>
      ${off.length ? `<section class="group"><h2>可以加到底栏</h2><div class="list">${off.map(id => row(id)).join('')}</div></section>` : ''}
      <p class="foot">底栏最多 5 个入口。拖动左侧手柄调整顺序，点手柄也可以用按钮上移下移。</p>`
    : `<div class="notice">${icon('sidebar')}<span>正在使用侧边栏。侧边栏的入口顺序和显示在课简「设置 → 侧边栏」里调整。</span></div>`}
  </div>`;
  window.scrollTo(0, scroll);
  bind();
}

function bind() {
  app.querySelectorAll('[data-mode]').forEach(button => {
    if (button.tagName !== 'BUTTON') return;
    button.onclick = () => {
      if (button.dataset.mode === mode && !otherOwner) return;
      apply(button.dataset.mode, items);
    };
  });
  app.querySelectorAll('[data-toggle]').forEach(button => {
    button.onclick = () => {
      const result = toggle(items, button.dataset.toggle);
      if (result.refused) { toast('底栏至少保留课表之外的一个入口'); return; }
      if (expanded && !result.items.includes(expanded)) expanded = null;
      apply('bottomBar', result.items, result.bumped ? `底栏最多 5 个入口，已把「${LABELS[result.bumped]}」移到「我的」` : null);
    };
  });
  app.querySelectorAll('[data-move]').forEach(button => {
    button.onclick = () => {
      const next = move(items, button.dataset.move, Number(button.dataset.delta));
      if (next !== items) apply('bottomBar', next);
    };
  });
  app.querySelectorAll('[data-handle]').forEach(bindDrag);
}

/** Drag on the handle reorders bar rows; a tap without movement shows the move buttons instead. */
function bindDrag(handle) {
  const id = handle.dataset.handle;
  handle.onpointerdown = down => {
    const rowEl = handle.closest('.row');
    const height = rowEl.offsetHeight || 56;
    const from = items.indexOf(id);
    let order = items.slice();
    let moved = false;
    handle.setPointerCapture(down.pointerId);
    const onMove = event => {
      const dy = Math.max((1 - from) * height, Math.min((items.length - 1 - from) * height, event.clientY - down.clientY));
      if (!moved && Math.abs(dy) > 6) {
        moved = true;
        rowEl.classList.add('dragging');
        app.querySelector('.moves')?.remove();
        expanded = null;
      }
      if (!moved) return;
      const offset = dy - (order.indexOf(id) - from) * height;
      const step = offset > height / 2 ? 1 : offset < -height / 2 ? -1 : 0;
      const next = step ? move(order, id, step) : order;
      if (next !== order) {
        order = next;
        for (const other of items.slice(1)) {
          const el = other === id ? null : app.querySelector(`[data-row="${other}"]`);
          if (!el) continue;
          el.classList.add('settle');
          el.style.transform = `translateY(${(order.indexOf(other) - items.indexOf(other)) * height}px)`;
        }
      }
      rowEl.style.transform = `translateY(${dy}px)`;
    };
    const finish = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', finish);
      if (!moved) {
        expanded = expanded === id ? null : id;
        render();
        app.querySelector(`[data-handle="${id}"]`)?.focus({preventScroll:true});
      } else if (order.join() !== items.join()) {
        apply('bottomBar', order);
      } else {
        render();
      }
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  };
}

async function load() {
  if (!sdk || !caps) { render(); return; }
  try {
    const current = await sdk.request('layout.current', {});
    if (current?.shell === 'bottomBar' && current.ownedByCaller) {
      mode = 'bottomBar';
      items = normalizeItems(current.items, destinations);
    } else {
      otherOwner = current?.shell && current.shell !== 'drawer' && !current.ownedByCaller;
      mode = 'drawer';
    }
  } catch (error) {
    notice = {text: error?.message || '没能读取当前布局', error: true};
  }
  sync.accept({mode, items});
  render();
}

if (sdk) sdk.subscribe(value => { theme(value); });
if (!items.length) items = DEFAULT_ITEMS.slice();
load();
