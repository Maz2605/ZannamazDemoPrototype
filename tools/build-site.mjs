/** Package runtime files only; no bundler or third-party dependencies. */
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);

// The output path is fixed inside this repository, never supplied by the caller.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const name of ['index.html', 'catalog.json', '.nojekyll', 'assets']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}

// Include every module so direct game links keep working outside the catalog.
// Keep future module assets intact; omit authoring and local development files.
for (const entry of await readdir(new URL('games/', root), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  await cp(new URL(`games/${entry.name}/`, root), new URL(`games/${entry.name}/`, output), {
    recursive: true,
    filter: source => !/^(?:docs|tools|tests|node_modules|__pycache__|\..*)$/.test(source.split(/[\\/]/).at(-1))
      && !/\.(?:md|cmd|bat|py|pyc|log)$/i.test(source),
  });
}

// Preserve the original shared Spirit Grove URL.
await mkdir(new URL('SpiritGrove_DemoPrototypeGame_Source/', output), { recursive: true });
await cp(new URL('SpiritGrove_DemoPrototypeGame_Source/index.html', root),
  new URL('SpiritGrove_DemoPrototypeGame_Source/index.html', output));

console.log(`Static site ready: ${fileURLToPath(output)}`);
