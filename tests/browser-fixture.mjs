// Creates ignored QA output; production catalog and modules remain untouched.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve('test-results/browser-fixture');
await mkdir(root, { recursive: true });
for (const path of ['index.html', 'assets', 'games/spirit-grove']) await cp(resolve(path), resolve(root, path), { recursive: true, force: true });
await cp(resolve('templates/game-module'), resolve(root, 'games/independent-test'), { recursive: true, force: true });
const metadata = JSON.parse(await readFile(resolve(root, 'games/independent-test/game.json'), 'utf8'));
Object.assign(metadata, { id: 'independent-test', title: 'Independent QA Module', category: 'Arcade' });
await writeFile(resolve(root, 'games/independent-test/game.json'), JSON.stringify(metadata));
await mkdir(resolve(root, 'games/broken'), { recursive: true });
await writeFile(resolve(root, 'games/broken/game.json'), '{bad-json');
await writeFile(resolve(root, 'catalog.json'), JSON.stringify({ games: ['./games/spirit-grove/game.json', './games/independent-test/game.json', './games/broken/game.json'] }));
console.log('Browser fixture ready: /test-results/browser-fixture/ (2 valid games + 1 malformed module)');
