// Errors that are safe to show to the client (status < 500).
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

// Sends a safe error response: HttpErrors (4xx/503 with a readable message) are
// shown to the user; anything else becomes the generic fallback with a 500.
export function sendError(res, err, fallbackMessage) {
  if (err && err.expose) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: fallbackMessage });
}
