import { Options, createClient } from '../lib/client.js';
import { User, userListing, clientListing, Client } from '../lib/user.js';

export async function listUsers(options: Options): Promise<Array<User>> {
  const users = await userListing(
    await createClient({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      rootUrl: options.rootUrl,
    })
  );

  return new Promise((resolve) => resolve(users));
}

export async function listClients(options: Options): Promise<Array<Client>> {
  const clients = await clientListing(
    await createClient({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      rootUrl: options.rootUrl,
    })
  );

  return new Promise((resolve) => resolve(clients));
}
