const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE = path.join(ROOT, 'evidence', 'motion-acceptance');
fs.mkdirSync(EVIDENCE, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function staticServer() {
  const mime = { '.html':'text/html', '.js':'text/javascript', '.cjs':'text/javascript', '.css':'text/css', '.json':'application/json' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const candidate = pathname.startsWith('/dashboard-')
      ? path.join(ROOT, 'tests', 'motion-sim.html')
      : path.resolve(ROOT, '.' + pathname);
    if (!candidate.startsWith(ROOT) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.setHeader('Content-Type', mime[path.extname(candidate)] || 'application/octet-stream');
    fs.createReadStream(candidate).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}
class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }
  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result || {});
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { if (this.ws) this.ws.close(); }
}
async function launchChrome() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ha-motion-chrome-'));
  const chrome = spawn('/usr/bin/google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--remote-debugging-port=0', `--user-data-dir=${userDir}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const portFile = path.join(userDir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(50);
  if (!fs.existsSync(portFile)) throw new Error('Chrome DevToolsActivePort missing');
  const [port] = fs.readFileSync(portFile, 'utf8').trim().split(/\s+/);
  let pages = [];
  for (let i = 0; i < 50; i++) {
    try {
      pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      if (pages.length) break;
    } catch (_) {}
    await sleep(50);
  }
  const page = pages.find((item) => item.type === 'page');
  if (!page) throw new Error('Chrome page target missing');
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  return { chrome, cdp, userDir };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime exception');
  return result.result?.value;
}
function u32(value) { const b = Buffer.alloc(4); b.writeUInt32LE(value >>> 0); return b; }
function chunk(id, data) {
  const pad = data.length % 2 ? Buffer.from([0]) : Buffer.alloc(0);
  return Buffer.concat([Buffer.from(id, 'ascii'), u32(data.length), data, pad]);
}
function list(type, data) {
  return Buffer.concat([Buffer.from('LIST'), u32(4 + data.length), Buffer.from(type, 'ascii'), data]);
}
function aviBuffer(frames, width, height, fps) {
  const maxFrame = Math.max(...frames.map((frame) => frame.length));
  const avih = Buffer.alloc(56);
  avih.writeUInt32LE(Math.round(1e6 / fps), 0);
  avih.writeUInt32LE(maxFrame * fps, 4);
  avih.writeUInt32LE(0x10, 12);
  avih.writeUInt32LE(frames.length, 16);
  avih.writeUInt32LE(1, 24);
  avih.writeUInt32LE(maxFrame, 28);
  avih.writeUInt32LE(width, 32);
  avih.writeUInt32LE(height, 36);

  const strh = Buffer.alloc(56);
  strh.write('vids', 0, 'ascii'); strh.write('MJPG', 4, 'ascii');
  strh.writeUInt32LE(1, 20); strh.writeUInt32LE(fps, 24);
  strh.writeUInt32LE(frames.length, 32); strh.writeUInt32LE(maxFrame, 36);
  strh.writeUInt32LE(0xffffffff, 40); strh.writeInt16LE(width, 52); strh.writeInt16LE(height, 54);

  const strf = Buffer.alloc(40);
  strf.writeUInt32LE(40, 0); strf.writeInt32LE(width, 4); strf.writeInt32LE(height, 8);
  strf.writeUInt16LE(1, 12); strf.writeUInt16LE(24, 14); strf.write('MJPG', 16, 'ascii');
  strf.writeUInt32LE(maxFrame, 20);
  const hdrl = list('hdrl', Buffer.concat([
    chunk('avih', avih),
    list('strl', Buffer.concat([chunk('strh', strh), chunk('strf', strf)])),
  ]));
  const frameChunks = [];
  const indexEntries = [];
  let offset = 4;
  for (const frame of frames) {
    const frameChunk = chunk('00dc', frame);
    frameChunks.push(frameChunk);
    const entry = Buffer.alloc(16);
    entry.write('00dc', 0, 'ascii');
    entry.writeUInt32LE(0x10, 4);
    entry.writeUInt32LE(offset, 8);
    entry.writeUInt32LE(frame.length, 12);
    indexEntries.push(entry);
    offset += frameChunk.length;
  }
  const movi = list('movi', Buffer.concat(frameChunks));
  const idx1 = chunk('idx1', Buffer.concat(indexEntries));
  const body = Buffer.concat([hdrl, movi, idx1]);
  return Buffer.concat([Buffer.from('RIFF'), u32(4 + body.length), Buffer.from('AVI '), body]);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
async function diagnostics(cdp) {
  return evaluate(cdp, `(() => {
    const d = window.motionDemo.diagnostics();
    let maxOptik = 0, maxTransparency = 0, shadowRoots = 0;
    const visit = (root) => {
      if (!root || !root.querySelectorAll) return;
      if (root instanceof ShadowRoot) {
        shadowRoots += 1;
        maxOptik = Math.max(maxOptik, root.querySelectorAll('#apple-optik').length);
        maxTransparency = Math.max(maxTransparency, root.querySelectorAll('#apple-mobile-gradient-transparency').length);
      }
      root.querySelectorAll('*').forEach((el) => { if (el.shadowRoot) visit(el.shadowRoot); });
    };
    visit(document);
    return {
      ...d,
      domNodes: document.querySelectorAll('*').length,
      shadowRoots,
      maxOptikPerShadowRoot: maxOptik,
      maxTransparencyPerShadowRoot: maxTransparency,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      reducedTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches,
    };
  })()`);
}

async function rect(cdp, selector) {
  return evaluate(cdp, `(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
}
async function recordProfile(cdp, baseUrl, profile) {
  const { name, width, height, reduced } = profile;
  const fps = 8;
  const frames = [];
  cdp.events.length = 0;
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: height,
  });
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
      { name: 'prefers-reduced-transparency', value: reduced ? 'reduce' : 'no-preference' },
    ],
  });
  await cdp.send('Page.navigate', { url: `${baseUrl}/tests/motion-sim.html?profile=${name}` });
  await sleep(700);

  const frame = async () => {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 48, fromSurface: true, captureBeyondViewport: false });
    frames.push(Buffer.from(shot.data, 'base64'));
  };
  const segment = async (label, count) => {
    await evaluate(cdp, `document.getElementById('hint').textContent=${JSON.stringify(label)}`);
    for (let i = 0; i < count; i++) { await frame(); await sleep(55); }
  };
  const press = async (selector, hold = 3) => {
    const p = await rect(cdp, selector);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await segment('Press / hold', hold);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  };
  await segment('Baseline · dashboard open', 5);
  await evaluate(cdp, `motionDemo.navigate('medien')`);
  await segment('Navigation · haus → medien', 6);
  await press('#detailTrigger', 3);
  await segment('Detail · open', 4);
  await evaluate(cdp, 'motionDemo.closeDetail()');
  await segment('Detail · close', 4);
  await evaluate(cdp, 'motionDemo.openDetail()');
  await segment('Detail · repeated open', 3);
  await evaluate(cdp, 'motionDemo.closeDetail()');
  await segment('Detail · repeated close', 3);

  await press('ios-light-card', 3);
  await segment('Card · release', 3);
  await press('ios-light-card', 2);
  await segment('Card · repeated release', 2);
  await evaluate(cdp, `motionDemo.lightState('on')`);
  await segment('Entity · light off → on', 5);
  await evaluate(cdp, `motionDemo.lightState('off')`);
  await segment('Entity · light on → off', 4);
  await evaluate(cdp, `motionDemo.lightState('on')`);
  await segment('Entity · light repeated on', 4);

  await evaluate(cdp, `motionDemo.mediaState('playing')`);
  await segment('Media · idle → playing', 6);
  await evaluate(cdp, `motionDemo.mediaState('idle')`);
  await segment('Media · playing → idle', 4);
  await evaluate(cdp, `motionDemo.mediaState('playing')`);
  await segment('Media · repeated playing', 4);
  await evaluate(cdp, `motionDemo.lightState('loading')`);
  await segment('Loading → ready · loading', 4);
  await evaluate(cdp, `motionDemo.lightState('on')`);
  await segment('Loading → ready · ready', 5);
  await evaluate(cdp, `motionDemo.lightState('unavailable'); motionDemo.mediaState('unavailable')`);
  await segment('Unavailable → available · unavailable', 5);
  await evaluate(cdp, `motionDemo.lightState('on'); motionDemo.mediaState('playing')`);
  await segment('Unavailable → available · restored', 5);

  await evaluate(cdp, 'motionDemo.reconnectPhase(false)');
  await segment('Reconnect · disconnected', 5);
  await evaluate(cdp, 'motionDemo.reconnectPhase(true)');
  await segment('Reconnect · restored', 5);
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(650);
  await segment('Reload · ready', 6);
  await evaluate(cdp, 'motionDemo.rapidNavigation()');
  await segment('Rapid navigation · repeated destinations', 10);
  await sleep(500);
  await segment('Rapid navigation · settled', 3);

  const beforeStress = await diagnostics(cdp);
  await evaluate(cdp, `for(let i=0;i<60;i++){const n=document.createElement('span'); n.className='observer-probe'; document.getElementById('app').appendChild(n); n.remove();}`);
  await sleep(250);
  const afterStress = await diagnostics(cdp);
  const errors = cdp.events.filter((event) =>
    event.method === 'Runtime.exceptionThrown' ||
    (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params?.entry?.level))
  ).map((event) => event.method === 'Runtime.exceptionThrown' ? event.params.exceptionDetails?.text : event.params?.entry?.text);
  const pass = !afterStress.overflow &&
    afterStress.panel === 'dash' && afterStress.view === 'haus' && !afterStress.viewNext &&
    afterStress.rootStyleCount === 1 && afterStress.mobileStyleCount === 1 && afterStress.transparencyStyleCount === 1 &&
    afterStress.maxOptikPerShadowRoot <= 1 && afterStress.maxTransparencyPerShadowRoot <= 1 &&
    afterStress.domNodes === beforeStress.domNodes && afterStress.reducedMotion === reduced && errors.length === 0;

  const file = path.join(EVIDENCE, `${name}.avi`);
  fs.writeFileSync(file, aviBuffer(frames, width, height, fps));
  return {
    name, width, height, reduced, fps, frames: frames.length,
    video: path.relative(ROOT, file), bytes: fs.statSync(file).size, sha256: sha256(file),
    pass, beforeStress, afterStress, consoleErrors: errors,
  };
}

async function main() {
  const server = await staticServer();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const { chrome, cdp } = await launchChrome();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  const profiles = [
    { name: 'iphone-393x852-motion', width:393, height:852, reduced:false },
    { name: 'iphone-430x932-motion', width:430, height:932, reduced:false },
    { name: 'iphone-375x812-stress', width:375, height:812, reduced:false },
    { name: 'iphone-393x852-reduced-motion', width:393, height:852, reduced:true },
  ];
  const results = [];
  try {
    for (const profile of profiles) {
      process.stdout.write(`recording ${profile.name} ... `);
      const result = await recordProfile(cdp, baseUrl, profile);
      results.push(result);
      console.log(result.pass ? 'PASS' : 'FAIL');
    }
  } finally {
    cdp.close();
    chrome.kill('SIGTERM');
    server.close();
  }
  const report = {
    generatedAt: new Date().toISOString(),
    sourceHead: require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    profiles: results,
    allPass: results.every((result) => result.pass),
  };
  fs.writeFileSync(path.join(EVIDENCE, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ allPass: report.allPass, videos: results.map((r) => r.video) }, null, 2));
  if (!report.allPass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
