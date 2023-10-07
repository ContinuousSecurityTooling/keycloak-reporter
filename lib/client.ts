import KcAdminClient from '@keycloak/keycloak-admin-client';

export interface Options {
  clientId: string;
  clientSecret: string;
  rootUrl: string;
}

export async function createClient(options: Options): Promise<KcAdminClient> {
  const kcAdminClient = new KcAdminClient({
    baseUrl: options.rootUrl,
    realmName: 'master'
  });

  try {
    // client login
    await kcAdminClient.auth({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      grantType: 'client_credentials'
    });
  } catch (e) {
    console.error(
      'Check Client Config:',
      e.response ? e.response.data.error_description : e
    );
    return Promise.reject();
  }

  return new Promise((resolve) => resolve(kcAdminClient));
}
