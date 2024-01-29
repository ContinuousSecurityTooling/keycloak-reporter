/// <reference types="jest-extended" />
import { getKeycloakConfig } from '../lib/utils';
test('no config', async () => {
  expect(getKeycloakConfig({}, null)).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: false,
  });
});
