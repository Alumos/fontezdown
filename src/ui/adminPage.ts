import { externalFontCssUrl, fontFamilyStack, siteName } from "./brand.js";

export function renderAdminPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${siteName} - 管理后台</title>
    <style>
      @import url("${externalFontCssUrl}");

      :root {
        color-scheme: light;
        --surface: rgba(255, 255, 255, 0.64);
        --surface-strong: rgba(255, 255, 255, 0.84);
        --ink: #172025;
        --muted: #60717a;
        --line: rgba(39, 59, 67, 0.18);
        --line-strong: rgba(39, 59, 67, 0.34);
        --blue: #3d789d;
        --blue-deep: #235270;
        --green: #3b846f;
        --green-deep: #21634f;
        --gold: #b98530;
        --red: #b94b55;
        --liquid-bg: rgba(255, 255, 255, 0.12);
        --liquid-bg-strong: rgba(255, 255, 255, 0.18);
        --liquid-border: rgba(255, 255, 255, 0.36);
        --liquid-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.52),
          inset 0 -1px 0 rgba(255, 255, 255, 0.2),
          inset 6px 6px 16px rgba(255, 255, 255, 0.14),
          0 18px 44px rgba(22, 34, 42, 0.24);
        --liquid-shadow-soft:
          inset 0 1px 0 rgba(255, 255, 255, 0.42),
          inset 0 -1px 0 rgba(255, 255, 255, 0.16),
          0 10px 28px rgba(22, 34, 42, 0.16);
        --radius-lg: 26px;
        --radius-md: 18px;
        --radius-sm: 14px;
        --radius-pill: 999px;
        --shadow: var(--liquid-shadow);
        --shadow-soft: var(--liquid-shadow-soft);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: ${fontFamilyStack};
        background:
          linear-gradient(135deg, rgba(215, 230, 236, 0.92), rgba(239, 244, 240, 0.9) 44%, rgba(230, 224, 239, 0.86)),
          linear-gradient(115deg, rgba(61, 120, 157, 0.2), transparent 45%),
          linear-gradient(245deg, rgba(59, 132, 111, 0.18), transparent 52%),
          repeating-linear-gradient(
            115deg,
            rgba(39, 59, 67, 0.055) 0,
            rgba(39, 59, 67, 0.055) 1px,
            transparent 1px,
            transparent 24px
          );
        background-attachment: fixed;
      }

      button {
        border: 0;
        cursor: pointer;
      }

      button,
      input {
        font: inherit;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .shell {
        width: min(1180px, calc(100% - 28px));
        margin: 0 auto;
        padding: 22px 0 46px;
      }

      header {
        position: sticky;
        top: 12px;
        z-index: 5;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        box-shadow: var(--shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
        padding: 15px;
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
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        box-shadow: var(--shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
      }

      .auth {
        max-width: 500px;
        margin: 10vh auto 0;
        padding: 28px;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.62fr);
        gap: 16px;
        align-items: start;
      }

      .card {
        padding: 20px;
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
        border-radius: var(--radius-md);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.58);
        outline: 0;
        padding: 10px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      input:focus {
        border-color: rgba(61, 111, 146, 0.58);
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 0 0 5px rgba(61, 111, 146, 0.12);
      }

      .btn {
        position: relative;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
        border-radius: var(--radius-md);
        padding: 9px 14px;
        background: linear-gradient(180deg, var(--blue), var(--blue-deep));
        box-shadow: 0 12px 24px rgba(61, 111, 146, 0.24);
        color: #fff;
        font-weight: 800;
        text-decoration: none;
        overflow: hidden;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .btn::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-120%);
        background: linear-gradient(
          100deg,
          transparent,
          rgba(255, 255, 255, 0.32),
          transparent
        );
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 30px rgba(61, 111, 146, 0.25);
      }

      .btn:hover::after {
        animation: sheen 0.9s ease;
      }

      .btn.secondary {
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.58);
        box-shadow: 0 8px 18px rgba(33, 36, 32, 0.06);
        color: var(--ink);
      }

      .btn.secondary:hover {
        border-color: rgba(61, 111, 146, 0.32);
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
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.48);
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

      .file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      @keyframes sheen {
        to {
          transform: translateX(120%);
        }
      }

      @media (max-width: 760px) {
        header,
        .grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        header {
          align-items: flex-start;
        }

        .actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .btn,
        .btn.row {
          width: 100%;
        }

        .auth,
        .card {
          padding: 18px;
        }

        .passcode-row {
          grid-template-columns: 1fr;
          align-items: stretch;
        }
      }
    </style>
  </head>
  <body>
    <svg width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="liquid_glass_filter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.018 0.036"
          numOctaves="2"
          seed="8"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="12"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>

    <div class="shell">
      <header>
        <div>
          <h1>${siteName} 管理后台</h1>
          <div class="status" id="topStatus"></div>
        </div>
        <a class="btn secondary" href="/">返回主界面</a>
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
            <button class="btn secondary" id="exportConfigBtn" type="button">
              导出配置
            </button>
            <button class="btn secondary" id="importConfigBtn" type="button">
              导入配置
            </button>
          </div>
          <input
            class="file-input"
            id="configImportFile"
            type="file"
            accept="application/json,.json"
          />
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
        exportConfigBtn: document.getElementById('exportConfigBtn'),
        importConfigBtn: document.getElementById('importConfigBtn'),
        configImportFile: document.getElementById('configImportFile'),
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

      function applySettings(settings) {
        els.docUrl.value = settings.docUrl || '';
        els.clientId.value = settings.clientId || '';
        els.accessToken.value = settings.accessToken || '';
        els.openId.value = settings.openId || '';
        els.lanzouPwd.value = settings.lanzouPwd || '';
      }

      function downloadJsonFile(fileName, value) {
        var blob = new Blob([JSON.stringify(value, null, 2) + '\\n'], {
          type: 'application/json;charset=utf-8',
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      function configFileName() {
        return (
          'fontezdown-settings-' +
          new Date().toISOString().replace(/[:.]/g, '-') +
          '.json'
        );
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
              escapeHtml(item.readonly ? '环境变量' : formatTime(item.createdAt)) +
              '</span></div>' +
              (item.readonly
                ? '<span class="status">只读</span>'
                : '<button class="btn secondary row" data-delete-access-id="' +
                  escapeHtml(item.id) +
                  '" type="button">删除</button>') +
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
        applySettings(settings);
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

      els.exportConfigBtn.addEventListener('click', async function () {
        try {
          els.exportConfigBtn.disabled = true;
          var config = await requestJson('/api/admin/config/export');
          downloadJsonFile(configFileName(), config);
          setStatus('配置已导出', 'ok');
        } catch (error) {
          setStatus(error.message, 'err');
        } finally {
          els.exportConfigBtn.disabled = false;
        }
      });

      els.importConfigBtn.addEventListener('click', function () {
        els.configImportFile.value = '';
        els.configImportFile.click();
      });

      els.configImportFile.addEventListener('change', async function () {
        var file = els.configImportFile.files && els.configImportFile.files[0];
        if (!file) return;

        try {
          var config = JSON.parse(await file.text());
          var shouldOverwrite = window.confirm(
            '导入会覆盖当前下载配置，后台口令和访问口令不会改变。是否继续？',
          );
          if (!shouldOverwrite) {
            setStatus('已取消导入');
            return;
          }

          els.importConfigBtn.disabled = true;
          var settings = await postJson('/api/admin/config/import', {
            config: config,
            overwrite: true,
          });
          applySettings(settings);
          setStatus('配置已导入并覆盖当前设置', 'ok');
        } catch (error) {
          setStatus(
            error instanceof SyntaxError ? '配置文件不是有效 JSON' : error.message,
            'err',
          );
        } finally {
          els.importConfigBtn.disabled = false;
          els.configImportFile.value = '';
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
