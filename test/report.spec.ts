const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();
jest.mock('../lib/logger.js', () => ({ error: mockLoggerError, info: mockLoggerInfo }));

const mockConvertJSON2CSV = jest.fn();
jest.mock('../lib/convert.js', () => ({ convertJSON2CSV: mockConvertJSON2CSV }));

const mockPost2Webhook = jest.fn();
jest.mock('../lib/output.js', () => ({ post2Webhook: mockPost2Webhook }));

const mockWriteFileSync = jest.fn();
jest.mock('node:fs', () => ({ writeFileSync: mockWriteFileSync }));

import path from 'path';
import { convert } from '../lib/report.js';
import { ConvertConfig, WebhookConfig } from '../lib/utils.js';

function makeConfig(overrides: Partial<ConvertConfig> = {}): ConvertConfig {
  const base = new ConvertConfig(
    'json',
    'stdout',
    { name: 'report', directory: '' },
    new WebhookConfig('generic', '', ''),
    { key: 'value' }
  );
  return Object.assign(base, overrides);
}

describe('convert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('formats as JSON by default and writes to stdout', async () => {
    const cfg = makeConfig();
    await convert(cfg);
    expect(mockLoggerInfo).toHaveBeenCalledWith(JSON.stringify({ key: 'value' }));
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test('formats as CSV when requested', async () => {
    mockConvertJSON2CSV.mockResolvedValue('csv,content');
    const cfg = makeConfig({ format: 'csv' });
    await convert(cfg);
    expect(mockConvertJSON2CSV).toHaveBeenCalledWith({ key: 'value' });
    expect(mockLoggerInfo).toHaveBeenCalledWith('csv,content');
  });

  test('writes a report file when a directory is configured', async () => {
    const cfg = makeConfig({ reports: { name: 'report', directory: '/tmp/reports' } });
    const date = new Date();
    await convert(cfg);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    const [filePath, content] = mockWriteFileSync.mock.calls[0];
    const expectedPath = path.join(
      '/tmp/reports',
      `report_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.json`
    );
    expect(filePath).toBe(expectedPath);
    expect(content).toBe(JSON.stringify({ key: 'value' }));
  });

  test('throws when webhook output is requested without a URL', async () => {
    const cfg = makeConfig({ output: 'webhook' });
    await expect(convert(cfg)).rejects.toThrow('Please provide a valid --webhookUrl parameter');
    expect(mockLoggerError).toHaveBeenCalledWith('No valid Webhook URL given');
  });

  test('sends the report via webhook when configured', async () => {
    mockPost2Webhook.mockResolvedValue(undefined);
    const cfg = makeConfig({
      output: 'webhook',
      config: new WebhookConfig('generic', 'https://example.com/webhook', 'My Title', 'a message'),
    });
    await convert(cfg);
    expect(mockPost2Webhook).toHaveBeenCalledWith(
      'generic',
      'https://example.com/webhook',
      'My Title',
      JSON.stringify({ key: 'value' }),
      'a message'
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith('Done sending.');
  });

  test.each([
    ['Request failed with status code 400', 'Invalid Teams Payload'],
    ['slack_webhook_http_error', 'Invalid Slack Payload'],
    ['generic_webhook_http_error', 'Invalid Generic Webhook request'],
  ])('maps webhook error code %s to %s', async (code, expectedMessage) => {
    mockPost2Webhook.mockRejectedValue({ code });
    const cfg = makeConfig({
      output: 'webhook',
      config: new WebhookConfig('generic', 'https://example.com/webhook', 'My Title'),
    });
    await expect(convert(cfg)).rejects.toThrow(expectedMessage);
  });

  test('rethrows unknown webhook errors', async () => {
    const unknownError = { code: 'something_else', original: 'boom' };
    mockPost2Webhook.mockRejectedValue(unknownError);
    const cfg = makeConfig({
      output: 'webhook',
      config: new WebhookConfig('generic', 'https://example.com/webhook', 'My Title'),
    });
    await expect(convert(cfg)).rejects.toBe(unknownError);
    expect(mockLoggerError).toHaveBeenCalledWith('Error during sending webhook.(something_else)', 'boom');
  });
});
