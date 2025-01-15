// src/utils/logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const LOG_DIR = path.join(__dirname, '..', 'logs');

const logger = createLogger({
  level: 'info',  // Ensure 'info' level is being captured (or 'debug' if you want more detailed logs)
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',  // Logs errors to a separate file
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'info-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',  // Logs 'info' and above to this file
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ],
});

// If we're not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
