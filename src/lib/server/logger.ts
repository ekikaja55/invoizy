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

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  // Normalisasi error object supaya tidak jadi "{}" saat di-JSON.stringify
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

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (dev) write('debug', message, context);
  },
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),

  /**
   * Helper khusus untuk membungkus operasi async yang butuh log sukses/gagal
   * secara konsisten (misal: generate PDF, kirim email).
   *
   * Contoh:
   *   const file = await logger.track('generate-invoice-pdf', { orderId }, () =>
   *     createAndSaveInvoice(order)
   *   );
   */
  async track<T>(
    label: string,
    context: LogContext,
    fn: () => Promise<T>
  ): Promise<T> {
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
