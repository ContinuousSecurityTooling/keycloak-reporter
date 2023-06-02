'use strict';

import { test } from 'tape';
import { spawn } from 'node:child_process';
import path from 'node:path';

test('Should use config file', { timeout: 3000 }, (t) => {
  const cli = spawn(
    path.join(path.dirname('.'), 'node'),
    [
      'dist/cli.js',
      'listClients'
    ],
    {
      env: {
        CONFIG_FILE: process.cwd() + '/e2e/fixtures/config.json',
        ...process.env,
      },
    }
  );
  cli.stdout.on('data', (chunk) => {
    console.log(chunk.toString())
    t.equal(JSON.parse(chunk.toString()).length, 24);
  });
  cli.stderr.on('data', (msg) => {
    t.fail(msg)
  });
  cli.stdout.on('end', () => {
    t.end();
  });
});
