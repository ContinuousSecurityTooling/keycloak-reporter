import { Issuer } from 'openid-client';
import KcAdminClient from '@keycloak/keycloak-admin-client';

// Token refresh interval 60 seconds
const TOKEN_REFRESH = 60;

export interface Options {
  clientId: string;
  clientSecret: string;
  rootUrl: string;
}

export async function createClient(options: Options): Promise<KcAdminClient> {
  const kcAdminClient = new KcAdminClient({
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
    console.error('Check Client Config:',e.response.data.error_description);
    return Promise.reject();
  }

  const keycloakIssuer = await Issuer.discover(
    `${options.rootUrl}/realms/master`
  );

  const client = new keycloakIssuer.Client({
    client_id: options.clientId,
    token_endpoint_auth_method: 'none', // to send only client_id in the header
  });

  // Use the grant type 'password'
  const tokenSet = await client.grant({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    grant_type: 'client_credentials',
  });

  /*
  // TODO: FIXME - Periodically using refresh_token grant flow to get new access token here
  setInterval(async () => {
    const refreshToken = tokenSet.refresh_token;
    kcAdminClient.setAccessToken((await client.refresh(refreshToken)).access_token);
  }, TOKEN_REFRESH * 1000); */

  return new Promise((resolve) => resolve(kcAdminClient));
}
