const mockLoggerError = jest.fn();
jest.mock('../lib/logger.js', () => ({ error: mockLoggerError, info: jest.fn() }));

const mockRealmsFind = jest.fn();
const mockClientsFind = jest.fn();
const mockUsersFind = jest.fn();
const mockSetConfig = jest.fn();

class MockKcAdminClient {
  realmName = 'master';
  realms = { find: mockRealmsFind };
  clients = { find: mockClientsFind };
  users = { find: mockUsersFind };
  setConfig = mockSetConfig;
}
jest.mock('@keycloak/keycloak-admin-client', () => MockKcAdminClient);

import KcAdminClientModule from '@keycloak/keycloak-admin-client';
import { AuditClient, AuditedClientRepresentation, AuditedUserRepresentation } from '@continuoussecuritytooling/keycloak-auditor';
import { clientListing, userListing } from '../lib/user.js';

describe('clientListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('iterates realms and collects clients for a KcAdminClient, then restores the original realm', async () => {
    const client = new KcAdminClientModule() as unknown as InstanceType<typeof KcAdminClientModule>;
    mockRealmsFind.mockResolvedValue([{ realm: 'realm-a' }, { realm: 'realm-b' }]);
    mockClientsFind
      .mockResolvedValueOnce([
        { clientId: 'client-1', id: 'id-1', description: 'desc-1', enabled: true, publicClient: false, webOrigins: ['https://a.com'] },
      ])
      .mockResolvedValueOnce([
        { clientId: 'client-2', id: 'id-2', description: 'desc-2', enabled: false, publicClient: true, webOrigins: [] },
      ]);

    const result = await clientListing(client);

    expect(result).toEqual([
      { client: 'client-1', id: 'id-1', description: 'desc-1', realm: 'realm-a', enabled: true, public: false, allowedOrigins: JSON.stringify(['https://a.com']) },
      { client: 'client-2', id: 'id-2', description: 'desc-2', realm: 'realm-b', enabled: false, public: true, allowedOrigins: JSON.stringify([]) },
    ]);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, { realmName: 'realm-a' });
    expect(mockSetConfig).toHaveBeenNthCalledWith(2, { realmName: 'realm-b' });
    expect(mockSetConfig).toHaveBeenLastCalledWith({ realmName: 'master' });
  });

  test('rejects with Client Role Error when realms.find fails', async () => {
    const client = new KcAdminClientModule() as unknown as InstanceType<typeof KcAdminClientModule>;
    mockRealmsFind.mockRejectedValue({ response: { statusText: 'Forbidden' } });

    await expect(clientListing(client)).rejects.toThrow('Client Role Error');
    expect(mockLoggerError).toHaveBeenCalledWith('Check Client role:', 'Forbidden');
  });

  test('delegates to AuditClient.clientListing for non-admin clients', async () => {
    const auditClient = {
      clientListing: jest.fn().mockResolvedValue([
        { clientId: 'client-1', id: 'id-1', description: 'desc-1', realm: 'realm-a', enabled: true, publicClient: false, lastLogin: '2024-01-01', webOrigins: ['https://a.com'] },
      ] as unknown as AuditedClientRepresentation[]),
    } as unknown as AuditClient;

    const result = await clientListing(auditClient);

    expect(result).toEqual([
      { client: 'client-1', id: 'id-1', description: 'desc-1', realm: 'realm-a', enabled: true, public: false, lastLogin: '2024-01-01', allowedOrigins: JSON.stringify(['https://a.com']) },
    ]);
  });
});

describe('userListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('iterates realms and collects users for a KcAdminClient, then restores the original realm', async () => {
    const client = new KcAdminClientModule() as unknown as InstanceType<typeof KcAdminClientModule>;
    mockRealmsFind.mockResolvedValue([{ realm: 'realm-a' }]);
    mockUsersFind.mockResolvedValueOnce([
      { username: 'alice', id: 'id-1', firstName: 'Alice', lastName: 'A', email: 'alice@example.com', enabled: true },
    ]);

    const result = await userListing(client);

    expect(result).toEqual([
      { username: 'alice', id: 'id-1', firstName: 'Alice', lastName: 'A', email: 'alice@example.com', realm: 'realm-a', enabled: true },
    ]);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, { realmName: 'realm-a' });
    expect(mockSetConfig).toHaveBeenLastCalledWith({ realmName: 'master' });
  });

  test('rejects with Client Role Error when realms.find fails', async () => {
    const client = new KcAdminClientModule() as unknown as InstanceType<typeof KcAdminClientModule>;
    mockRealmsFind.mockRejectedValue({ response: { statusText: 'Forbidden' } });

    await expect(userListing(client)).rejects.toThrow('Client Role Error');
    expect(mockLoggerError).toHaveBeenCalledWith('Check Client role:', 'Forbidden');
  });

  test('delegates to AuditClient.userListing for non-admin clients', async () => {
    const auditClient = {
      userListing: jest.fn().mockResolvedValue([
        { username: 'alice', id: 'id-1', firstName: 'Alice', lastName: 'A', email: 'alice@example.com', realm: 'realm-a', lastLogin: '2024-01-01', enabled: true },
      ] as unknown as AuditedUserRepresentation[]),
    } as unknown as AuditClient;

    const result = await userListing(auditClient);

    expect(result).toEqual([
      { username: 'alice', id: 'id-1', firstName: 'Alice', lastName: 'A', email: 'alice@example.com', realm: 'realm-a', lastLogin: '2024-01-01', enabled: true },
    ]);
  });

  test('rejects when the auditing endpoint is not reachable', async () => {
    const auditClient = {
      userListing: jest.fn().mockResolvedValue({ error: 'unreachable' }),
    } as unknown as AuditClient;

    await expect(userListing(auditClient)).rejects.toThrow('Auditing endpoint not reachable');
  });
});
