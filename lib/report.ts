import { writeFileSync } from 'node:fs';
import path from 'path';
import { convertJSON2CSV } from './convert.js';
import { post2Webhook } from './output.js';
import { ConvertConfig } from './utils.js';

export async function convert(cfg: ConvertConfig) {
  let outputContent: string;
  switch (cfg.format) {
    case 'csv':
      outputContent = (await convertJSON2CSV(cfg.json)).toString();
      break;
    // defaulting to JSON
    default:
      outputContent = JSON.stringify(cfg.json);
  }
  if (cfg.reports.directory) {
    const date = new Date();
    writeFileSync(
      path.join(
        `${cfg.reports.directory}`,
        `${cfg.reports.name}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.${cfg.format.toLowerCase()}`
      ),
      outputContent
    );
  }
  switch (cfg.output) {
    case 'webhook':
      if (!cfg.config.url) {
        console.error('No valid Webhook URL given');
        throw new Error('Please provide a valid --webhookUrl parameter');
      }
      try {
        console.log(`Sending report via webhook to ${cfg.config.type} ....`);
        await post2Webhook(cfg.config.type, cfg.config.url, cfg.config.title, outputContent, cfg.config.message);
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
