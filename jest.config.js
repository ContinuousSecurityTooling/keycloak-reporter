/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  roots: [
    'src',
    'lib',
    'test',
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'index.ts',
    'src/**',
    'lib/**',
  ],
  setupFilesAfterEnv: [
    'jest-extended/all',
  ],
  transformIgnorePatterns: [
      'node_modules/(?!(string-width|strip-ansi|ansi-regex|test-json-import)/)',
  ],
  'transform': {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
