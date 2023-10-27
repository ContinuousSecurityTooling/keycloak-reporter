import KcAdminClient from '@keycloak/keycloak-admin-client';
import { AuditClient } from '@continuoussecuritytooling/keycloak-auditor';

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
    console.error('Check Client Config:', e.response ? e.response.data.error_description : e);
    return Promise.reject();
  }

  return new Promise((resolve) => resolve(kcAdminClient));
}
