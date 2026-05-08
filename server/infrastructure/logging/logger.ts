import pino from 'pino'
import type { Logger } from '@interfaces/logger-interface'

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    remove: true
  }
})

export const logger: Logger = {
  trace: (message, meta) => baseLogger.trace(meta ?? {}, message),
  debug: (message, meta) => baseLogger.debug(meta ?? {}, message),
  info: (message, meta) => baseLogger.info(meta ?? {}, message),
  warn: (message, meta) => baseLogger.warn(meta ?? {}, message),
  error: (msg, meta, err) => baseLogger.error({ ...(meta ?? {}), err }, msg)
}
