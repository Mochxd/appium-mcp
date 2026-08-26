import {afterEach, describe, expect, test} from '@jest/globals';

import {configureStdioTransportLogging, ensureLoggerWritesToStderr, log} from '../logger.js';
import {isStdioTransportLoggingConfigured, markStdioTransportLoggingConfigured} from '../stdio-logging-state.js';
import {QUIET_WEBDRIVER_LOG_LEVEL, withQuietWebDriverLogging} from '../utils/webdriver-client-options.js';

describe('stdio transport logging', () => {
  const originalWdioLogLevel = process.env.WDIO_LOG_LEVEL;

  afterEach(() => {
    if (originalWdioLogLevel === undefined) {
      delete process.env.WDIO_LOG_LEVEL;
    } else {
      process.env.WDIO_LOG_LEVEL = originalWdioLogLevel;
    }
  });

  test('ensureLoggerWritesToStderr only replaces stdout', () => {
    log.unwrap().stream = process.stdout;
    ensureLoggerWritesToStderr();
    expect(log.unwrap().stream).toBe(process.stderr);
  });

  test('ensureLoggerWritesToStderr leaves stderr and custom sinks in place', () => {
    log.unwrap().stream = process.stderr;
    ensureLoggerWritesToStderr();
    expect(log.unwrap().stream).toBe(process.stderr);

    const custom = {write: () => {}} as unknown as NodeJS.WriteStream;
    log.unwrap().stream = custom;
    ensureLoggerWritesToStderr();
    expect(log.unwrap().stream).toBe(custom);
  });

  test('withQuietWebDriverLogging is a no-op until stdio logging is configured', () => {
    expect(isStdioTransportLoggingConfigured()).toBe(false);
    expect(
      withQuietWebDriverLogging({
        hostname: '127.0.0.1',
        port: 4723,
      }),
    ).toEqual({
      hostname: '127.0.0.1',
      port: 4723,
    });
  });

  test('configureStdioTransportLogging quiets info logs and WDIO when unset', () => {
    delete process.env.WDIO_LOG_LEVEL;
    log.unwrap().stream = process.stdout;

    configureStdioTransportLogging();

    expect(isStdioTransportLoggingConfigured()).toBe(true);
    expect(log.unwrap().stream).toBe(process.stderr);
    expect(log.level).toBe('warn');
    expect(process.env.WDIO_LOG_LEVEL).toBe('warn');
  });

  test('withQuietWebDriverLogging sets warn after stdio logging is configured', () => {
    markStdioTransportLoggingConfigured();
    expect(
      withQuietWebDriverLogging({
        hostname: '127.0.0.1',
        port: 4723,
      }),
    ).toEqual({
      hostname: '127.0.0.1',
      port: 4723,
      logLevel: QUIET_WEBDRIVER_LOG_LEVEL,
    });
  });
});
