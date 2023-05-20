/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  roots: [
    'src',
    'lib',
    'test'
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: [
      'node_modules/(?!(string-width|strip-ansi|ansi-regex|test-json-import)/)'
  ],
  'transform': {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
};
