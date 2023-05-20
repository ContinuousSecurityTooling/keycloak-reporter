import { AsyncParser } from '@json2csv/node';

export async function convertJSON2CSV(json: object) {
  const opts = {};
  const transformOpts = {};
  const asyncOpts = {};
  const parser = new AsyncParser(opts, transformOpts, asyncOpts);
  return await parser.parse(json).promise();
}
