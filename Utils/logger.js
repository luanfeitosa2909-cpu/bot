const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

// ensure logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, printf, errors, colorize } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
  exceptionHandlers: [new transports.File({ filename: path.join(logsDir, 'exceptions.log') })],
});

module.exports = {
  logInfo: msg => logger.info(msg),
  logWarn: msg => logger.warn(msg),
  logError: (msg, err) => {
    if (err) logger.error(msg, err);
    else logger.error(msg);
  },
  logger,
};
