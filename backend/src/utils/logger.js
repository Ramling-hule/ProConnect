import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
const isDev = process.env.NODE_ENV !== 'production';
const levels = {
  error  : 0,
  warn   : 1,
  info   : 2,
  http   : 3,
  verbose: 4,
  debug  : 5,
  silly  : 6,
};

const levelColors = {
  error  : 'red',
  warn   : 'yellow',
  info   : 'green',
  http   : 'magenta',
  verbose: 'cyan',
  debug  : 'blue',
  silly  : 'grey',
};
winston.addColors(levelColors);

const { combine, timestamp, errors, json, colorize, printf, splat, metadata } = winston.format;
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp, stack, requestId, method, url, userId, ...rest }) => {
    let line = `[${timestamp}] ${level}: ${message}`;
    const ctx = [
      requestId && `requestId: ${requestId}`,
      method && url && `${method} ${url}`,
      userId  && `userId: ${userId}`,
    ].filter(Boolean).join(' | ');
    if (ctx) line += `\n  → ${ctx}`;
    if (stack) line += `\n${stack}`;
    const extras = Object.keys(rest).filter(k => !['service', 'pid'].includes(k));
    if (extras.length) {
      line += `\n  ${extras.map(k => `${k}: ${JSON.stringify(rest[k])}`).join(' | ')}`;
    }
    return line;
  })
);
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
  json()
);

const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
  format: prodFormat,
});

const combinedFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
  format: prodFormat,
});

const consoleTransport = new winston.transports.Console({
  format: isDev ? devFormat : prodFormat,
  level: isDev ? 'debug' : 'warn',
});

const logger = winston.createLogger({
  levels,
  level: isDev ? 'debug' : 'info',
  defaultMeta: {
    service: 'uniconnect-backend',
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  exitOnError: false,
});
logger.info('Logger initialized', { logDir: LOG_DIR });

export default logger;
