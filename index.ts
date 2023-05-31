#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { listUsers, listClients } from './src/cli.js';
import { Options } from './lib/client.js';
import { convertJSON2CSV } from './lib/convert.js';
import { post2Webhook } from './lib/output.js';

class WebhookConfig {
  type: string;
  url: string;
  title: string;
  constructor(type: string, url: string, title: string) {
    this.type = type;
    this.url = url;
    this.title = title;
  }
}

async function convert(
  format: string,
  output: string,
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
  switch (output) {
    case 'webhook':
      try {
        await post2Webhook(
          config.type,
          config.url,
          config.title,
          outputContent
        );
      } catch (e) {
        console.error('Error during sending webhook: ', e);
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
        clientId: argv.clientId as string,
        clientSecret: argv.clientSecret as string,
        rootUrl: argv.url as string,
      });
      await convert(
        argv.format as string,
        argv.output as string,
        new WebhookConfig(
          argv.webhookType as string,
          argv.webhookUrl as string,
          'User Listing'
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
        clientId: argv.clientId as string,
        clientSecret: argv.clientSecret as string,
        rootUrl: argv.url as string,
      });
      await convert(
        argv.format as string,
        argv.output as string,
        new WebhookConfig(
          argv.webhookType as string,
          argv.webhookUrl as string,
          'Client Listing'
        ),
        clients
      );
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
  .option('webhookUrl', {
    alias: 't',
    type: 'string',
    description: 'Webhook URL',
  })
  .parse();
