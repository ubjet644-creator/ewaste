'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const testPassword = 'test123';

async function start(dbPath, password = testPassword) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0', DATA_FILE: dbPath, ADMIN_PASSWORD: password },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let errors = '';
  child.stderr.on('data', data => { errors += data; });
  const address = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) resolve(`http://127.0.0.1:${match[1]}`);
    });
    child.on('error', reject);
    child.on('exit', code => reject(new Error(`Server exited with ${code}: ${errors}`)));
  });
  return { child, address };
}

async function stop(child) {
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

test('shared counter validates updates and survives a restart', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewaste-test-'));
  const dbPath = path.join(dir, 'test.sqlite');
  let server;
  try {
    server = await start(dbPath);
    const get = () => fetch(`${server.address}/api/total`).then(response => response.json());
    const post = (body, extraHeaders = {}) => fetch(`${server.address}/api/total`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body)
    });
    assert.deepEqual(await get(), { kilograms: null, updatedAt: null });
    assert.equal((await post({ password: 'wrong', kilograms: 1 })).status, 401);
    assert.equal((await post({ password: testPassword, kilograms: -1 })).status, 400);
    assert.equal((await post({ password: testPassword, kilograms: 1.234 })).status, 400);
    assert.equal((await post({ password: testPassword, kilograms: 1 }, { Origin: 'https://other.example' })).status, 403);
    assert.equal((await post({ password: testPassword, kilograms: 0.29 })).status, 200);
    assert.equal((await get()).kilograms, 0.29);
    assert.equal((await fetch(`${server.address}/`)).status, 200);
    assert.equal((await fetch(`${server.address}/server.js`)).status, 404);
    await stop(server.child);
    server = await start(dbPath);
    assert.equal((await get()).kilograms, 0.29);
    await stop(server.child);
    server = await start(dbPath, '');
    assert.equal((await post({ password: testPassword, kilograms: 3 })).status, 503);
  } finally {
    if (server && server.child.exitCode === null && server.child.signalCode === null) await stop(server.child);
    for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file));
    fs.rmdirSync(dir);
  }
});
