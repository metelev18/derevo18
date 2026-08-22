import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.cwd(), 'dist');
const rootPrefix = `${root}${sep}`;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function resolveFile(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  } catch {
    return null;
  }
  let relativePath = pathname.replace(/^\/+/, '');
  if (!relativePath || pathname.endsWith('/')) relativePath += 'index.html';

  let filePath = resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(rootPrefix)) return null;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = resolve(filePath, 'index.html');
  if (!existsSync(filePath) && !extname(filePath)) filePath = resolve(filePath, 'index.html');
  return existsSync(filePath) && statSync(filePath).isFile() ? filePath : null;
}

export function startStaticServer() {
  const server = createServer((request, response) => {
    const requestedFile = resolveFile(request.url ?? '/');
    const filePath = requestedFile ?? resolve(root, '404.html');
    const status = requestedFile ? 200 : 404;
    const contentType = mimeTypes[extname(filePath)] ?? 'application/octet-stream';

    response.writeHead(status, { 'Content-Type': contentType });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(4321, '127.0.0.1', () => {
      server.off('error', reject);
      resolveServer(server);
    });
  });
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === entryPoint) await startStaticServer();
