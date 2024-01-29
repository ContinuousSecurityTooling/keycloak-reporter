import { Options } from './client.js';

export class WebhookConfig {
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

export class ConvertConfig {
  format: string;
  output: string;
  reports: ReportConfig;
  config: WebhookConfig;
  json: object;
  constructor(format: string, output: string, reports: ReportConfig, config: WebhookConfig, json: object) {
    this.format = format;
    this.output = output;
    this.reports = reports;
    this.config = config;
    this.json = json;
  }
}
export function getConvertConfig(config, argv, name: string, title: string, json: object): ConvertConfig {
  return new ConvertConfig(
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

export function getKeycloakConfig(config, argv): Options {
  return {
    clientId: config.clientId ? config.clientId : (argv?.clientId as string),
    clientSecret: config.clientSecret ? config.clientSecret : (argv?.clientSecret as string),
    rootUrl: config.url ? config.url : (argv?.url as string),
    useAuditingEndpoint: argv?.useAuditingEndpoint == true || config.useAuditingEndpoint?.toLowerCase() == 'true',
  };
}
