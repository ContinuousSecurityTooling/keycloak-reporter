/// <reference types="jest-extended" />
import { post2Webhook } from '../lib/output';

type Block = {
  type: string;
  text?: string;
  elements?: Array<{ text: string }>;
  fields?: Array<{ text: string }>;
  facts?: Array<{ title: string; value: string }>;
};

const mockSlackSend = jest.fn();
jest.mock('@slack/webhook', () => ({
  IncomingWebhook: jest.fn().mockImplementation(() => ({
    send: mockSlackSend
  }))
}));

const mockTeamsSend = jest.fn();
jest.mock('ms-teams-webhook', () => ({
  IncomingWebhook: jest.fn().mockImplementation(() => ({
    send: mockTeamsSend
  }))
}));

describe('post2Webhook - Slack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSlackSend.mockResolvedValue({});
  });

  test('posts to Slack webhook', async () => {
    await post2Webhook('slack', 'https://hooks.slack.com/test', 'Users Report', 'report content');
    expect(mockSlackSend).toHaveBeenCalledTimes(1);
    expect(mockSlackSend).toHaveBeenCalledWith(
      expect.objectContaining({ blocks: expect.any(Array) })
    );
  });

  test('posts to Slack webhook with message', async () => {
    await post2Webhook('slack', 'https://hooks.slack.com/test', 'Users Report', 'report content', 'Hello from CI');
    expect(mockSlackSend).toHaveBeenCalledTimes(1);
    const blocks = mockSlackSend.mock.calls[0][0].blocks;
    const contextBlock = (blocks as Block[]).find((b) => b.type === 'context' && b.elements?.[0]?.text === 'Hello from CI');
    expect(contextBlock).toBeDefined();
  });

  test('Slack payload includes title and date fields', async () => {
    await post2Webhook('slack', 'https://hooks.slack.com/test', 'My Title', 'content');
    const blocks = mockSlackSend.mock.calls[0][0].blocks;
    const sectionBlock = (blocks as Block[]).find((b) => b.type === 'section');
    expect(sectionBlock!.fields![0].text).toContain('My Title');
  });
});

describe('post2Webhook - Teams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamsSend.mockResolvedValue({});
  });

  test('posts to Teams webhook', async () => {
    await post2Webhook('teams', 'https://outlook.office.com/webhook/test', 'Clients Report', 'report content');
    expect(mockTeamsSend).toHaveBeenCalledTimes(1);
    expect(mockTeamsSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'message' })
    );
  });

  test('posts to Teams webhook with message', async () => {
    await post2Webhook('teams', 'https://outlook.office.com/webhook/test', 'Clients Report', 'report content', 'Hello from CI');
    expect(mockTeamsSend).toHaveBeenCalledTimes(1);
    const attachment = mockTeamsSend.mock.calls[0][0].attachments[0];
    const textBlock = (attachment.content.body as Block[]).find((b) => b.type === 'TextBlock' && b.text === 'Hello from CI');
    expect(textBlock).toBeDefined();
  });

  test('Teams payload includes title in FactSet', async () => {
    await post2Webhook('teams', 'https://outlook.office.com/webhook/test', 'My Title', 'content');
    const attachment = mockTeamsSend.mock.calls[0][0].attachments[0];
    const factSet = (attachment.content.body as Block[]).find((b) => b.type === 'FactSet');
    const typeFact = factSet!.facts!.find((f) => f.title === 'Type');
    expect(typeFact!.value).toBe('My Title');
  });
});

describe('post2Webhook - Generic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('posts to generic webhook', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    await post2Webhook('generic', 'https://example.com/webhook', 'Users Report', 'report content');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  test('generic webhook payload contains title, date and reportContent', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    await post2Webhook('generic', 'https://example.com/webhook', 'My Title', 'my content');
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.title).toBe('My Title');
    expect(body.reportContent).toBe('my content');
    expect(body.date).toBeDefined();
    expect(body.message).toBeUndefined();
  });

  test('generic webhook payload includes message when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    await post2Webhook('generic', 'https://example.com/webhook', 'My Title', 'my content', 'Hello from CI');
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.message).toBe('Hello from CI');
  });

  test('throws on generic webhook HTTP error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    await expect(
      post2Webhook('generic', 'https://example.com/webhook', 'My Title', 'my content')
    ).rejects.toThrow('Generic webhook request failed with status 500');
  });

  test('thrown error has generic_webhook_http_error code', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400 });
    const err = await post2Webhook('generic', 'https://example.com/webhook', 'My Title', 'my content').catch((e) => e);
    expect((err as NodeJS.ErrnoException).code).toBe('generic_webhook_http_error');
  });
});
