const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../apple-optik.js'), 'utf8');
const routeCode = source.slice(source.indexOf('/* ===== data-view for per-view backgrounds'));
assert.ok(routeCode.includes('function setView()'));

function harness(initial, reduced = false) {
  const element = () => ({
    attrs: {}, setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    style: { setProperty() {} }, classList: { add() {}, remove() {} },
  });
  const root = element(), body = element(), events = {}, documentEvents = {};
  const frames = [], timers = [];
  const location = { pathname: initial };
  const context = {
    location, document: { documentElement: root, body,
      addEventListener(k, cb) { documentEvents[k] = cb; } },
    window: { matchMedia: () => ({ matches: reduced }),
      addEventListener(k, cb) { events[k] = cb; } },
    requestAnimationFrame(cb) { frames.push(cb); }, setTimeout(cb) { timers.push(cb); },
  };
  vm.runInNewContext(routeCode, context);
  return { root, body, documentEvents,
    go(url, event = 'location-changed') { location.pathname = url; events[event](); },
    reduced(value) { reduced = value; },
    flush() { while (frames.length) frames.shift()(); while (timers.length) timers.shift()(); },
  };
}

for (const profile of ['x', 'timo', 'juli', 'mika', 'gabi']) {
  test(`${profile}: direct load, root, navigation, history, reduced motion`, () => {
    const h = harness(`/dashboard-${profile}/juli-zimmer`);
    assert.equal(h.root.attrs['data-panel'], 'dash');
    assert.equal(h.root.attrs['data-view'], 'juli-zimmer');
    h.go(`/dashboard-${profile}/system`);
    assert.equal(h.root.attrs['data-view'], 'system');
    h.go(`/dashboard-${profile}/haus`, 'popstate'); h.flush();
    assert.equal(h.root.attrs['data-view'], 'haus');
    h.reduced(true); h.go(`/dashboard-${profile}/medien`);
    assert.equal(h.root.attrs['data-view'], 'medien');
    for (const suffix of ['', '/']) {
      const bare = harness(`/dashboard-${profile}${suffix}`);
      assert.equal(bare.root.attrs['data-view'], 'haus');
    }
  });
}

test('non-dashboard routes never retain a dashboard wash', () => {
  for (const url of ['/config', '/dashboard-julia/haus', '/dashboard-x-other/haus']) {
    const h = harness(url);
    assert.equal(h.root.attrs['data-panel'], 'admin');
    assert.equal(h.root.attrs['data-view'], undefined);
  }
});

test('leaving during animation cancels stale callbacks', () => {
  const h = harness('/dashboard-juli/haus');
  h.go('/dashboard-juli/medien'); h.go('/config'); h.flush();
  assert.equal(h.root.attrs['data-panel'], 'admin');
  assert.equal(h.root.attrs['data-view'], undefined);
  assert.equal(h.root.attrs['data-view-next'], undefined);
  assert.equal(h.body.attrs['data-view'], undefined);
  h.go('/dashboard-x/wohnzimmer');
  assert.equal(h.root.attrs['data-view'], 'wohnzimmer');
});

test('rapid navigation and reduced-motion change cancel older transitions', () => {
  const h = harness('/dashboard-x/haus');
  h.go('/dashboard-timo/medien'); h.go('/dashboard-x/system'); h.flush();
  assert.equal(h.root.attrs['data-view'], 'system');
  h.go('/dashboard-x/medien'); h.reduced(true); h.go('/dashboard-timo/wohnzimmer'); h.flush();
  assert.equal(h.root.attrs['data-view'], 'wohnzimmer');
});

test('mobile helper does not overwrite animation route state', () => {
  const helper = fs.readFileSync(path.join(__dirname, '../apple-mobile-gradient.js'), 'utf8');
  const h = harness('/dashboard-x/haus'); h.go('/dashboard-x/medien');
  let observer;
  const callbacks = [];
  const document = {
    documentElement: h.root,
    head: { appendChild() {} },
    createElement() { return {}; }, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
  };
  vm.runInNewContext(helper, { document,
    window: { addEventListener(event, callback) { callbacks.push(callback); } },
    MutationObserver: class { constructor(callback) { observer = callback; } observe() {} },
  });
  if (observer) observer(); callbacks.forEach(fn => fn());
  assert.equal(h.root.attrs['data-view'], 'medien');
});
