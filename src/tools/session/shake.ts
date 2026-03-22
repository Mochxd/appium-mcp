import type { ContentResult, FastMCP } from 'fastmcp';
import { z } from 'zod';
import { getDriver, getPlatformName, PLATFORM } from '../../session-store.js';
import { execute } from '../../command.js';

function getMergedCapabilities(driver: unknown): Record<string, unknown> {
  const d = driver as {
    capabilities?: Record<string, unknown>;
    requestedCapabilities?: Record<string, unknown>;
  };
  const caps = d?.capabilities ?? {};
  const requested = d?.requestedCapabilities ?? {};
  return { ...requested, ...caps };
}

/**
 * XCUITest `mobile: shake` is implemented for iOS Simulator (not Android; not
 * supported for physical iOS devices in practice). Uses session capabilities
 * when the server reports `isSimulator` or a device name containing "Simulator".
 */
function isLikelyIOSSimulator(driver: unknown): boolean {
  const caps = getMergedCapabilities(driver);
  if (caps['appium:isSimulator'] === true) return true;
  if (caps['isSimulator'] === true) return true;
  const deviceName = String(
    caps['appium:deviceName'] ?? caps['deviceName'] ?? ''
  );
  return /simulator/i.test(deviceName);
}

export default function shakeDevice(server: FastMCP): void {
  const shakeSchema = z.object({});

  server.addTool({
    name: 'appium_mobile_shake',
    description:
      'Perform a shake gesture on the iOS Simulator via Appium `mobile: shake` (XCUITest). ' +
      'Not supported on Android. Physical iOS devices are not supported—use an iOS Simulator session only.',
    parameters: shakeSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (
      _args: z.infer<typeof shakeSchema>,
      _context: Record<string, unknown> | undefined
    ): Promise<ContentResult> => {
      const driver = getDriver();
      if (!driver) {
        throw new Error('No driver found');
      }

      const platform = getPlatformName(driver);
      if (platform === PLATFORM.android) {
        return {
          content: [
            {
              type: 'text',
              text: 'Shake is not available on Android. This tool only supports iOS Simulator (XCUITest `mobile: shake`).',
            },
          ],
        };
      }

      if (platform === PLATFORM.ios && !isLikelyIOSSimulator(driver)) {
        return {
          content: [
            {
              type: 'text',
              text: 'Shake is only supported on the iOS Simulator. Physical iOS devices are not supported for this command—create a session against a Simulator.',
            },
          ],
        };
      }

      try {
        await execute(driver, 'mobile: shake', {});
        return {
          content: [{ type: 'text', text: 'Shake action performed.' }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to perform shake. err: ${message}`,
            },
          ],
        };
      }
    },
  });
}
