import crypto from 'node:crypto';

// Contract fixture only. No connection to a real injector, SDK or ad platform.
export function mockPublishService() {
  const calls = [];
  let packaged, packageError = false, gate = null, launchGate = null, launchResponse = null, authResponse = null;
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const report = token => ({
    entry: 'index.html', status: 'needs_confirmation', mode: 'direct',
    requires_confirmation: true, confirmation_token: token,
    checks: [{ code: 'steps', title: '玩法步骤', status: 'missing', owner: 'original_zip', detail: '本地接口测试报告' }],
    warnings: [{ code: 'runtime', title: '运行验证', detail: '本地模拟报告，不代表真实事件检查。' }],
    injected_by_packager: ['基础统计'], runtime_requirements: ['需在真实平台验证事件'],
  });
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  return {
    calls,
    setPackageError(value) { packageError = value; },
    holdInspect(promise) { gate = promise; },
    holdLaunch(promise) { launchGate = promise; },
    setLaunchResponse(body, status = 200) { launchResponse = body == null ? null : { body, status }; },
    setAuthResponse(body, status = 200) { authResponse = body == null ? null : { body, status }; },
    async fetch(url, options = {}) {
      url = new URL(url);
      if (url.origin !== 'http://publish-fixture.test') throw new Error('Unexpected external network: ' + url.origin);
      const form = options.body instanceof FormData ? options.body : null;
      const body = form ? Object.fromEntries(form) : options.body ? JSON.parse(options.body) : {};
      if (url.pathname === '/api/auth/login') {
        const passwordMatches = body.password === 'fixture-only-password';
        calls.push({ path: url.pathname, body: { email: body.email, passwordMatches } });
        if (authResponse?.body instanceof Error) throw authResponse.body;
        if (authResponse) return json(authResponse.body, authResponse.status);
        if (!passwordMatches) return json({ status: 'failed', error: '模拟密码错误' }, 400);
        return json({ status: 'ok', user: { email: body.email, name: '本地模拟账号', role: '投放管理员', domain: 'novvy.ai' } });
      }
      calls.push({ path: url.pathname, body });
      if (url.pathname === '/api/parse-store-url') return json({ status: 'ok', apps: [{ app_name: '本地联调产品', platform: 'ios', store_url: body.store_url }] });
      if (url.pathname === '/api/interactive-zip/inspect') {
        if (gate) { await gate; gate = null; }
        const bytes = Buffer.from(await body.zip.arrayBuffer());
        return json({ status: 'ok', total_files: 2, has_index_html: true, has_video: false, asset_count: 1, event_check: report(digest(bytes)) });
      }
      if (url.pathname === '/api/v1/interactive-zip/package') {
        if (packageError) throw new Error('simulated packaging connection lost');
        const bytes = Buffer.from(await body.zip.arrayBuffer());
        const token = digest(bytes);
        if (body.event_check_confirmation !== token) return json({ status: 'needs_confirmation', error: '请先确认检查结果', event_check: report(token) }, 409);
        packaged = bytes;
        return json({ status: 'ok', job_id: 'interactive_fixture', package_file: '本地联调_' + body.tag + '.zip', download_url: '/api/download?file=fixture.zip', injected_events: ['本地接口模拟：未执行真实注入'], event_check: report(token), event_warnings_accepted: true });
      }
      if (url.pathname === '/api/download') return new Response(packaged, { headers: { 'Content-Type': 'application/zip' } });
      if (url.pathname === '/api/v1/auto-launch') {
        if (launchGate) { await launchGate; launchGate = null; }
        if (launchResponse?.body instanceof Error) throw launchResponse.body;
        if (launchResponse) return json(launchResponse.body, launchResponse.status);
        return json({ status: 'ok', code: 200, success: true, data: {
          creativeId: 'cr_local_fixture', creativeName: '本地模拟素材（未实际投放）',
          campaignName: '本地模拟 Campaign', campaignStatus: 'PAUSED', serving: false,
          operator: body.admin_email, themeType: 'story_playable',
          previewUrl: 'https://preview.example/creative_fixture/index.html',
          creatives: [
            { creativeId: 'cr_local_fixture', creativeName: '本地模拟 iOS 创意', productName: '本地测试产品', platform: 'iOS', campaignName: '本地 iOS Campaign', campaignStatus: 'PAUSED' },
            { creativeId: 'cr_local_android', creativeName: '本地模拟 Android 创意', productName: '本地测试产品', platform: 'Android', campaignName: '本地 Android Campaign', campaignStatus: 'PAUSED' },
          ],
        } });
      }
      throw new Error('Unexpected fixture route: ' + url.pathname);
    },
  };
}
