/**
 * Dev loop for the proofing shell: incremental tsc in watch mode plus a static
 * server over the repo root, so the app's import map can reach every package's
 * dist. No bundler — native ES modules on tsc output. Localhost only.
 */
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 4173);
const APP = '/apps/proofing-flight/index.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
  '.png': 'image/png',
};

const tsc = spawn(
  process.execPath,
  ['node_modules/typescript/bin/tsc', '-b', '--watch', '--preserveWatchOutput'],
  { cwd: ROOT, stdio: 'inherit' },
);
process.on('exit', () => tsc.kill());

const server = createServer((request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
    if (url.pathname === '/') {
      // A real redirect, so the page's relative URLs resolve under the app path.
      response.writeHead(302, { location: APP });
      response.end();
      return;
    }
    const file = path.join(ROOT, path.normalize(url.pathname));

    if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end(`not found: ${url.pathname}`);
      return;
    }

    response.writeHead(200, {
      'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain' });
    response.end(String(error));
  }
});

// A dev server must outlive its accidents.
server.on('clientError', (_error, socket) => socket.destroy());
tsc.on('error', (error) => console.error(`tsc failed to start: ${error.message}`));

server.listen(PORT, '127.0.0.1', () => {
  console.log(`proofing flight: http://localhost:${PORT}/`);
});
