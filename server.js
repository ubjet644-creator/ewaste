'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const password = process.env.ADMIN_PASSWORD || '';
const dbPath = process.env.DATA_FILE || path.join(__dirname, 'waste.sqlite');
if (password && password.length < 7) {
  throw new Error('ADMIN_PASSWORD must contain at least 7 characters.');
}

const db = new DatabaseSync(dbPath);
db.exec('CREATE TABLE IF NOT EXISTS waste_total (id INTEGER PRIMARY KEY CHECK (id = 1), kilograms REAL NOT NULL, updated_at TEXT NOT NULL)');
const readTotal = db.prepare('SELECT kilograms, updated_at AS updatedAt FROM waste_total WHERE id = 1');
const writeTotal = db.prepare('INSERT INTO waste_total (id, kilograms, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET kilograms = excluded.kilograms, updated_at = excluded.updated_at');
const attempts = new Map();
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8']
};

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function samePassword(candidate) {
  const expected = crypto.createHash('sha256').update(password).digest();
  const actual = crypto.createHash('sha256').update(candidate).digest();
  return crypto.timingSafeEqual(expected, actual);
}

function blocked(ip) {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.until <= now) attempts.delete(key);
  }
  return (attempts.get(ip)?.count || 0) >= 10;
}

function failAttempt(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.until <= now) attempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
  else current.count++;
}

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/total') {
    try {
      return json(res, 200, readTotal.get() || { kilograms: null, updatedAt: null });
    } catch (error) {
      console.error('Could not read the waste total:', error);
      return json(res, 500, { error: 'Could not load the waste total.' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/total') {
    if (!password) return json(res, 503, { error: 'The host has not configured an admin password.' });
    if (req.headers.origin) {
      let origin;
      try {
        origin = new URL(req.headers.origin);
      } catch {
        return json(res, 403, { error: 'Invalid request origin.' });
      }
      if (origin.host !== req.headers.host || !['http:', 'https:'].includes(origin.protocol)) {
        return json(res, 403, { error: 'Requests must come from this site.' });
      }
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      return json(res, 415, { error: 'Expected JSON.' });
    }
    const ip = req.socket.remoteAddress || 'unknown';
    if (blocked(ip)) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    let body = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', chunk => {
      if (tooLarge) return;
      body += chunk;
      if (body.length > 4096) {
        tooLarge = true;
        body = '';
      }
    });
    req.on('end', () => {
      if (tooLarge) return json(res, 413, { error: 'Request is too large.' });
      let input;
      try {
        input = JSON.parse(body);
      } catch {
        return json(res, 400, { error: 'Invalid request.' });
      }
      if (!input || typeof input.password !== 'string' || !samePassword(input.password)) {
        failAttempt(ip);
        return json(res, 401, { error: 'Incorrect host password.' });
      }
      if (typeof input.kilograms !== 'number' || !Number.isFinite(input.kilograms) || input.kilograms < 0 || input.kilograms > 1000000 || Math.abs(Math.round(input.kilograms * 100) - input.kilograms * 100) > 1e-7) {
        return json(res, 400, { error: 'Enter a total from 0 to 1,000,000 kg with at most two decimal places.' });
      }
      try {
        const updatedAt = new Date().toISOString();
        writeTotal.run(input.kilograms, updatedAt);
        attempts.delete(ip);
        return json(res, 200, { kilograms: input.kilograms, updatedAt });
      } catch (error) {
        console.error('Could not save the waste total:', error);
        return json(res, 500, { error: 'Could not save the waste total.' });
      }
    });
    return;
  }

  const file = files[url.pathname];
  if (req.method !== 'GET' || !file) return json(res, 404, { error: 'Not found.' });
  fs.readFile(path.join(__dirname, file[0]), (error, content) => {
    if (error) {
      console.error(`Could not read ${file[0]}:`, error);
      return json(res, 500, { error: 'Could not load this page.' });
    }
    res.writeHead(200, { 'Content-Type': file[1] });
    res.end(content);
  });
});

server.listen(port, host, () => console.log(`E-waste site running at http://${host}:${server.address().port}`));
