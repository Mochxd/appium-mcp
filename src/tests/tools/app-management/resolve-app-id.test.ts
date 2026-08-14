import {beforeEach, describe, expect, jest, test} from '@jest/globals';

const rehydratedDriver = {rehydrated: true};

const mockResolveDriver = jest.fn<(sessionId?: string) => Promise<any>>();
const mockListAppsFromDevice = jest.fn<(...args: any[]) => Promise<{packageName: string; appName: string}[]>>();

jest.unstable_mockModule('../../../session-store', () => ({
  // The in-memory cache is empty after an MCP process recycle.
  getDriver: jest.fn(() => null),
  getSessionId: jest.fn(() => undefined),
  getPlatformName: jest.fn(() => 'Android'),
  isXCUITestDriverSession: jest.fn(() => false),
  PLATFORM: {ios: 'iOS', android: 'Android'},
}));

jest.unstable_mockModule('../../../tools/tool-response', () => ({
  resolveDriver: mockResolveDriver,
  noActiveDriverSessionMessage: (sessionId?: string) =>
    `No active driver session${sessionId ? ` for session '${sessionId}'` : ''}.`,
}));

jest.unstable_mockModule('../../../tools/app-management/list-apps.js', () => ({
  listAppsFromDevice: mockListAppsFromDevice,
}));

const {resolveAppId} = await import('../../../tools/app-management/resolve-app-id.js');

describe('resolveAppId on a persisted session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListAppsFromDevice.mockResolvedValue([{packageName: 'com.example.calc', appName: 'Calculator'}]);
  });

  test('rehydrates the session instead of failing on an empty driver cache', async () => {
    mockResolveDriver.mockResolvedValue({ok: true, driver: rehydratedDriver});

    await expect(resolveAppId('Calculator', 'persisted-1')).resolves.toBe('com.example.calc');

    expect(mockResolveDriver).toHaveBeenCalledWith('persisted-1');
    expect(mockListAppsFromDevice).toHaveBeenCalledWith(rehydratedDriver, 'User');
  });

  test('reports no active driver session when the session cannot be resolved', async () => {
    mockResolveDriver.mockResolvedValue({ok: false, result: {content: [], isError: true}});

    await expect(resolveAppId('Calculator', 'missing')).rejects.toThrow(/No active driver session/);
    expect(mockListAppsFromDevice).not.toHaveBeenCalled();
  });
});
