import multer from 'multer';
import logger from '../utils/logger.js';
import { fail } from '../utils/response.js';

// Centralized error handler — must be registered last, after all routes.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 20MB).' : 'Invalid upload.';
    return fail(res, message, 400);
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return fail(res, 'Invalid JSON body', 400);
  }
  if (err.type === 'entity.too.large') {
    return fail(res, 'Request body too large', 413);
  }

  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(err); // log details server-side only
    return fail(res, 'Internal server error', 500);
  }

  // 4xx errors thrown via HttpError / fileFilter are safe to show.
  return fail(res, err.expose ? err.message : 'Bad request', status);
}
