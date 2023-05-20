#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { listUsers, listClients } from './src/cli.js';
import { Options } from './lib/client.js';
import { convertJSON2CSV } from './lib/convert.js';

async function convert(format: string, output: string, json: object) {
  switch (format) {
    case 'csv':
      console.log(await convertJSON2CSV(json));
      break;
    // defaulting to JSON
    default:
      console.log(json);
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
      await convert(argv.format as string, argv.output as string, users);
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
      await convert(argv.format as string, argv.output as string, clients);
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
  .parse();
