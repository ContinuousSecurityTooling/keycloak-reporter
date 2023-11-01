#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { listUsers, listClients, Options, convertJSON2CSV, post2Webhook } from './index.js';
import config from './src/config.js';
class WebhookConfig {
  type: string;
  url: string;
  title: string;
  message?: string;
  constructor(type: string, url: string, title: string, message?: string) {
    this.type = type;
    this.url = url;
    this.title = title;
    this.message = message;
  }
}

class ReportConfig {
  name: string;
  directory: string;
}

function getKeycloakConfig(config, argv): Options {
  return {
    clientId: config.clientId ? config.clientId : (argv.clientId as string),
    clientSecret: config.clientSecret ? config.clientSecret : (argv.clientSecret as string),
    rootUrl: config.url ? config.url : (argv.url as string),
    useAuditingEndpoint: argv.useAuditingEndpoint == true || config.useAuditingEndpoint.toLowerCase() == 'true',
  };
}

function convertData(config, argv, name: string, title: string, json: object) {
  convert(
    config.format ? config.format : (argv.format as string),
    config.output ? config.output : (argv.output as string),
    {
      name,
      directory: argv.reports ? (argv.reports as string) : config.reports,
    },
    new WebhookConfig(
      config.webhookType ? config.webhookType : (argv.webhookType as string),
      config.webhookUrl ? config.webhookUrl : (argv.webhookUrl as string),
      title,
      config.webhookMessage ? config.webhookMessage : (argv.webhookMessage as string)
    ),
    json
  );
}

async function convert(format: string, output: string, reports: ReportConfig, config: WebhookConfig, json: object) {
  let outputContent: string;
  switch (format) {
    case 'csv':
      outputContent = (await convertJSON2CSV(json)).toString();
      break;
    // defaulting to JSON
    default:
      outputContent = JSON.stringify(json);
  }
  if (reports.directory) {
    const date = new Date();
    writeFileSync(
      path.join(
        `${reports.directory}`,
        `${reports.name}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.${format.toLowerCase()}`
      ),
      outputContent
    );
  }
  switch (output) {
    case 'webhook':
      if (!config.url) {
        console.error('No valid Webhook URL given');
        throw new Error('Please provide a valid --webhookUrl parameter');
      }
      try {
        console.log(`Sending report via webhook to ${config.type} ....`);
        await post2Webhook(config.type, config.url, config.title, outputContent, config.message);
        console.log('Done sending.');
      } catch (e) {
        switch (e.code || e.message) {
          case 'Request failed with status code 400':
            console.error('Invalid Teams Webhook Payload. Check your params.');
            throw new Error('Invalid Teams Payload');
          case 'slack_webhook_http_error':
            console.error('Invalid Slack Webhook Payload. Check your params.');
            throw new Error('Invalid Slack Payload');
          default:
            console.error(`Error during sending webhook.(${e?.code})`, e?.original);
            throw e;
        }
      }
      break;
    // defaulting to standard out
    default:
      console.log(outputContent);
  }
}

yargs(hideBin(process.argv))
  .command(
    'listUsers [url] [clientId] [clientSecret]',
    'fetches all users in the realms.',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => {
      const users = await listUsers(getKeycloakConfig(config, argv));
      convertData(config, argv, 'user_listing', 'User Listing', users);
    }
  )
  .command(
    'listClients [url] [clientId] [clientSecret]',
    'fetches all clients in the realms.',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => {
      const clients = await listClients(getKeycloakConfig(config, argv));
      convertData(config, argv, 'client_listing', 'Client Listing', clients);
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
  .parse();
