'use strict';

import { test } from 'tape';
import { spawn } from 'node:child_process';
import path from 'node:path';

test('Should use config file', { timeout: 10000 }, (t) => {
  const cli = spawn(path.join(path.dirname('.'), 'node'), ['dist/cli.js', 'listClients'], {
    env: {
      CONFIG_FILE: process.cwd() + '/e2e/fixtures/config.json',
      ...process.env,
    },
  });
  let output = '';
  cli.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  cli.stderr.on('data', (msg) => {
    t.fail(msg);
  });
  cli.stdout.on('end', () => {
    const json = output.split('\n').find((line) => line.trim().startsWith('['));
    const parsed = JSON.parse(json);
    console.log('Response', parsed);
    t.equal(parsed.length, 7);
    t.end();
  });
});

test('Should validate config', { timeout: 10000 }, (t) => {
  const cli = spawn(path.join(path.dirname('.'), 'node'), ['dist/cli.js', 'configTest'], {
    env: {
      CONFIG_FILE: process.cwd() + '/e2e/fixtures/config.json',
      ...process.env,
    },
  });
  let output = '';
  cli.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  cli.stderr.on('data', (msg) => {
    t.fail(msg);
  });
  cli.stdout.on('end', () => {
    t.ok(
      output.includes('Connection to http://localhost:8080 was successful: 2 users found.'),
      'config test output matches'
    );
    t.end();
  });
});
