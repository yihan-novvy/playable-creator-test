import crypto from 'node:crypto';
import { readJsonBody, sendJson } from './http-utils.mjs';

const COOKIE = 'novvy_publish_session';
const SESSION_MS = 8 * 60 * 60 * 1000;
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const validEmail = email => /^[^\s@]+@novvy\.ai$/.test(email);

// The upstream login returns a user, not a reusable access token. Keep our own
// short-lived browser session in memory; never persist passwords or raw responses.
export function createPublishAuth(options = {}) {
  const base = new URL(options.publishBaseUrl || process.env.INTERACTIVE_ZIP_SERVICE_URL || 'http://35.184.178.253:8780');
  const upstreamFetch = options.publishFetch || fetch;
  const now = options.publishAuthNow || Date.now;
  const sessions = new Map();
  const tokenFrom = req => (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  function account(req) {
    for (const [key, session] of sessions) if (session.expiresAt <= now()) sessions.delete(key);
    const token = tokenFrom(req);
    const session = token && /^[a-f0-9]{64}$/.test(token) ? sessions.get(hash(token)) : null;
    return { user: session?.user || null, expired: !!token && !session, insecureTransport: base.protocol === 'http:' };
  }
  function cookie(req, token, maxAge) {
    // Deployment's Caddy connects over loopback and overwrites X-Forwarded-Proto.
    // Never trust that header from a directly connected remote client.
    const localProxy = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    const secure = req.socket.encrypted || (localProxy && req.headers['x-forwarded-proto'] === 'https');
    return `${COOKIE}=${token}; Path=/api/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  }
  return {
    account,
    async handle(req, res, url) {
      const route = url.pathname;
      if (req.method === 'GET' && route === '/api/publish-auth') return sendJson(res, 200, account(req));
      if (req.method !== 'POST' || !['/api/publish-auth/login', '/api/publish-auth/logout'].includes(route)) throw fail('未知登录接口', 404);
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) throw fail('请从当前编辑器页面操作', 403);
      if (route.endsWith('/logout')) {
        const token = tokenFrom(req);
        if (token) sessions.delete(hash(token));
        res.setHeader('Set-Cookie', cookie(req, '', 0));
        return sendJson(res, 200, { user: null, expired: false, insecureTransport: base.protocol === 'http:' });
      }
      const input = await readJsonBody(req, 16 * 1024);
      let email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
      if (email && !email.includes('@')) email += '@novvy.ai';
      if (!validEmail(email) || email.length > 254) throw fail('请输入 @novvy.ai 企业邮箱');
      if (typeof input.password !== 'string' || !input.password.trim() || input.password.length > 4096) throw fail('请输入有效密码');
      let response, result;
      try {
        response = await upstreamFetch(new URL('/api/auth/login', base), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: input.password }),
          redirect: 'error', signal: AbortSignal.timeout(30000),
        });
        result = await response.json();
      } catch {
        throw fail('登录服务连接失败，请稍后重试', 502);
      } finally {
        delete input.password;
      }
      if (!response.ok || result?.status !== 'ok' || result?.success === false) {
        // Do not echo an arbitrary upstream response that might contain credentials.
        throw fail(response.status >= 500 ? '登录服务暂时不可用，请稍后重试' : '登录失败，请检查企业邮箱与密码', response.status >= 500 ? 502 : 401);
      }
      const returnedEmail = typeof result.user?.email === 'string' ? result.user.email.trim().toLowerCase() : '';
      if (!validEmail(returnedEmail) || returnedEmail !== email) throw fail('登录服务返回的账号信息无效，请重新登录', 502);
      const user = { email: returnedEmail, name: typeof result.user.name === 'string' ? result.user.name.slice(0, 256) : returnedEmail.split('@')[0] };
      account(req); // Prune expired sessions before adding one.
      const oldToken = tokenFrom(req);
      if (oldToken) sessions.delete(hash(oldToken));
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(hash(token), { user, expiresAt: now() + SESSION_MS });
      res.setHeader('Set-Cookie', cookie(req, token, SESSION_MS / 1000));
      return sendJson(res, 200, { user, expired: false, insecureTransport: base.protocol === 'http:' });
    },
  };
}
