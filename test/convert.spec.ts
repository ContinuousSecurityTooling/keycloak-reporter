import { convertJSON2CSV } from '../lib/convert';
test('convert empty JSON', async () => {
  expect(await convertJSON2CSV({})).toBe('');
});

test('convert simple JSON', async () => {
  expect(
    await convertJSON2CSV({
      key1: 'value1',
      key2: 'value2',
    })
  ).toBe(`"key1","key2"
"value1","value2"`);
});
