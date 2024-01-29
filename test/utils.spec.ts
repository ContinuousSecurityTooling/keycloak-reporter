/// <reference types="jest-extended" />
import { getKeycloakConfig } from '../lib/utils';
test('no config', () => {
  expect(getKeycloakConfig({}, {})).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: false,
  });
});

test('config with useAuditingEndpoint', () => {
  expect(getKeycloakConfig({ useAuditingEndpoint: 'true' }, {})).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: true,
  });
});

test('argv with useAuditingEndpoint', () => {
  expect(getKeycloakConfig({}, { useAuditingEndpoint: 'true' })).toEqual({
    clientId: undefined,
    clientSecret: undefined,
    rootUrl: undefined,
    useAuditingEndpoint: true,
  });
});
