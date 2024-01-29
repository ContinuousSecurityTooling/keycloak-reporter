#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { convert } from './lib/report.js';
import { getConvertConfig, getKeycloakConfig } from './lib/utils.js';
import { configTest, listUsers, listClients } from './index.js';
import config from './src/config.js';

yargs(hideBin(process.argv))
  .env()
  .command(
    'listUsers [url] [clientId] [clientSecret]',
    'fetches all users in the realms.',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => {
      const users = await listUsers(getKeycloakConfig(config, argv));
      convert(getConvertConfig(config, argv, 'user_listing', 'User Listing', users));
    }
  )
  .command(
    'listClients [url] [clientId] [clientSecret]',
    'fetches all clients in the realms.',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => {
      const clients = await listClients(getKeycloakConfig(config, argv));
      convert(getConvertConfig(config, argv, 'client_listing', 'Client Listing', clients));
    }
  )
  .option('format', {
    alias: 'f',
    type: 'string',
    default: 'json',
    description: 'output format, e.g. JSON|CSV',
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: 'stdout',
    description: 'output channel',
  })
  .option('webhookType', {
    alias: 'w',
    type: 'string',
    default: 'slack',
    description: 'Webhook Type',
  })
  .option('webhookMessage', {
    alias: 'm',
    type: 'string',
    description: 'Webhook Message',
  })
  .option('webhookUrl', {
    alias: 't',
    type: 'string',
    description: 'Webhook URL',
  })
  .option('reports', {
    alias: 'r',
    type: 'string',
    description: 'Reports directory',
  })
  .option('useAuditingEndpoint', {
    alias: 'a',
    type: 'boolean',
    default: false,
    description: 'use auditior rest endpoint',
  })
  .command(
    'configTest [url] [clientId] [clientSecret]',
    'validates keycloak configuration by reading data via REST API',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => configTest(getKeycloakConfig(config, argv))
  )
  .parse();
