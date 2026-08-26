import {isStdioTransportLoggingConfigured} from '../stdio-logging-state.js';

export const QUIET_WEBDRIVER_LOG_LEVEL = 'warn' as const;

/** `logLevel: warn` only after stdio logging is configured. */
export function withQuietWebDriverLogging<T extends Record<string, unknown>>(
  options: T,
): T | (T & {logLevel: typeof QUIET_WEBDRIVER_LOG_LEVEL}) {
  if (!isStdioTransportLoggingConfigured()) {
    return options;
  }
  return {
    ...options,
    logLevel: QUIET_WEBDRIVER_LOG_LEVEL,
  };
}
