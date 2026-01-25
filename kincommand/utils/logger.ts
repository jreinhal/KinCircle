/**
 * Logger utility for controlled logging
 * In production, logs can be disabled or sent to a monitoring service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Configuration - can be controlled via env vars
const config: LoggerConfig = {
  enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true',
  level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'warn',
  includeTimestamp: true
};

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = config.includeTimestamp
    ? `[${new Date().toISOString()}] `
    : '';
  return `${timestamp}[${level.toUpperCase()}] ${message}`;
}

/**
 * Application logger with environment-aware behavior
 */
export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), error);
    }

    // In production, could send to error reporting service
    // if (import.meta.env.PROD) {
    //   sendToErrorReporting({ message, error });
    // }
  },

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, args[0]);
        break;
    }
  },

  /**
   * Temporarily enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    config.enabled = enabled;
  },

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    config.level = level;
  }
};

export type { LogLevel };
