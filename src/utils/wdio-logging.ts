import wdioLogger from '@wdio/logger';

import {QUIET_WEBDRIVER_LOG_LEVEL} from './webdriver-client-options.js';

type WdioLogLevel = NonNullable<Parameters<typeof wdioLogger.setLogLevelsConfig>[1]>;

/** Quiet every WDIO logger that was created before stdio config ran. */
export function quietExistingWdioLoggers(
  level: WdioLogLevel = (process.env.WDIO_LOG_LEVEL as WdioLogLevel | undefined) ?? QUIET_WEBDRIVER_LOG_LEVEL,
): void {
  wdioLogger.setLogLevelsConfig({}, level);
}
