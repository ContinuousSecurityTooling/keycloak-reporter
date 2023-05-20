import KcAdminClient from '@keycloak/keycloak-admin-client';

export interface User {
  username: string;
  realm: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
}

export interface Client {
  client: string;
  realm: string;
  description: string;
  enabled: boolean;
  public: boolean;
  allowedOrigins: string;
}

export async function clientListing(
  client: KcAdminClient
): Promise<Array<Client>> {
  const currentRealm = client.realmName;

  // iterate over realms
  const realms = await client.realms.find();
  let allClients = new Array<Client>();
  for (const realm of realms) {
    // switch realm
    client.setConfig({
      realmName: realm.realm,
    });
    const realmClients = new Array<Client>();
    for (const user of await client.clients.find()) {
      realmClients.push({
        client: user.clientId,
        description: user.description,
        realm: realm.realm,
        enabled: user.enabled,
        public: user.publicClient,
        allowedOrigins: JSON.stringify(user.webOrigins),
      });
    }
    allClients = [...allClients, ...realmClients];
  }
  // switch back to realm
  client.setConfig({
    realmName: currentRealm,
  });

  return new Promise((resolve) => resolve(allClients));
}

export async function userListing(client: KcAdminClient): Promise<Array<User>> {
  const currentRealm = client.realmName;

  // iterate over realms
  const realms = await client.realms.find();
  let allUsers = new Array<User>();
  for (const realm of realms) {
    // switch realm
    client.setConfig({
      realmName: realm.realm,
    });
    const realmUsers = new Array<User>();
    for (const user of await client.users.find()) {
      realmUsers.push({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        realm: realm.realm,
        enabled: user.enabled,
      });
    }
    allUsers = [...allUsers, ...realmUsers];
  }
  // switch back to realm
  client.setConfig({
    realmName: currentRealm,
  });

  return new Promise((resolve) => resolve(allUsers));
}
