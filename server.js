const http = require('http');
const fs = require('fs');
const path = require('path');

const ALLOWED_HEADERS = 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-calls';

// Served at a stable Railway URL so the browser origin (and therefore
// localStorage) stays constant no matter how the page is reached — unlike
// opening the local file, which gets a fresh origin every time Drive's web
// UI hands out a new .tmp/ copy.
const STATIC_PAGES = {
  '/grievance': path.join(__dirname, 'tools', 'grievance_1.html'),
  '/signal': path.join(__dirname, 'tools', 'SIGNAL — Complaint Intelligence Engine.html')
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.method === 'GET' && STATIC_PAGES[req.url]) {
    fs.readFile(STATIC_PAGES[req.url], (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('page not found on disk');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/v1/messages') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  const key = req.headers['x-api-key'];
  if (!key) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing x-api-key header' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
        },
        body
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'proxy_error', message: e.message }));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('SIGNAL Anthropic proxy listening on ' + PORT));
