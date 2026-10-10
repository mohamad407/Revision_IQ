import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// A throwaway key lets firebase-admin initialise without real credentials.
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ type: 'service_account', project_id: 't', private_key: privateKey, client_email: 't@t.iam.gserviceaccount.com' });
process.env.GEMINI_API_KEY = 'test';
process.env.NODE_ENV = 'production';
process.env.CLIENT_ORIGIN = 'https://app.example.com';

const { default: app } = await import('../app.js');
let server;
let base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
after(() => server.close());

const call = (path, opts) => fetch(base + path, opts);

test('public routes respond', async () => {
  assert.equal((await call('/')).status, 200);
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/nope')).status, 404);
});

test('every protected route rejects requests without a token', async () => {
  const routes = [
    ['GET', '/api/documents'], ['POST', '/api/documents/upload'], ['POST', '/api/documents/507f1f77bcf86cd799439011/tools'],
    ['POST', '/api/documents/507f1f77bcf86cd799439011/chat'], ['POST', '/api/quiz/generate'], ['GET', '/api/flashcards/due'],
    ['POST', '/api/flashcards/share'], ['POST', '/api/flashcards/import'], ['GET', '/api/stats'], ['POST', '/api/feedback'],
    ['GET', '/api/predictor'], ['POST', '/api/predictor/507f1f77bcf86cd799439011/evaluate'],
    ['POST', '/api/predictor/507f1f77bcf86cd799439011/topic-frequency'], ['DELETE', '/api/user/me'],
    ['GET', '/api/admin/overview'], ['GET', '/api/admin/users'], ['POST', '/api/admin/users/507f1f77bcf86cd799439011/disabled'],
  ];
  for (const [method, path] of routes) {
    const r = await call(path, { method });
    assert.equal(r.status, 401, `${method} ${path} should be 401 but was ${r.status}`);
  }
});

test('public shared-deck link rejects malformed codes before touching the database', async () => {
  assert.equal((await call('/api/shared/bad!')).status, 422);
  assert.equal((await call('/api/shared/' + 'a'.repeat(40))).status, 422);
});

test('CORS: only the configured origin is allowed; custom timezone header is accepted', async () => {
  const evil = await call('/api/health', { headers: { Origin: 'https://evil.com' } });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  const good = await call('/api/health', { headers: { Origin: 'https://app.example.com' } });
  assert.equal(good.headers.get('access-control-allow-origin'), 'https://app.example.com');
  const pre = await call('/api/stats', { method: 'OPTIONS', headers: { Origin: 'https://app.example.com', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization,x-tz-offset' } });
  assert.match(pre.headers.get('access-control-allow-headers') || '', /X-TZ-Offset/i);
});

test('malformed JSON gets a clean 400', async () => {
  const r = await call('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(r.status, 400);
});
