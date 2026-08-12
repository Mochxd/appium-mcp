import {beforeEach, describe, expect, jest, test} from '@jest/globals';

const SIMULATOR_LISTAPPS_JSON = JSON.stringify({
  'com.example.app': {CFBundleDisplayName: 'Example', CFBundleName: 'ExampleApp'},
  'com.example.other': {CFBundleName: 'Other'},
});

const mockExec = jest.fn(
  async (_cmd: string, _args: string[]): Promise<{stdout: string}> => ({
    stdout: SIMULATOR_LISTAPPS_JSON,
  }),
);

jest.unstable_mockModule('teen_process', () => ({
  exec: mockExec,
}));

jest.unstable_mockModule('../../../command.js', () => ({
  execute: jest.fn(async () => ({})),
}));

jest.unstable_mockModule('../../../session-store.js', () => ({
  getPlatformName: jest.fn(() => 'iOS'),
  isRemoteDriverSession: jest.fn(() => false),
  isAndroidUiautomator2DriverSession: jest.fn(() => false),
  isXCUITestDriverSession: jest.fn(() => true),
  PLATFORM: {ios: 'iOS', android: 'Android'},
}));

jest.unstable_mockModule('../../../ui/mcp-ui-utils.js', () => ({
  createUIResource: jest.fn(() => ({})),
  createAppListUI: jest.fn(() => ''),
  addUIResourceToResponse: jest.fn((response: unknown) => response),
}));

jest.unstable_mockModule('../../../tools/tool-response.js', () => ({
  resolveDriver: jest.fn(async () => ({ok: true, driver: {}})),
  textResult: jest.fn((text: string) => ({content: [{type: 'text', text}]})),
  errorResult: jest.fn((text: string) => ({content: [{type: 'text', text}], isError: true})),
  toolErrorMessage: jest.fn((error: unknown) => String(error)),
}));

const {listAppsFromDevice} = await import('../../../tools/app-management/list-apps.js');

const simulatorDriver = {
  isSimulator: () => true,
  caps: {udid: 'SIM-UDID'},
};

describe('listAppsFromDevice on an iOS simulator', () => {
  beforeEach(() => {
    mockExec.mockClear();
  });

  test('asks simctl for json directly instead of piping to plutil', async () => {
    // teen_process spawns without a shell, so a '|' argument would be passed
    // through to simctl as a literal rather than creating a pipeline.
    await listAppsFromDevice(simulatorDriver as never);

    expect(mockExec).toHaveBeenCalledWith('xcrun', ['simctl', 'listapps', 'SIM-UDID', '--json']);
    const args = mockExec.mock.calls[0][1];
    expect(args).not.toContain('|');
    expect(args).not.toContain('plutil');
  });

  test('normalizes the simctl payload into package/app names', async () => {
    const apps = await listAppsFromDevice(simulatorDriver as never);

    expect(apps).toEqual([
      {packageName: 'com.example.app', appName: 'Example'},
      {packageName: 'com.example.other', appName: 'Other'},
    ]);
  });
});
