'use strict';

import { test } from 'tape';
import { spawn } from 'node:child_process';
import path from 'node:path';

test('Should post message to Teams', { timeout: 10000 }, (t) => {
  const cli = spawn(
    path.join(path.dirname('.'), 'node'),
    [
      'dist/cli.js',
      'listUsers',
      'http://localhost:8080',
      'keycloak-reporter',
      '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
      '--output=webhook',
      '--webhookType=teams',
      '--webhookUrl=' + process.env.WEBHOOK_TESTING_TEAMS
    ],
    {
      env: {
        ...process.env
      }
    }
  );
  cli.stdout.on('data', (chunk) => {
    console.log(chunk.toString());
  });
  cli.stderr.on('data', (msg) => {
    t.fail(msg);
  });
  cli.stdout.on('end', () => {
    t.end();
  });
});

test(
  'Should post message to Teams with additional message',
  { timeout: 10000 },
  (t) => {
    const cli = spawn(
      path.join(path.dirname('.'), 'node'),
      [
        'dist/cli.js',
        'listUsers',
        'http://localhost:8080',
        'keycloak-reporter',
        '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
        '--output=webhook',
        '--webhookType=teams',
        '--webhookUrl=' + process.env.WEBHOOK_TESTING_TEAMS,
        '--webhookMessage="From Github Actions"'
      ],
      {
        env: {
          ...process.env
        }
      }
    );
    cli.stdout.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    cli.stderr.on('data', (msg) => {
      t.fail(msg);
    });
    cli.stdout.on('end', () => {
      t.end();
    });
  }
);

test(
  'Should post message to Slack with additional message',
  { timeout: 10000 },
  (t) => {
    const cli = spawn(
      path.join(path.dirname('.'), 'node'),
      [
        'dist/cli.js',
        'listUsers',
        'http://localhost:8080',
        'keycloak-reporter',
        '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
        '--output=webhook',
        '--webhookType=slack',
        '--webhookUrl=' + process.env.WEBHOOK_TESTING_SLACK,
        '--webhookMessage="From Github Actions"'
      ],
      {
        env: {
          ...process.env
        }
      }
    );
    cli.stdout.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    cli.stderr.on('data', (msg) => {
      t.fail(msg);
    });
    cli.stdout.on('end', () => {
      t.end();
    });
  }
);

test('Should post message to Slack', { timeout: 10000 }, (t) => {
  const cli = spawn(
    path.join(path.dirname('.'), 'node'),
    [
      'dist/cli.js',
      'listUsers',
      'http://localhost:8080',
      'keycloak-reporter',
      '3UYhI2hryFwoVtcd7ljlaDuD9HXrGV5r',
      '--output=webhook',
      '--webhookType=slack',
      '--webhookUrl=' + process.env.WEBHOOK_TESTING_SLACK
    ],
    {
      env: {
        ...process.env
      }
    }
  );
  cli.stdout.on('data', (chunk) => {
    console.log(chunk.toString());
  });
  cli.stderr.on('data', (msg) => {
    t.fail(msg);
  });
  cli.stdout.on('end', () => {
    t.end();
  });
});
