// Apple ("Hide my email") and some Microsoft accounts may not return an email. The User model
// requires one, so fall back to a placeholder that can never receive mail and can never match
// the ADMIN_EMAILS list. (Apple's private-relay addresses are real emails and are used as-is.)
export function emailFor({ email, uid }) {
  const clean = String(email || '').trim().toLowerCase();
  return clean || `${uid}@no-email.invalid`;
}
