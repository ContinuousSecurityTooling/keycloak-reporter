#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import {
  listUsers,
  listClients,
  Options,
  convertJSON2CSV,
  post2Webhook
} from './index.js';
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

async function convert(
  format: string,
  output: string,
  reports: ReportConfig,
  config: WebhookConfig,
  json: object
) {
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
        `${reports.name}_${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}.${format.toLowerCase()}`
      ),
      outputContent
    );
  }
  switch (output) {
    case 'webhook':
      try {
        await post2Webhook(
          config.type,
          config.url,
          config.title,
          outputContent,
          config.message
        );
      } catch (e) {
        switch (e.code || e.message) {
          case 'Request failed with status code 400':
            console.error('Invalid Teams Webhook Payload. Check your params.');
            throw new Error('Invalid Teams Payload');
          case 'slack_webhook_http_error':
            console.error('Invalid Slack Webhook Payload. Check your params.');
            throw new Error('Invalid Slack Payload');
          default:
            console.error(
              `Error during sending webhook.(${e?.code})`,
              e?.original
            );
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
      const users = await listUsers(<Options>{
        clientId: argv.clientId ? (argv.clientId as string) : config.clientId,
        clientSecret: argv.clientSecret
          ? (argv.clientSecret as string)
          : config.clientSecret,
        rootUrl: argv.url ? (argv.url as string) : config.url
      });
      await convert(
        argv.format as string,
        argv.output as string,
        {
          name: 'user_listing',
          directory: argv.reports as string
        },
        new WebhookConfig(
          argv.webhookType as string,
          argv.webhookUrl as string,
          'User Listing',
          argv.webhookMessage
            ? (argv.webhookMessage as string)
            : config.webhookMessage
        ),
        users
      );
    }
  )
  .command(
    'listClients [url] [clientId] [clientSecret]',
    'fetches all clients in the realms.',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
    async (argv) => {
      const clients = await listClients(<Options>{
        clientId: argv.clientId ? (argv.clientId as string) : config.clientId,
        clientSecret: argv.clientSecret
          ? (argv.clientSecret as string)
          : config.clientSecret,
        rootUrl: argv.url ? (argv.url as string) : config.url
      });
      await convert(
        argv.format as string,
        argv.output as string,
        {
          name: 'client_listing',
          directory: argv.reports as string
        },
        new WebhookConfig(
          argv.webhookType as string,
          argv.webhookUrl as string,
          'Client Listing',
          argv.webhookMessage
            ? (argv.webhookMessage as string)
            : config.webhookMessage
        ),
        clients
      );
    }
  )
  .option('format', {
    alias: 'f',
    type: 'string',
    default: 'json',
    description: 'output format, e.g. JSON|CSV'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    default: 'stdout',
    description: 'output channel'
  })
  .option('webhookType', {
    alias: 'w',
    type: 'string',
    default: 'slack',
    description: 'Webhook Type'
  })
  .option('webhookMessage', {
    alias: 'm',
    type: 'string',
    description: 'Webhook Message'
  })
  .option('webhookUrl', {
    alias: 't',
    type: 'string',
    description: 'Webhook URL'
  })
  .option('reports', {
    alias: 'r',
    type: 'string',
    description: 'Reports directory'
  })
  .parse();
