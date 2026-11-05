import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCatalog, filterGames, validateMetadata } from '../assets/catalog.mjs';

const raw = JSON.parse(await readFile(new URL('../games/spirit-grove/game.json', import.meta.url), 'utf8'));
const base = 'https://example.test/repository-name/catalog.json';
const url = new URL('./games/spirit-grove/game.json', base).href;
test('entry and thumbnail retain Pages repository subpath', () => {
  const game = validateMetadata(raw, url);
  assert.equal(game.entryURL, 'https://example.test/repository-name/games/spirit-grove/index.html');
  assert.equal(game.thumbnailURL, 'https://example.test/repository-name/games/spirit-grove/thumbnail.png');
});
test('one malformed module does not hide other games', async () => {
  const fetcher = async path => ({ ok: true, json: async () => path === base ? { games: ['./games/broken/game.json', './games/spirit-grove/game.json', './games/spirit-grove/game.json'] } : path.includes('/broken/') ? {} : raw });
  const result = await loadCatalog(base, fetcher);
  assert.equal(result.games.length, 1); assert.equal(result.games[0].id, raw.id);
  assert.equal(result.errors.length, 2); assert.match(result.errors[1], /duplicate/);
});
test('catalog HTTP failure is explicit', async () => {
  await assert.rejects(loadCatalog(base, async () => ({ ok: false, status: 404 })), /404/);
});
test('search supports Vietnamese without accents and combines category', () => {
  assert.equal(filterGames([raw], 'LINH THU', 'Puzzle').length, 1);
  assert.equal(filterGames([raw], 'linh thu', 'Arcade').length, 0);
  assert.equal(filterGames([raw], 'missing', '').length, 0);
  assert.equal(filterGames([raw], ' ', '').length, 1);
});
