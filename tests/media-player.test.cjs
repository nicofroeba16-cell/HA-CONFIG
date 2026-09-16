const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../apple-optik.js'), 'utf8');

test('iOS media card exposes the standard Fire TV control contract', () => {
  assert.match(source, /media_play_pause/);
  assert.match(source, /media_previous_track/);
  assert.match(source, /media_next_track/);
  assert.match(source, /media_seek/);
  assert.match(source, /volume_set/);
  assert.match(source, /volume_mute/);
});

test('unavailable players are presented as connection loss', () => {
  assert.match(source, /s === "unavailable" \|\| s === "unknown"\) return "Verbindung verloren"/);
});

test('card has explicit fixtures for reduced capability and media metadata', () => {
  assert.match(source, /hasFeat\(st, FEAT\.SEEK\)/);
  assert.match(source, /media_image_url/);
  assert.match(source, /media_position_updated_at/);
});
