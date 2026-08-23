import { validationResult } from 'express-validator';
import { fail } from '../utils/response.js';

// Runs after an array of express-validator checks; short-circuits with a
// 422 + field-level messages if any check failed.
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(
      res,
      'Validation failed',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
}
