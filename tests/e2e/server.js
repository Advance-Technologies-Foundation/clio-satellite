import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = {
  '/shell/': 'shell.html',
  '/login/': 'login.html',
  '/configuration/': 'configuration.html',
};

const server = http.createServer((req, res) => {
  const file = routes[req.url] ?? 'unknown.html';
  try {
    const content = fs.readFileSync(path.join(__dirname, 'pages', file), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3737);
