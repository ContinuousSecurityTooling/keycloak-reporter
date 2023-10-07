import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Options, createClient } from '../lib/client.js';
import { User, userListing, clientListing, Client } from '../lib/user.js';

function kcClient(options: Options): Promise<KcAdminClient> {
  return createClient({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    rootUrl: options.rootUrl
  });
}

export async function listUsers(options: Options): Promise<Array<User>> {
  const users = await userListing(await kcClient(options));
  return new Promise((resolve) => resolve(users));
}

export async function listClients(options: Options): Promise<Array<Client>> {
  const clients = await clientListing(await kcClient(options));
  return new Promise((resolve) => resolve(clients));
}
