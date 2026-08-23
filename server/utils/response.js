export function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res, message = 'Something went wrong', status = 400, extra = undefined) {
  return res.status(status).json({ success: false, message, ...(extra ? { errors: extra } : {}) });
}
