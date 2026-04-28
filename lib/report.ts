import { writeFileSync } from 'node:fs';
import path from 'path';
import { convertJSON2CSV } from './convert.js';
import { post2Webhook } from './output.js';
import { ConvertConfig } from './utils.js';
import logger from './logger.js';

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
        logger.error('No valid Webhook URL given');
        throw new Error('Please provide a valid --webhookUrl parameter');
      }
      try {
        logger.info(`Sending report via webhook to ${cfg.config.type} ....`);
        await post2Webhook(cfg.config.type, cfg.config.url, cfg.config.title, outputContent, cfg.config.message);
        logger.info('Done sending.');
      } catch (e) {
        const err = e as { code?: string; message?: string; original?: unknown };
        switch (err.code || err.message) {
          case 'Request failed with status code 400':
            logger.error('Invalid Teams Webhook Payload. Check your params.');
            throw new Error('Invalid Teams Payload', { cause: e });
          case 'slack_webhook_http_error':
            logger.error('Invalid Slack Webhook Payload. Check your params.');
            throw new Error('Invalid Slack Payload', { cause: e });
          case 'generic_webhook_http_error':
            logger.error('Generic Webhook request failed. Check your URL and params.');
            throw new Error('Invalid Generic Webhook request', { cause: e });
          default:
            logger.error(`Error during sending webhook.(${err.code})`, err.original);
            throw e;
        }
      }
      break;
    // defaulting to standard out
    default:
      logger.info(outputContent);
  }
}
