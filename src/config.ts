import { assoc, pick, mergeAll, mergeDeepRight } from 'ramda';
import Ajv from 'ajv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const schema = JSON.parse(
  fs.readFileSync(fileURLToPath(path.join(import.meta.url, '../../config/schema.json')), 'utf8')
);

const ajv = new Ajv.default();
const ajvValidate = ajv.compile(schema);

// import the config file
function buildConfigFromFile(filePath) {
  if (!filePath) return {};
  const isAbsolutePath = filePath.charAt(0) === '/';
  return JSON.parse(isAbsolutePath
    ? fs.readFileSync(filePath, 'utf8')
    : fs.readFileSync(fileURLToPath(path.join(import.meta.url, '../config', filePath)), 'utf8'));
}
// build an object using the defaults in the schema
function buildDefaults(schema, definitions) {
  return Object.keys(schema.properties).reduce((acc, prop) => {
    let spec = schema.properties[prop];
    if (spec.$ref) {
      spec = definitions[spec.$ref.replace('#/definitions/', '')];
      if (spec && spec.type === 'object') {
        return assoc(prop, buildDefaults(spec, definitions), acc);
      }
    }
    return assoc(prop, spec.default, acc);
  }, {});
}

// build an object of config values taken from process.env
function buildEnvironmentVariablesConfig(schema) {
  const trueRx = /^true$/i;
  const configKeys = Object.keys(schema.properties);
  const env = pick(configKeys, process.env);
  return Object.keys(env).reduce((acc, key) => {
    const { type } = schema.properties[key];
    switch (type) {
      case 'integer':
        return assoc(key, parseInt(env[key], 10), acc);
      case 'boolean':
        return assoc(key, trueRx.test(env[key]), acc);
      default:
        return assoc(key, env[key], acc);
    }
  }, {});
}
// merge the environment variables, config file values, and defaults
const config = mergeAll(
  mergeDeepRight(
    buildDefaults(schema, schema.definitions),
    buildConfigFromFile(process.env.CONFIG_FILE)
  ),
  buildEnvironmentVariablesConfig(schema)
);

export default config;
