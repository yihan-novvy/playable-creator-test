import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../server.mjs';
import { createTask, deleteTask, recordStepResult } from '../lib/store.mjs';
import { taskResultDir, taskProjectDir } from '../lib/paths.mjs';
import { mockPublishService } from './publish-service-fixture.mjs';

export default async function test(a) {
  const mock = mockPublishService();
  let now = Date.now();
  const server = createServer({ publishBaseUrl: 'http://publish-fixture.test', publishFetch: mock.fetch, publishAuthNow: () => now });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const task = createTask({ name: 'auth-contract-' + now, templateId: 'tasty-travels-origin' });
  const prefix = '/api/tasks/' + task.id + '/publish';
  async function call(route, body, cookie = '', method = 'POST', headers = {}) {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  const credentials = { email: 'qa@novvy.ai', password: 'fixture-only-password' };
  const login = (input = credentials, cookie = '') => call('/api/publish-auth/login', input, cookie);
  const cookieValue = result => result.cookie?.split(';')[0] || '';
  try {
    a.equal((await call('/api/publish-auth')).data.user, null, 'anonymous browser has no invented user');
    a.equal((await login({ email: 'user@gmail.com', password: credentials.password })).status, 400, 'nonenterprise address is rejected before login');
    a.equal((await login({ email: credentials.email })).status, 400, 'password is required');
    a.equal((await call('/api/publish-auth/login', credentials, '', 'POST', { Origin: 'https://other.example' })).status, 403, 'cross-origin login is rejected');
    a.equal(mock.calls.length, 0, 'invalid requests never reach the login service');
    const wrong = await login({ ...credentials, password: 'wrong-fixture-password' });
    a.equal(wrong.status, 401, 'service rejects incorrect password');
    a.equal(wrong.cookie, null, 'failed login does not create a session');
    mock.setAuthResponse({ status: 'ok', user: { email: 'other@novvy.ai' } });
    a.equal((await login()).status, 502, 'mismatched service identity is rejected');
    mock.setAuthResponse({ status: 'ok', user: { email: credentials.email, password: credentials.password, token: 'unexpected-token' } });
    const sanitized = await login();
    a.check(!JSON.stringify(sanitized.data).includes(credentials.password) && !JSON.stringify(sanitized.data).includes('unexpected-token'), 'only sanitized user fields are exposed');
    mock.setAuthResponse(null);
    const signedIn = await login({ ...credentials, email: ' QA@NOVVY.AI ' });
    let cookie = cookieValue(signedIn);
    a.equal(signedIn.status, 200, 'real service success contract creates a local session');
    a.equal(signedIn.data.user.email, credentials.email, 'enterprise email is normalized');
    a.check(signedIn.cookie.includes('HttpOnly') && signedIn.cookie.includes('SameSite=Strict') && signedIn.cookie.includes('Path=/api/'), 'session cookie is restricted to backend requests');
    a.check(!signedIn.cookie.includes(credentials.email) && !signedIn.cookie.includes(credentials.password), 'cookie contains only a random session identifier');
    a.equal((await call('/api/publish-auth', undefined, cookie)).data.user.email, credentials.email, 'browser refresh restores verified user');
    a.equal((await call('/api/publish-auth')).data.user, null, 'another browser does not inherit the account');
    a.equal((await call('/api/publish-auth', undefined, 'novvy_publish_session=' + 'a'.repeat(64))).data.expired, true, 'forged cookies cannot impersonate a user');
    mock.setAuthResponse(new Error('network failure ' + credentials.password));
    const unavailable = await login(credentials, cookie);
    a.equal(unavailable.status, 502, 'network failure cannot fabricate login');
    a.check(!JSON.stringify(unavailable.data).includes(credentials.password), 'network errors do not expose submitted secrets');
    a.equal((await call('/api/publish-auth', undefined, cookie)).data.user.email, credentials.email, 'failed account switch preserves current login');
    mock.setAuthResponse(null);

    fs.mkdirSync(taskResultDir(task.id), { recursive: true });
    fs.writeFileSync(path.join(taskResultDir(task.id), 'index.html'), '<!doctype html><title>Auth fixture</title>Fixture');
    recordStepResult(task.id, { stepId: 'pack', ok: true });
    const settings = { store_url: 'https://play.google.com/store/apps/details?id=com.example', tag: 'auth-fixture' };
    await call(prefix + '/settings', settings, '', 'PATCH');
    const inspection = await call(prefix + '/inspect', {});
    const packaged = await call(prefix + '/package', { confirmation: inspection.data.inspection.event_check.confirmation_token });
    const packageId = packaged.data.package.id;
    a.equal((await call(prefix, undefined, cookie)).data.launchEmail, credentials.email, 'publish view resolves email from the browser session');
    a.equal((await call(prefix)).data.launchEmail, 'yihan@novvy.ai', 'anonymous browser retains the requested default');
    a.equal((await call(prefix + '/launch', { packageId, launchEmail: credentials.email, admin_email: 'forged@novvy.ai' }, cookie)).status, 200, 'authenticated user can explicitly launch');
    a.equal(mock.calls.filter(item => item.path === '/api/v1/auto-launch').at(-1).body.admin_email, credentials.email, 'launch uses verified service email instead of browser-provided identity');
    const stateText = fs.readFileSync(path.join(taskProjectDir(task.id), 'publish/state.json'), 'utf8');
    a.check(!stateText.includes(credentials.password) && !stateText.includes(cookie.split('=')[1]), 'task files contain neither password nor login session');
    const oldCookie = cookie;
    cookie = cookieValue(await login({ ...credentials, email: 'second@novvy.ai' }, cookie));
    a.equal((await call('/api/publish-auth', undefined, oldCookie)).data.expired, true, 'successful account switch invalidates the old session');
    const launchCount = mock.calls.filter(item => item.path === '/api/v1/auto-launch').length;
    a.equal((await call(prefix + '/launch', { packageId, launchEmail: credentials.email }, cookie)).status, 409, 'stale tab cannot upload under a newly switched account');
    a.equal(mock.calls.filter(item => item.path === '/api/v1/auto-launch').length, launchCount, 'account mismatch causes no remote upload');
    a.equal((await call(prefix + '/launch', { packageId, launchEmail: 'second@novvy.ai' }, cookie)).status, 200, 'confirmed new account can upload');
    a.equal(mock.calls.filter(item => item.path === '/api/v1/auto-launch').at(-1).body.admin_email, 'second@novvy.ai', 'new account reaches the documented upload field');
    now += 8 * 60 * 60 * 1000 + 1;
    a.equal((await call('/api/publish-auth', undefined, cookie)).data.expired, true, 'sessions expire after eight hours');
    a.equal((await call(prefix + '/launch', { packageId }, cookie)).status, 401, 'expired cookie cannot silently upload under the default account');
    a.equal((await call('/api/publish-auth/logout', {}, cookie, 'POST', { Origin: 'https://other.example' })).status, 403, 'cross-origin logout is rejected');
    const loggedOut = await call('/api/publish-auth/logout', {}, cookie);
    a.check(loggedOut.cookie.includes('Max-Age=0'), 'logout clears the browser cookie');
    a.equal((await call(prefix + '/launch', { packageId, launchEmail: 'yihan@novvy.ai' })).status, 200, 'explicit anonymous state continues to support default account');
    a.equal(mock.calls.filter(item => item.path === '/api/v1/auto-launch').at(-1).body.admin_email, 'yihan@novvy.ai', 'default account is used only without a login session');
    a.check(mock.calls.every(item => !['/api/auth/verify', '/api/auth/logout', '/api/auth/me'].includes(item.path)), 'no unrequested upstream auth endpoints are called');
  } finally {
    deleteTask(task.id);
    await new Promise(resolve => server.close(resolve));
  }
}
