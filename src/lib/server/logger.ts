type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	[key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...context
	};

	const output = level === 'error' || level === 'warn' ? console.error : console.log;
	output(JSON.stringify(entry));
}

export const logger = {
	debug: (message: string, context?: LogContext) => {
		if (process.env.NODE_ENV !== 'production') log('debug', message, context);
	},
	info: (message: string, context?: LogContext) => log('info', message, context),
	warn: (message: string, context?: LogContext) => log('warn', message, context),
	error: (message: string, context?: LogContext) => log('error', message, context)
};
