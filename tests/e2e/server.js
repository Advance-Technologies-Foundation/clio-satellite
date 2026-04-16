import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const MOCK_PAGES = {
  '/shell/': 'shell.html',
  '/login/': 'login.html',
  '/configuration/': 'configuration.html',
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const mockFile = MOCK_PAGES[req.url];
  if (mockFile) {
    try {
      const content = fs.readFileSync(path.join(__dirname, 'pages', mockFile), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // Serve extension static files (options.html, options.js, styles/*)
  const urlPath = req.url.split('?')[0];
  const ext = path.extname(urlPath);
  if (MIME_TYPES[ext]) {
    try {
      const filePath = path.join(PROJECT_ROOT, urlPath);
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  try {
    const content = fs.readFileSync(path.join(__dirname, 'pages', 'unknown.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3737);
