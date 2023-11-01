import KcAdminClient from '@keycloak/keycloak-admin-client';
import {
  AuditClient,
  AuditedClientRepresentation,
  AuditedUserRepresentation,
} from '@continuoussecuritytooling/keycloak-auditor';

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
  client: KcAdminClient | AuditClient
): Promise<Array<Client | AuditedClientRepresentation>> {
  let allClients = new Array<Client | AuditedClientRepresentation>();
  if (client instanceof KcAdminClient) {
    const currentRealm = client.realmName;
    let realms;
    try {
      // iterate over realms
      realms = await client.realms.find();
    } catch (e) {
      console.error('Check Client role:', e.response.statusText);
      return Promise.reject();
    }
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
  } else {
    const clients = await client.clientListing();
    for (const user of clients) {
      allClients.push({
        client: user.clientId,
        id: user.id,
        description: user.description,
        realm: user.realm,
        enabled: user.enabled,
        public: user.publicClient,
        lastLogin: user.lastLogin,
        allowedOrigins: JSON.stringify(user.webOrigins),
      });
    }
  }
  return new Promise((resolve) => resolve(allClients));
}

export async function userListing(
  client: KcAdminClient | AuditClient
): Promise<Array<User | AuditedUserRepresentation>> {
  let allUsers = new Array<User | AuditedUserRepresentation>();
  if (client instanceof KcAdminClient) {
    const currentRealm = client.realmName;
    let realms;
    // iterate over realms
    try {
      realms = await client.realms.find();
    } catch (e) {
      console.error('Check Client role:', e.response.statusText);
      return Promise.reject();
    }
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
  } else {
    const users = await client.userListing();
    for (const user of users) {
      allUsers.push({
        username: user.username,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        realm: user.realm,
        lastLogin: user.lastLogin,
        enabled: user.enabled,
      });
    }
  }
  return new Promise((resolve) => resolve(allUsers));
}
