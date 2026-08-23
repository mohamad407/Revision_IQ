// Minimal structured logger. Swap for pino/winston later without touching callers.
const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[${timestamp()}] INFO`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] WARN`, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR`, ...args),
};

export default logger;
