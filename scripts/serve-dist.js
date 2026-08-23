#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from './notion-api.js';

/* Повтаря поведението на Vercel: чисти адреси, index в папка, 404.html. */

const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT) || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function resolve(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]).replace(/\/+$/, '') || '/';
  const candidates =
    clean === '/'
      ? [path.join(distDir, 'index.html')]
      : [
          path.join(distDir, clean),
          path.join(distDir, `${clean}.html`),
          path.join(distDir, clean, 'index.html'),
        ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

http
  .createServer((request, response) => {
    const file = resolve(request.url || '/');
    if (!file) {
      const notFound = path.join(distDir, '404.html');
      const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found';
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(body);
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    response.end(fs.readFileSync(file));
  })
  .listen(port, () => console.log(`dist/ на http://localhost:${port}`));
