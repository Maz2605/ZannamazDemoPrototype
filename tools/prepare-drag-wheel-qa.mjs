// Render the real game and regression checks in one file for browsers that
// isolate file:// iframes. Generated output stays outside the production catalog.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let html = await readFile(new URL('games/spirit-grove/index.html', root), 'utf8');
html = html.replace('./src/styles.css', '../../games/spirit-grove/src/styles.css');
html = html.replaceAll('src="./src/', 'src="../../games/spirit-grove/src/');
const harness = await readFile(new URL('tests/drag-wheel-browser.html', root), 'utf8');
let script = harness.slice(harness.indexOf('<script>') + 8, harness.lastIndexOf('</script>'));
script = script.replace("document.querySelector('iframe').onload = async function ()", "window.addEventListener('load', async function ()");
script = script.replace('const win = this.contentWindow, doc = win.document, g = win.SpiritGrove;', 'const win = window, doc = document, g = win.SpiritGrove;');
script = script.replace(/};\s*$/, '});');
html = html.replace('</body>', `<pre id="results" style="white-space:pre-wrap;position:absolute;left:0;top:0;background:white;z-index:100;padding:12px">RUNNING</pre><script>${script}</script></body>`);
await mkdir(new URL('test-results/drag-wheel/', root), { recursive:true });
await writeFile(new URL('test-results/drag-wheel/browser.html', root), html);
console.log('Open test-results/drag-wheel/browser.html in a browser; expect thirteen PASS lines.');
