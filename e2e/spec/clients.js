'use strict';

import { test } from 'tape';
import { spawn } from 'node:child_process';
import path from 'node:path';

test('Should list clients as JSON', (t) => {
  const cli = spawn(
    path.join(path.dirname('.'), 'node'),
    [
      'dist/cli.js',
      'listClients',
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
  cli.stdout.on('data', (chunk) => {
    t.equal(JSON.parse(chunk.toString()).length, 24);
  });
  cli.stdout.on('end', () => {
    t.end();
  });
});
