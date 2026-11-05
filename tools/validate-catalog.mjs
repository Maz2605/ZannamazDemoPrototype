import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { validateCatalog, validateMetadata } from '../assets/catalog.mjs';

const root = resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)));
const errors = [], ids = new Set();
let count = 0;
async function checkFile(url, moduleDirectory) {
  const path = fileURLToPath(url);
  const actual = await realpath(path);
  const boundary = await realpath(moduleDirectory);
  const rel = relative(boundary, actual);
  if (rel === '..' || rel.startsWith(`..${sep}`)) throw Error(`${path} escapes module`);
  if (!(await stat(actual)).isFile()) throw Error(`${path} is not a file`);
}
try {
  const catalogURL = pathToFileURL(resolve(root, 'catalog.json'));
  const urls = validateCatalog(JSON.parse(await readFile(catalogURL, 'utf8')), catalogURL);
  for (const url of urls) {
    try {
      const modulePath = fileURLToPath(url);
      const data = validateMetadata(JSON.parse(await readFile(modulePath, 'utf8')), url);
      if (ids.has(data.id)) throw Error(`duplicate id: ${data.id}`);
      ids.add(data.id);
      await checkFile(data.entryURL, dirname(modulePath));
      await checkFile(data.thumbnailURL, dirname(modulePath));
      console.log(`OK ${data.id}: ${relative(root, modulePath)}`);
      count++;
    } catch (error) { errors.push(`${fileURLToPath(url)}: ${error.message}`); }
  }
} catch (error) { errors.push(`catalog.json: ${error.message}`); }
if (errors.length) { errors.forEach(error => console.error(`ERROR ${error}`)); process.exitCode = 1; }
else console.log(`PASS: ${count} game module(s).`);
