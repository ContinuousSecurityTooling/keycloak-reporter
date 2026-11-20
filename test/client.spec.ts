const mockLoggerError = jest.fn();
jest.mock('../lib/logger.js', () => ({ error: mockLoggerError, info: jest.fn() }));

const mockKcAuth = jest.fn();
class MockKcAdminClient {
  baseUrl: string;
  realmName: string;
  auth = mockKcAuth;
  constructor(options: { baseUrl: string; realmName: string }) {
    this.baseUrl = options.baseUrl;
    this.realmName = options.realmName;
  }
}
jest.mock('@keycloak/keycloak-admin-client', () => MockKcAdminClient);

const mockAuditAuth = jest.fn();
class MockAuditClient {
  url: string;
  realm: string;
  auth = mockAuditAuth;
  constructor(url: string, realm: string) {
    this.url = url;
    this.realm = realm;
  }
}
jest.mock('@continuoussecuritytooling/keycloak-auditor', () => ({
  AuditClient: MockAuditClient,
}));

import { createClient } from '../lib/client.js';

const baseOptions = {
  clientId: 'my-client',
  clientSecret: 'my-secret',
  rootUrl: 'https://keycloak.example.com',
  useAuditingEndpoint: false,
};

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates and authenticates a KcAdminClient when not using the auditing endpoint', async () => {
    mockKcAuth.mockResolvedValue(undefined);
    const client = await createClient(baseOptions);
    expect(client).toBeInstanceOf(MockKcAdminClient);
    expect((client as unknown as MockKcAdminClient).baseUrl).toBe(baseOptions.rootUrl);
    expect(mockKcAuth).toHaveBeenCalledWith({
      clientId: baseOptions.clientId,
      clientSecret: baseOptions.clientSecret,
      grantType: 'client_credentials',
    });
    expect(mockAuditAuth).not.toHaveBeenCalled();
  });

  test('creates and authenticates an AuditClient when using the auditing endpoint', async () => {
    mockAuditAuth.mockResolvedValue(undefined);
    const options = { ...baseOptions, useAuditingEndpoint: true };
    const client = await createClient(options);
    expect(client).toBeInstanceOf(MockAuditClient);
    expect((client as unknown as MockAuditClient).url).toBe(options.rootUrl);
    expect(mockAuditAuth).toHaveBeenCalledWith({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      grantType: 'client_credentials',
    });
    expect(mockKcAuth).not.toHaveBeenCalled();
  });

  test('logs and throws responseData.error_description when auth fails with a response', async () => {
    const authError = {
      response: { status: 400 },
      responseData: { error_description: 'invalid_client' },
    };
    mockKcAuth.mockRejectedValue(authError);
    await expect(createClient(baseOptions)).rejects.toBe('invalid_client');
    expect(mockLoggerError).toHaveBeenCalledWith('Check Client Config:', 'invalid_client');
  });

  test('logs and throws the raw error when auth fails without a response', async () => {
    const authError = new Error('network down');
    mockKcAuth.mockRejectedValue(authError);
    await expect(createClient(baseOptions)).rejects.toBe(authError);
    expect(mockLoggerError).toHaveBeenCalledWith('Check Client Config:', authError);
  });
});
