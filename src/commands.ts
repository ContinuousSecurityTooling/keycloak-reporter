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
  return userListing(await kcClient(options));
}

export async function listClients(options: Options): Promise<Array<Client | AuditedClientRepresentation>> {
  return clientListing(await kcClient(options));
}
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function configTest(options: Options) {
  try {
    const users = await userListing(await kcClient(options));
    console.log(`Connection to ${options.rootUrl} was successfull: ${users.length} users found.`);
  } catch (e) {
    console.error(`Connection to ${options.rootUrl} was not successfull`, e);
    return;
  }
}
