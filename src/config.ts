import { assoc, pick, mergeAll } from 'ramda';

type SchemaSpec = {
  type?: string;
  $ref?: string;
  default?: unknown;
  properties?: Record<string, SchemaSpec>;
  definitions?: Record<string, SchemaSpec>;
};
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const schema = JSON.parse(
  fs.readFileSync(fileURLToPath(path.join(import.meta.url, '../../config/schema.json')), 'utf8')
);

// import the config file
function buildConfigFromFile(filePath: string | undefined) {
  if (!filePath) return {};
  const isAbsolutePath = filePath.charAt(0) === '/';
  return JSON.parse(
    isAbsolutePath
      ? fs.readFileSync(filePath, 'utf8')
      : fs.readFileSync(fileURLToPath(path.join(import.meta.url, '../config', filePath)), 'utf8')
  );
}
// build an object using the defaults in the schema
function buildDefaults(schema: SchemaSpec, definitions: Record<string, SchemaSpec>): Record<string, unknown> {
  return Object.keys(schema.properties!).reduce((acc: Record<string, unknown>, prop) => {
    let spec: SchemaSpec = schema.properties![prop];
    if (spec.$ref) {
      const def = definitions[spec.$ref.replace('#/definitions/', '')];
      if (def?.type === 'object') {
        return assoc(prop, buildDefaults(def, definitions), acc) as Record<string, unknown>;
      }
      if (def) spec = def;
    }
    return assoc(prop, spec.default, acc) as Record<string, unknown>;
  }, {});
}

// build an object of config values taken from process.env
function buildEnvironmentVariablesConfig(schema: SchemaSpec): Record<string, unknown> {
  const trueRx = /^true$/i;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const configKeys = Object.keys(schema.properties as any);
  const env = pick(configKeys, process.env);
  return Object.keys(env).reduce((acc, key) => {
    const { type } = (schema.properties as any)[key];
    switch (type) {
      case 'integer':
        return assoc(key, parseInt(env[key]!, 10), acc);
      case 'boolean':
        return assoc(key, trueRx.test(env[key]!), acc);
      default:
        return assoc(key, env[key], acc);
    }
  }, {});
}

// merge the environment variables, config file values, and defaults
const config = mergeAll([
  buildDefaults(schema, schema.definitions),
  buildConfigFromFile(process.env.CONFIG_FILE),
  buildEnvironmentVariablesConfig(schema),
]);

export default config;
