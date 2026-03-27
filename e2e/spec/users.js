'use strict';

import { test } from 'tape';
import { spawn } from 'node:child_process';
import path from 'node:path';

test('Should list users as JSON', { timeout: 10000 }, (t) => {
  const cli = spawn(
    path.join(path.dirname('.'), 'node'),
    [
      'dist/cli.js',
      'listUsers',
      'http://localhost:8080',
      'keycloak-reporter',
      '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
    ],
    {
      env: {
        ...process.env,
      },
    }
  );
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
    t.equal(parsed.length, 2);
    t.end();
  });
});
