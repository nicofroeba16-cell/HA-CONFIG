const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../apple-optik.js'), 'utf8');
const routeCode = source.slice(source.indexOf('/* ===== data-view for per-view backgrounds'));
assert.ok(routeCode.includes('function setView()'));

function harness(initial, reduced = false) {
  const element = () => {
    const classes = new Set();
    return {
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
      hasAttribute(k) { return Object.hasOwn(this.attrs, k); },
      removeAttribute(k) { delete this.attrs[k]; },
      style: { props: {}, setProperty(k, v) { this.props[k] = String(v); } },
      classList: {
        add(...v) { v.forEach((x) => classes.add(x)); },
        remove(...v) { v.forEach((x) => classes.delete(x)); },
        contains(v) { return classes.has(v); },
      },
    };
  };
  const root = element();
  const body = element();
  const events = {};
  const documentEvents = {};
  const frames = [];
  const timers = [];
  const location = { pathname: initial };
  const context = {
    location,
    document: {
      documentElement: root,
      body,
      addEventListener(k, cb) { documentEvents[k] = cb; },
    },
    window: {
      matchMedia: () => ({ matches: reduced }),
      addEventListener(k, cb) { events[k] = cb; },
    },
    requestAnimationFrame(cb) { frames.push(cb); return frames.length; },
    setTimeout(cb) { const item = { cb, cancelled: false }; timers.push(item); return item; },
    clearTimeout(item) { if (item) item.cancelled = true; },
  };
  vm.runInNewContext(routeCode, context);
  return {
    root, body, location, documentEvents,
    go(url, event = 'location-changed') { location.pathname = url; events[event](); },
    reduced(value) { reduced = value; },
    flushFrames() { while (frames.length) frames.shift()(); },
    flushTimers() {
      while (timers.length) {
        const item = timers.shift();
        if (!item.cancelled) item.cb();
      }
    },
    flush() {
      while (frames.length || timers.length) {
        while (frames.length) frames.shift()();
        while (timers.length) {
          const item = timers.shift();
          if (!item.cancelled) item.cb();
        }
      }
    },
  };
}

for (const profile of ['x', 'timo', 'juli', 'mika', 'gabi']) {
  test(`${profile}: direct load, crossfade, history, reduced motion`, () => {
    const h = harness(`/dashboard-${profile}/juli-zimmer`);
    assert.equal(h.root.attrs['data-panel'], 'dash');
    assert.equal(h.root.attrs['data-view'], 'juli-zimmer');
    h.go(`/dashboard-${profile}/system`);
    assert.equal(h.root.attrs['data-view'], 'juli-zimmer');
    assert.equal(h.root.attrs['data-view-next'], 'system');
    h.flushFrames();
    assert.equal(h.root.classList.contains('apple-wash-animating'), true);
    h.flushTimers();
    assert.equal(h.root.attrs['data-view'], 'system');
    assert.equal(h.root.attrs['data-view-next'], undefined);
    h.go(`/dashboard-${profile}/haus`, 'popstate');
    h.flush();
    assert.equal(h.root.attrs['data-view'], 'haus');
    h.reduced(true);
    h.go(`/dashboard-${profile}/medien`);
    assert.equal(h.root.attrs['data-view'], 'medien');
    assert.equal(h.root.attrs['data-view-next'], undefined);
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
  h.go('/dashboard-juli/medien');
  assert.equal(h.root.attrs['data-view-next'], 'medien');
  h.go('/config');
  h.flush();
  assert.equal(h.root.attrs['data-panel'], 'admin');
  assert.equal(h.root.attrs['data-view'], undefined);
  assert.equal(h.root.attrs['data-view-next'], undefined);
  assert.equal(h.body.attrs['data-view'], undefined);
  h.go('/dashboard-x/wohnzimmer');
  assert.equal(h.root.attrs['data-view'], 'wohnzimmer');
});

test('rapid navigation resolves to newest route without stacked animation', () => {
  const h = harness('/dashboard-x/haus');
  h.go('/dashboard-timo/medien');
  assert.equal(h.root.attrs['data-view-next'], 'medien');
  h.go('/dashboard-x/system');
  assert.equal(h.root.attrs['data-view'], 'system');
  assert.equal(h.root.attrs['data-view-next'], undefined);
  h.flush();
  assert.equal(h.root.attrs['data-view'], 'system');
  h.go('/dashboard-x/medien');
  h.reduced(true);
  h.go('/dashboard-timo/wohnzimmer');
  h.flush();
  assert.equal(h.root.attrs['data-view'], 'wohnzimmer');
  assert.equal(h.root.attrs['data-view-next'], undefined);
});

test('mobile helper preserves route-controller transition ownership', () => {
  const helper = fs.readFileSync(path.join(__dirname, '../apple-mobile-gradient.js'), 'utf8');
  const h = harness('/dashboard-x/haus');
  h.go('/dashboard-x/medien');
  assert.equal(h.root.attrs['data-view'], 'haus');
  assert.equal(h.root.attrs['data-view-next'], 'medien');
  let observer;
  const document = {
    documentElement: h.root,
    body: h.body,
    head: { appendChild() {}, getElementById() { return null; } },
    createElement() { return { appendChild() {} }; },
    getElementById() { return null; },
    querySelectorAll() { return []; },
  };
  const callbacks = [];
  vm.runInNewContext(helper, {
    document,
    window: {
      location: h.location,
      addEventListener(event, callback) { callbacks.push(callback); },
    },
    location: h.location,
    requestAnimationFrame(cb) { cb(); return 1; },
    MutationObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
    },
  });
  if (observer) observer([]);
  callbacks.forEach((fn) => fn());
  assert.equal(h.root.attrs['data-view'], 'haus');
  assert.equal(h.root.attrs['data-view-next'], 'medien');
});
