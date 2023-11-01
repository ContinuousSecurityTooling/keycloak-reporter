import KcAdminClient from '@keycloak/keycloak-admin-client';
import {
  AuditClient,
  AuditedClientRepresentation,
  AuditedUserRepresentation,
} from '@continuoussecuritytooling/keycloak-auditor';
import { Options, createClient } from '../lib/client.js';
import { User, userListing, clientListing, Client } from '../lib/user.js';

function kcClient(options: Options): Promise<KcAdminClient | AuditClient> {
  return createClient({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    rootUrl: options.rootUrl,
    useAuditingEndpoint: options.useAuditingEndpoint,
  });
}

export async function listUsers(options: Options): Promise<Array<User | AuditedUserRepresentation>> {
  const users = await userListing(await kcClient(options));
  return new Promise((resolve) => resolve(users));
}

export async function listClients(options: Options): Promise<Array<Client | AuditedClientRepresentation>> {
  const clients = await clientListing(await kcClient(options));
  return new Promise((resolve) => resolve(clients));
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function configTest(options: Options): Promise<any> {
  try {
    await userListing(await kcClient(options));
    console.log(`Connection to ${options.rootUrl} was successfull`);
  } catch (e) {
    console.error(`Connection to ${options.rootUrl} was not: successfull`, e.response);
    return Promise.reject(e.response.statusText);
  }
}
