import multer from 'multer';
import logger from '../utils/logger.js';
import { fail } from '../utils/response.js';

// Centralized error handler — must be registered last, after all routes.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(err);

  if (err instanceof multer.MulterError) {
    return fail(res, err.message, 400);
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  return fail(res, message, status);
}
