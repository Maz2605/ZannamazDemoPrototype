/** Dependency-free local server. Also mounts /repository-name/ for Pages checks. */
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 8080);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const inside = path => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`); };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/repository-name') { res.writeHead(302, { Location: '/repository-name/' }); res.end(); return; }
    if (path.startsWith('/repository-name/')) path = path.slice('/repository-name'.length);
    let file = resolve(root, '.' + path);
    if (!inside(file) || path.split('/').some(part => part.startsWith('.'))) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(302, { Location: url.pathname + '/' }); res.end(); return; }
      file = resolve(file, 'index.html');
    }
    file = await realpath(file);
    if (!inside(file)) { res.writeHead(403); res.end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Stop the existing server or set PORT to another port.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Prototype Arcade: http://localhost:${port}\nPages subpath: http://localhost:${port}/repository-name/`));
