import KcAdminClient from '@keycloak/keycloak-admin-client';
import { AuditClient } from '@continuoussecuritytooling/keycloak-auditor';
import logger from './logger.js';

export interface Options {
  clientId: string;
  clientSecret: string;
  rootUrl: string;
  useAuditingEndpoint: boolean;
}

export async function createClient(options: Options): Promise<KcAdminClient | AuditClient> {
  const kcAdminClient = options.useAuditingEndpoint
    ? new AuditClient(options.rootUrl, 'master')
    : new KcAdminClient({
        baseUrl: options.rootUrl,
        realmName: 'master',
      });
  try {
    // client login
    await kcAdminClient.auth({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      grantType: 'client_credentials',
    });
  } catch (e) {
    const err = e as { response?: unknown; responseData?: { error_description?: string } };
    logger.error('Check Client Config:', err.response ? err.responseData?.error_description : e);
    return Promise.reject(err.response ? err.responseData?.error_description : e);
  }
  return Promise.resolve(kcAdminClient);
}
