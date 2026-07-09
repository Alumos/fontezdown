export function renderAdminPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>字体蓝奏下载台 - 管理后台</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f8f6;
        --glass: rgba(255, 255, 255, 0.66);
        --glass-strong: rgba(255, 255, 255, 0.88);
        --line: rgba(83, 103, 124, 0.18);
        --text: #142033;
        --muted: #667387;
        --blue: #4d7fcb;
        --blue-deep: #285e9f;
        --green: #2d8a7d;
        --red: #c44848;
        --shadow: 0 24px 72px rgba(35, 49, 73, 0.13);
        --shadow-soft: 0 12px 34px rgba(35, 49, 73, 0.1);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--text);
        font-family:
          Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        background:
          linear-gradient(150deg, rgba(244, 249, 247, 0.98), rgba(235, 242, 249, 0.96) 46%, rgba(249, 242, 246, 0.96)),
          linear-gradient(90deg, rgba(111, 157, 179, 0.12), rgba(128, 169, 150, 0.1), rgba(201, 115, 134, 0.1)),
          repeating-linear-gradient(
            115deg,
            rgba(255, 255, 255, 0.32) 0,
            rgba(255, 255, 255, 0.32) 1px,
            transparent 1px,
            transparent 26px
          );
        background-attachment: fixed;
      }

      button,
      input {
        font: inherit;
      }

      .shell {
        width: min(1080px, calc(100% - 28px));
        margin: 0 auto;
        padding: 28px 0 46px;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      h1,
      h2 {
        margin: 0;
      }

      h1 {
        font-size: clamp(22px, 4vw, 34px);
        letter-spacing: 0;
      }

      h2 {
        font-size: 17px;
      }

      a {
        color: var(--blue);
        text-decoration: none;
        font-weight: 700;
        transition: color 0.18s ease;
      }

      a:hover {
        color: var(--blue-deep);
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.56)),
          var(--glass);
        box-shadow: var(--shadow);
        backdrop-filter: blur(28px) saturate(165%);
      }

      .auth {
        max-width: 500px;
        margin: 10vh auto 0;
        padding: 28px;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.58fr);
        gap: 16px;
      }

      .card {
        padding: 22px;
      }

      .fields {
        display: grid;
        gap: 14px;
        margin-top: 16px;
      }

      .field {
        display: grid;
        gap: 7px;
      }

      label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 750;
      }

      input {
        width: 100%;
        min-height: 46px;
        border: 1px solid var(--line);
        border-radius: 14px;
        color: var(--text);
        background: rgba(255, 255, 255, 0.74);
        outline: 0;
        padding: 10px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      input:focus {
        border-color: rgba(77, 127, 203, 0.58);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 0 0 5px rgba(77, 127, 203, 0.12);
      }

      .btn {
        min-height: 44px;
        border: 0;
        border-radius: 14px;
        padding: 9px 14px;
        background: linear-gradient(180deg, var(--blue), var(--blue-deep));
        box-shadow: 0 13px 26px rgba(77, 127, 203, 0.24);
        color: #fff;
        cursor: pointer;
        font-weight: 800;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 30px rgba(77, 127, 203, 0.25);
      }

      .btn.secondary {
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        box-shadow: 0 8px 18px rgba(35, 49, 73, 0.06);
        color: var(--text);
      }

      .btn.secondary:hover {
        border-color: rgba(77, 127, 203, 0.32);
        box-shadow: var(--shadow-soft);
      }

      .btn.row {
        width: fit-content;
      }

      .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .status {
        min-height: 24px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 650;
      }

      .status.ok {
        color: var(--green);
      }

      .status.err {
        color: var(--red);
      }

      .passcode-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .passcode-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.54);
        padding: 8px 10px;
      }

      .passcode-row strong {
        display: block;
        overflow-wrap: anywhere;
      }

      .passcode-row span {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }

      .hidden {
        display: none !important;
      }

      @media (max-width: 760px) {
        header,
        .grid {
          grid-template-columns: 1fr;
        }

        header {
          align-items: flex-start;
        }

        .auth,
        .card {
          padding: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div>
          <h1>管理后台</h1>
          <div class="status" id="topStatus"></div>
        </div>
        <a href="/">返回主界面</a>
      </header>

      <section class="panel auth hidden" id="authPanel">
        <h2 id="authTitle">登录</h2>
        <div class="fields">
          <div class="field">
            <label for="passcode">后台口令</label>
            <input id="passcode" type="password" autocomplete="current-password" />
          </div>
        </div>
        <div class="actions">
          <button class="btn" id="authBtn" type="button">确认</button>
        </div>
      </section>

      <section class="grid hidden" id="adminPanel">
        <form class="panel card" id="settingsForm">
          <h2>下载配置</h2>
          <div class="fields">
            <div class="field">
              <label for="docUrl">腾讯文档地址</label>
              <input id="docUrl" autocomplete="off" />
            </div>
            <div class="field">
              <label for="clientId">腾讯 Client ID</label>
              <input id="clientId" autocomplete="off" />
            </div>
            <div class="field">
              <label for="accessToken">腾讯 Access Token</label>
              <input id="accessToken" autocomplete="off" type="password" />
            </div>
            <div class="field">
              <label for="openId">腾讯 Open ID</label>
              <input id="openId" autocomplete="off" />
            </div>
            <div class="field">
              <label for="lanzouPwd">蓝奏云密码</label>
              <input id="lanzouPwd" autocomplete="off" type="password" />
            </div>
          </div>
          <div class="actions">
            <button class="btn" type="submit">保存配置</button>
          </div>
        </form>

        <aside class="panel card">
          <h2>后台口令</h2>
          <form class="fields" id="passcodeForm">
            <div class="field">
              <label for="currentPasscode">当前口令</label>
              <input id="currentPasscode" type="password" autocomplete="current-password" />
            </div>
            <div class="field">
              <label for="nextPasscode">新口令</label>
              <input id="nextPasscode" type="password" autocomplete="new-password" />
            </div>
            <button class="btn row" type="submit">更新口令</button>
          </form>

          <h2 style="margin-top: 24px">主界面访问口令</h2>
          <form class="fields" id="accessPasscodeForm">
            <div class="field">
              <label for="accessLabel">口令名称</label>
              <input id="accessLabel" autocomplete="off" placeholder="例如：自己、临时分享" />
            </div>
            <div class="field">
              <label for="accessPasscode">访问口令</label>
              <input id="accessPasscode" autocomplete="off" />
            </div>
            <div class="actions">
              <button class="btn row" type="submit">添加口令</button>
              <button class="btn secondary row" id="generateAccessPasscodeBtn" type="button">
                随机生成
              </button>
            </div>
          </form>
          <div class="passcode-list" id="accessPasscodeList"></div>

          <div class="actions">
            <button class="btn secondary" id="logoutBtn" type="button">退出登录</button>
          </div>
        </aside>
      </section>
    </div>

    <script>
      var state = {
        mode: 'login',
        accessPasscodes: [],
      };

      var els = {
        topStatus: document.getElementById('topStatus'),
        authPanel: document.getElementById('authPanel'),
        adminPanel: document.getElementById('adminPanel'),
        authTitle: document.getElementById('authTitle'),
        passcode: document.getElementById('passcode'),
        authBtn: document.getElementById('authBtn'),
        settingsForm: document.getElementById('settingsForm'),
        passcodeForm: document.getElementById('passcodeForm'),
        logoutBtn: document.getElementById('logoutBtn'),
        accessPasscodeForm: document.getElementById('accessPasscodeForm'),
        accessLabel: document.getElementById('accessLabel'),
        accessPasscode: document.getElementById('accessPasscode'),
        accessPasscodeList: document.getElementById('accessPasscodeList'),
        generateAccessPasscodeBtn: document.getElementById('generateAccessPasscodeBtn'),
        docUrl: document.getElementById('docUrl'),
        clientId: document.getElementById('clientId'),
        accessToken: document.getElementById('accessToken'),
        openId: document.getElementById('openId'),
        lanzouPwd: document.getElementById('lanzouPwd'),
        currentPasscode: document.getElementById('currentPasscode'),
        nextPasscode: document.getElementById('nextPasscode'),
      };

      function setStatus(text, kind) {
        els.topStatus.textContent = text || '';
        els.topStatus.className = 'status' + (kind ? ' ' + kind : '');
      }

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function formatTime(value) {
        if (!value) return '';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('zh-CN', { hour12: false });
      }

      function randomPasscode() {
        var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        return Array.prototype.map
          .call(bytes, function (byte) {
            return alphabet[byte % alphabet.length];
          })
          .join('');
      }

      async function requestJson(url, options) {
        var response = await fetch(url, options || {});
        var text = await response.text();
        var data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            '请求返回非 JSON：' + (text ? text.slice(0, 120) : response.status),
          );
        }
        if (!response.ok || data.code !== 0) {
          throw new Error(data.msg || '请求失败');
        }
        return data.data;
      }

      function postJson(url, body) {
        return requestJson(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      function deleteJson(url) {
        return requestJson(url, { method: 'DELETE' });
      }

      function renderAccessPasscodes() {
        if (!state.accessPasscodes.length) {
          els.accessPasscodeList.innerHTML =
            '<div class="status">还没有主界面访问口令</div>';
          return;
        }

        els.accessPasscodeList.innerHTML = state.accessPasscodes
          .map(function (item) {
            return (
              '<div class="passcode-row">' +
              '<div><strong>' +
              escapeHtml(item.label || '未命名口令') +
              '</strong><span>' +
              escapeHtml(formatTime(item.createdAt)) +
              '</span></div>' +
              '<button class="btn secondary row" data-delete-access-id="' +
              escapeHtml(item.id) +
              '" type="button">删除</button>' +
              '</div>'
            );
          })
          .join('');
      }

      async function loadAccessPasscodes() {
        var data = await requestJson('/api/admin/access-passcodes');
        state.accessPasscodes = data.passcodes || [];
        renderAccessPasscodes();
      }

      function showAuth(mode) {
        state.mode = mode;
        els.authTitle.textContent = mode === 'setup' ? '设置后台口令' : '登录后台';
        els.authBtn.textContent = mode === 'setup' ? '设置并进入' : '登录';
        els.passcode.value = '';
        els.authPanel.classList.remove('hidden');
        els.adminPanel.classList.add('hidden');
      }

      async function showAdmin() {
        els.authPanel.classList.add('hidden');
        els.adminPanel.classList.remove('hidden');
        var settings = await requestJson('/api/admin/settings');
        els.docUrl.value = settings.docUrl || '';
        els.clientId.value = settings.clientId || '';
        els.accessToken.value = settings.accessToken || '';
        els.openId.value = settings.openId || '';
        els.lanzouPwd.value = settings.lanzouPwd || '';
        await loadAccessPasscodes();
      }

      async function boot() {
        try {
          var status = await requestJson('/api/admin/status');
          if (!status.hasAdminPasscode) {
            showAuth('setup');
            setStatus('首次进入，请设置后台口令');
          } else if (status.isAuthenticated) {
            await showAdmin();
            setStatus('已登录', 'ok');
          } else {
            showAuth('login');
          }
        } catch (error) {
          showAuth('login');
          setStatus(error.message, 'err');
        }
      }

      els.authBtn.addEventListener('click', async function () {
        try {
          var passcode = els.passcode.value.trim();
          await postJson(
            state.mode === 'setup' ? '/api/admin/setup' : '/api/admin/login',
            { passcode: passcode },
          );
          await showAdmin();
          setStatus(state.mode === 'setup' ? '口令已设置' : '登录成功', 'ok');
        } catch (error) {
          setStatus(error.message, 'err');
        }
      });

      els.passcode.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') els.authBtn.click();
      });

      els.settingsForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
          await postJson('/api/admin/settings', {
            docUrl: els.docUrl.value.trim(),
            clientId: els.clientId.value.trim(),
            accessToken: els.accessToken.value.trim(),
            openId: els.openId.value.trim(),
            lanzouPwd: els.lanzouPwd.value.trim(),
          });
          setStatus('配置已保存', 'ok');
        } catch (error) {
          setStatus(error.message, 'err');
        }
      });

      els.passcodeForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
          await postJson('/api/admin/passcode', {
            currentPasscode: els.currentPasscode.value.trim(),
            nextPasscode: els.nextPasscode.value.trim(),
          });
          setStatus('口令已更新，请重新登录', 'ok');
          showAuth('login');
        } catch (error) {
          setStatus(error.message, 'err');
        }
      });

      els.generateAccessPasscodeBtn.addEventListener('click', function () {
        els.accessPasscode.value = randomPasscode();
        els.accessPasscode.focus();
      });

      els.accessPasscodeForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
          var data = await postJson('/api/admin/access-passcodes', {
            label: els.accessLabel.value.trim(),
            passcode: els.accessPasscode.value.trim(),
          });
          els.accessLabel.value = '';
          els.accessPasscode.value = '';
          await loadAccessPasscodes();
          setStatus('访问口令已添加：' + data.passcode, 'ok');
        } catch (error) {
          setStatus(error.message, 'err');
        }
      });

      els.accessPasscodeList.addEventListener('click', async function (event) {
        var button = event.target.closest('[data-delete-access-id]');
        if (!button) return;

        try {
          await deleteJson(
            '/api/admin/access-passcodes/' +
              encodeURIComponent(button.getAttribute('data-delete-access-id')),
          );
          await loadAccessPasscodes();
          setStatus('访问口令已删除', 'ok');
        } catch (error) {
          setStatus(error.message, 'err');
        }
      });

      els.logoutBtn.addEventListener('click', async function () {
        await postJson('/api/admin/logout', {});
        showAuth('login');
        setStatus('已退出');
      });

      boot();
    </script>
  </body>
</html>`;
}
