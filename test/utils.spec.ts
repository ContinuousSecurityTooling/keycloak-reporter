/// <reference types="jest-extended" />
import { getKeycloakConfig, getConvertConfig, getAppConfig } from '../lib/utils.js';
test('no config', () => {
  expect(getKeycloakConfig({}, {})).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: false,
  });
});

test('config with useAuditingEndpoint', () => {
  expect(getKeycloakConfig({ useAuditingEndpoint: 'true' }, {})).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: true,
  });
});

test('argv with useAuditingEndpoint', () => {
  expect(getKeycloakConfig({}, { useAuditingEndpoint: 'true' })).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: true,
  });
});

describe('getConvertConfig', () => {
  // NB: config values take precedence over argv for format/output/webhookType/
  // webhookUrl/webhookMessage (`config.x || argv.x`), but argv takes precedence
  // over config for the reports directory (`argv.reports || config.reports`).
  test('prefers config over argv for scalar fields, but argv over config for the reports directory', () => {
    const result = getConvertConfig(
      { format: 'json', output: 'stdout', webhookType: 'slack', webhookUrl: 'https://config.example.com' },
      { format: 'csv', output: 'webhook', webhookType: 'teams', webhookUrl: 'https://argv.example.com', reports: '/tmp/reports' },
      'report-name',
      'Report Title',
      { key: 'value' }
    );
    expect(result.format).toBe('json');
    expect(result.output).toBe('stdout');
    expect(result.reports).toEqual({ name: 'report-name', directory: '/tmp/reports' });
    expect(result.config).toEqual({
      type: 'slack',
      url: 'https://config.example.com',
      title: 'Report Title',
      message: undefined,
    });
    expect(result.json).toEqual({ key: 'value' });
  });

  test('falls back to config values when argv is empty', () => {
    const result = getConvertConfig(
      { format: 'json', output: 'webhook', webhookType: 'slack', webhookUrl: 'https://config.example.com', webhookMessage: 'hi', reports: '/var/reports' },
      {},
      'report-name',
      'Report Title',
      {}
    );
    expect(result.format).toBe('json');
    expect(result.output).toBe('webhook');
    expect(result.reports).toEqual({ name: 'report-name', directory: '/var/reports' });
    expect(result.config).toEqual({
      type: 'slack',
      url: 'https://config.example.com',
      title: 'Report Title',
      message: 'hi',
    });
  });
});

describe('getAppConfig', () => {
  test('uses argv.jsonLogFormat when present', () => {
    expect(getAppConfig({ jsonLogFormat: 'false' }, { jsonLogFormat: 'true' })).toEqual({
      log: { json: true },
    });
  });

  test('falls back to config.jsonLogFormat when argv does not define it', () => {
    expect(getAppConfig({ jsonLogFormat: 'true' }, {})).toEqual({
      log: { json: true },
    });
  });

  test('defaults to false when neither config nor argv define jsonLogFormat', () => {
    expect(getAppConfig({}, {})).toEqual({
      log: { json: false },
    });
  });
});
