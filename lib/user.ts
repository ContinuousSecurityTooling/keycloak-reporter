import KcAdminClient from '@keycloak/keycloak-admin-client';

export interface User {
  username: string;
  realm: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
}

export interface Client {
  client: string;
  realm: string;
  id: string;
  description: string;
  enabled: boolean;
  public: boolean;
  allowedOrigins: string;
}

export async function clientListing(
  client: KcAdminClient
): Promise<Array<Client>> {
  const currentRealm = client.realmName;
  let realms;
  try {
    // iterate over realms
    realms = await client.realms.find();
  } catch (e) {
    console.error('Check Client role:', e.response.statusText);
    return Promise.reject();
  }
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
        id: user.id,
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
  let realms;
  // iterate over realms
  try {
    realms = await client.realms.find();
  } catch (e) {
    console.error('Check Client role:', e.response.statusText);
    return Promise.reject();
  }
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
        id: user.id,
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
