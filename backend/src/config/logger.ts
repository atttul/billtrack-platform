import pino from 'pino';
import { env } from './env.js';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isTest = env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test';

// Pretty printing is ONLY used in local development, never in production/Vercel
const usePretty = !isProduction && !isTest && env.NODE_ENV === 'development';

export const logger = pino({
  level: isTest ? 'silent' : usePretty ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'passwordHash',
      'token',
      'jwtSecret',
      'mongoUri',
      'redisUrl',
      'emailPassword',
    ],
    censor: '[REDACTED]',
  },
  ...(usePretty && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      },
    },
  }),
});
