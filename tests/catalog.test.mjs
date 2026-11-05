import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = resolve('tools/validate-catalog.mjs');
const metadata = { id: 'sample', title: 'Sample', category: 'Puzzle', version: '1', description: 'Demo', thumbnail: './thumbnail.svg', entry: './index.html', orientation: 'portrait', rules: ['Win'], controls: ['Click'], notes: [] };
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'arcade-test-'));
  try {
    await mkdir(join(root, 'games/sample'), { recursive: true });
    await writeFile(join(root, 'games/sample/index.html'), '<h1>Independent game</h1>');
    await writeFile(join(root, 'games/sample/thumbnail.svg'), '<svg/>');
    await writeFile(join(root, 'games/sample/game.json'), JSON.stringify(metadata));
    await writeFile(join(root, 'catalog.json'), JSON.stringify({ games: ['./games/sample/game.json'] }));
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
function validate(root) { return spawnSync(process.execPath, [cli, root], { encoding: 'utf8' }); }
test('valid standalone module can register without library changes', () => fixture(async root => {
  const result = validate(root); assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /1 game/);
}));
for (const [name, change, message] of [
  ['missing title', m => delete m.title, /title/],
  ['invalid rules', m => m.rules = 'bad', /rules/],
  ['missing entry', m => m.entry = './missing.html', /missing.html/],
  ['missing thumbnail', m => m.thumbnail = './absent.png', /absent.png/],
  ['module escape', m => m.entry = '../../index.html', /module/],
]) test(`rejects ${name} and identifies module`, () => fixture(async root => {
  const m = structuredClone(metadata); change(m);
  await writeFile(join(root, 'games/sample/game.json'), JSON.stringify(m));
  const result = validate(root); assert.equal(result.status, 1); assert.match(result.stderr, /games.*sample/); assert.match(result.stderr, message);
}));
test('rejects duplicate ids', () => fixture(async root => {
  await writeFile(join(root, 'catalog.json'), JSON.stringify({ games: ['./games/sample/game.json', './games/sample/game.json'] }));
  const result = validate(root); assert.equal(result.status, 1); assert.match(result.stderr, /duplicate/i);
}));
test('reports malformed module JSON', () => fixture(async root => {
  await writeFile(join(root, 'games/sample/game.json'), '{broken');
  const result = validate(root); assert.equal(result.status, 1); assert.match(result.stderr, /games.*sample/);
}));
