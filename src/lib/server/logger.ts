// src/lib/server/logger.ts

import { dev } from '$app/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: dev ? err.stack : undefined
    };
  }
  return err;
}

const levelColors: Record<LogLevel, string> = {
  debug: '\x1b[90m', // abu-abu
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // kuning
  error: '\x1b[31m' // merah
};
const RESET = '\x1b[0m';

function writeDev(level: LogLevel, message: string, context?: LogContext) {
  const color = levelColors[level];
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });

  console.log(`${color}[${level.toUpperCase()}]${RESET} ${time} — ${message}`);

  if (context && Object.keys(context).length > 0) {
    console.dir(context, { depth: null, colors: true });
  }
}

function writeProd(level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  if (entry.error) {
    entry.error = serializeError(entry.error);
  }

  const line = JSON.stringify(entry);

  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (context?.error) {
    context = { ...context, error: serializeError(context.error) };
  }

  if (dev) {
    writeDev(level, message, context);
  } else {
    writeProd(level, message, context);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (dev) write('debug', message, context);
  },
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),

  async track<T>(label: string, context: LogContext, fn: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    write('info', `${label}:start`, context);
    try {
      const result = await fn();
      write('info', `${label}:success`, { ...context, durationMs: Date.now() - startedAt });
      return result;
    } catch (err) {
      write('error', `${label}:failed`, {
        ...context,
        durationMs: Date.now() - startedAt,
        error: err
      });
      throw err;
    }
  }
};