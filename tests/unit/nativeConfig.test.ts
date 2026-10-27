jest.mock('expo/config-plugins', () => ({
  withPodfile: (config: { source: string }, action: (value: { modResults: { contents: string } }) => { modResults: { contents: string } }) => action({ modResults: { contents: config.source } }),
}));
const withGlog: (config: { source: string }) => { modResults: { contents: string } } = require('../../plugins/withGlogModuleMap');
test('CNG workaround is idempotent and preserves neighboring user configuration', () => {
  const source = "# user header\npost_install do |installer|\n  keep_user_setting()\nend\n# user footer\n";
  const once = withGlog({ source }).modResults.contents;
  const twice = withGlog({ source: once }).modResults.contents;
  expect(twice).toBe(once);
  expect(twice).toContain('keep_user_setting()');
  expect(twice).toContain('# user header'); expect(twice).toContain('# user footer');
  expect(twice.match(/# yeoun-m0: glog textual includes/g)).toHaveLength(1);
});
test('changed Expo Podfile template fails explicitly instead of silently skipping compatibility fix', () => {
  expect(() => withGlog({ source: 'unexpected new template' })).toThrow('anchor changed');
});
