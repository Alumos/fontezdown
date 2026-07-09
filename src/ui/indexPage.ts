export function renderIndexPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>字体蓝奏下载台</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f8f6;
        --glass: rgba(255, 255, 255, 0.66);
        --glass-strong: rgba(255, 255, 255, 0.88);
        --line: rgba(83, 103, 124, 0.18);
        --line-strong: rgba(79, 101, 126, 0.34);
        --text: #142033;
        --muted: #667387;
        --blue: #4d7fcb;
        --blue-deep: #285e9f;
        --green: #2d8a7d;
        --green-soft: #dff3ed;
        --iris: #7779b7;
        --rose: #c97386;
        --red: #c44848;
        --amber: #9c6a1a;
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

      button {
        border: 0;
        cursor: pointer;
        font: inherit;
      }

      input {
        font: inherit;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      a {
        color: inherit;
      }

      .shell {
        width: min(1160px, calc(100% - 28px));
        margin: 0 auto;
        padding: 22px 0 42px;
      }

      .hidden {
        display: none !important;
      }

      .auth-shell {
        width: min(520px, calc(100% - 28px));
        min-height: 100vh;
        display: grid;
        place-items: center;
        margin: 0 auto;
        padding: 28px 0;
      }

      .auth-card {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 24px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.56)),
          var(--glass);
        box-shadow: var(--shadow);
        backdrop-filter: blur(28px) saturate(168%);
        padding: 30px;
      }

      .auth-card h1 {
        text-align: center;
      }

      .auth-status {
        min-height: 22px;
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
        text-align: center;
      }

      .auth-status.ok {
        color: var(--green);
      }

      .auth-status.err {
        color: var(--red);
      }

      .auth-fields {
        display: grid;
        gap: 9px;
        margin-top: 24px;
      }

      .auth-fields label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }

      .auth-input {
        width: 100%;
        min-height: 48px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.76);
        color: var(--text);
        outline: 0;
        padding: 11px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .auth-input:focus {
        border-color: rgba(77, 127, 203, 0.62);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 0 0 5px rgba(77, 127, 203, 0.13);
      }

      .auth-card .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-top: 16px;
      }

      .auth-card .btn {
        width: 100%;
      }

      .topbar {
        position: sticky;
        top: 12px;
        z-index: 5;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58)),
          var(--glass);
        box-shadow: var(--shadow);
        backdrop-filter: blur(28px) saturate(165%);
        padding: 15px;
      }

      h1 {
        margin: 0;
        font-size: clamp(21px, 4vw, 32px);
        line-height: 1.1;
        letter-spacing: 0;
      }

      .subline {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 26px;
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 650;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--line-strong);
      }

      .dot.ok {
        background: var(--green);
      }

      .dot.err {
        background: var(--red);
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .btn {
        position: relative;
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
        border-radius: 14px;
        padding: 9px 14px;
        color: #fff;
        background: linear-gradient(180deg, var(--blue), var(--blue-deep));
        box-shadow: 0 13px 26px rgba(77, 127, 203, 0.24);
        font-weight: 800;
        text-decoration: none;
        overflow: hidden;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease;
      }

      .btn.secondary {
        color: var(--text);
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        box-shadow: 0 8px 18px rgba(35, 49, 73, 0.06);
      }

      .btn.green {
        background: linear-gradient(180deg, #46a896, var(--green));
        box-shadow: 0 12px 22px rgba(45, 138, 125, 0.18);
      }

      .btn.small {
        min-height: 36px;
        border-radius: 10px;
        padding: 7px 11px;
        font-size: 13px;
      }

      .btn::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-120%);
        background: linear-gradient(
          100deg,
          transparent,
          rgba(255, 255, 255, 0.35),
          transparent
        );
      }

      .btn:hover::after {
        animation: sheen 0.9s ease;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 30px rgba(77, 127, 203, 0.25);
      }

      .btn.secondary:hover {
        border-color: rgba(77, 127, 203, 0.32);
        box-shadow: var(--shadow-soft);
      }

      .btn.disabled {
        color: var(--muted);
        background: rgba(238, 241, 245, 0.86);
        box-shadow: none;
        cursor: not-allowed;
      }

      .btn.disabled::after {
        content: none;
      }

      .btn.disabled:hover {
        transform: none;
        box-shadow: none;
      }

      @keyframes sheen {
        to {
          transform: translateX(120%);
        }
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin: 16px 0;
      }

      .stat {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.62);
        backdrop-filter: blur(22px) saturate(150%);
        box-shadow: 0 10px 24px rgba(35, 49, 73, 0.07);
        padding: 14px;
      }

      .stat strong {
        display: block;
        font-size: 26px;
        line-height: 1;
        color: #20385e;
      }

      .stat span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }

      .controls {
        display: grid;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(22px) saturate(150%);
        box-shadow: 0 10px 28px rgba(35, 49, 73, 0.08);
        padding: 14px;
        margin-bottom: 14px;
      }

      .search-row {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .filter-actions {
        display: flex;
        gap: 10px;
      }

      .search {
        min-height: 44px;
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.74);
        color: var(--text);
        outline: 0;
        padding: 10px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .search:focus {
        border-color: rgba(77, 127, 203, 0.58);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 0 0 5px rgba(77, 127, 203, 0.12);
      }

      .btn.active {
        color: #fff;
        background: linear-gradient(180deg, #46a896, var(--green));
        box-shadow: 0 12px 22px rgba(45, 138, 125, 0.18);
      }

      .filter-groups {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        border-top: 1px solid var(--line);
        padding-top: 12px;
      }

      .filter-group {
        min-width: 0;
        border: 0;
        margin: 0;
        padding: 0;
      }

      .filter-group legend {
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
        margin-bottom: 8px;
        padding: 0;
      }

      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .check {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.64);
        color: var(--text);
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 760;
        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease,
          color 0.18s ease;
      }

      .check:hover {
        transform: translateY(-1px);
        border-color: rgba(77, 127, 203, 0.34);
      }

      .check:has(input:checked) {
        border-color: rgba(45, 138, 125, 0.38);
        background: rgba(223, 243, 237, 0.78);
        color: #17685d;
      }

      .check input {
        width: 15px;
        height: 15px;
        accent-color: var(--blue);
      }

      .list {
        display: grid;
        gap: 12px;
      }

      .item {
        position: relative;
        border: 1px solid var(--line);
        border-radius: 20px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.52)),
          var(--glass);
        box-shadow: 0 12px 34px rgba(35, 49, 73, 0.1);
        backdrop-filter: blur(24px) saturate(150%);
        overflow: hidden;
        animation: rise 0.36s ease both;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .item:hover {
        transform: translateY(-2px);
        border-color: rgba(77, 127, 203, 0.22);
        box-shadow: 0 18px 42px rgba(35, 49, 73, 0.13);
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .item-main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 16px;
      }

      .font-name {
        margin: 0;
        font-size: 16px;
        font-weight: 820;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .url {
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .tag {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(77, 127, 203, 0.16);
        border-radius: 999px;
        background: rgba(234, 241, 255, 0.7);
        color: var(--blue-deep);
        font-size: 12px;
        font-weight: 800;
        padding: 3px 8px;
      }

      .result {
        border-top: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.44);
        padding: 0 16px 16px;
      }

      .progress-wrap {
        padding: 16px 0 0;
      }

      .progress {
        height: 8px;
        border-radius: 999px;
        background: rgba(103, 121, 145, 0.2);
        overflow: hidden;
      }

      .progress span {
        display: block;
        width: 42%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--blue), var(--green), var(--rose));
        animation: loading 1.08s ease-in-out infinite alternate;
      }

      @keyframes loading {
        from {
          transform: translateX(-55%);
        }
        to {
          transform: translateX(155%);
        }
      }

      .result-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        min-height: 52px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 28px;
        border-radius: 999px;
        padding: 5px 10px;
        color: var(--amber);
        background: rgba(255, 241, 214, 0.9);
        font-size: 12px;
        font-weight: 800;
      }

      .badge.ok {
        color: var(--green);
        background: rgba(224, 247, 235, 0.9);
      }

      .badge.err {
        color: var(--red);
        background: rgba(255, 229, 229, 0.9);
      }

      .files {
        display: grid;
        gap: 8px;
        overflow: hidden;
        transition:
          max-height 0.28s ease,
          opacity 0.22s ease;
      }

      .files.closed {
        max-height: 0;
        opacity: 0;
      }

      .files.open {
        max-height: 1600px;
        opacity: 1;
      }

      .file-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 92px 100px auto;
        gap: 10px;
        align-items: center;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.58);
        color: var(--muted);
        font-size: 13px;
        padding: 8px 9px;
      }

      .file-name {
        color: var(--text);
        font-weight: 750;
        overflow-wrap: anywhere;
      }

      .empty {
        min-height: 280px;
        display: grid;
        place-items: center;
        border: 1px dashed var(--line-strong);
        border-radius: 20px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(18px) saturate(145%);
        text-align: center;
        padding: 28px;
        font-weight: 700;
      }

      .burst {
        position: fixed;
        left: 50%;
        top: 22px;
        z-index: 20;
        transform: translateX(-50%);
        border: 1px solid rgba(45, 138, 125, 0.25);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
        color: var(--green);
        padding: 9px 14px;
        font-weight: 850;
        animation: toast 1.7s ease both;
        pointer-events: none;
      }

      .to-top {
        position: fixed;
        right: max(18px, calc((100vw - 1160px) / 2 + 18px));
        bottom: 22px;
        z-index: 12;
        width: 48px;
        height: 48px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
        backdrop-filter: blur(18px) saturate(145%);
        box-shadow: var(--shadow-soft);
        color: var(--blue-deep);
        font-size: 22px;
        font-weight: 900;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
      }

      .to-top.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .icp-footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 8px;
        z-index: 4;
        display: flex;
        justify-content: center;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        pointer-events: none;
      }

      .icp-footer a {
        color: inherit;
        text-decoration: none;
        pointer-events: auto;
      }

      .icp-footer a:hover {
        color: var(--blue-deep);
      }

      @keyframes toast {
        0% {
          opacity: 0;
          transform: translate(-50%, -8px) scale(0.94);
        }
        16%,
        78% {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -8px) scale(0.98);
        }
      }

      @media (max-width: 820px) {
        .shell {
          width: min(100% - 20px, 680px);
          padding-top: 10px;
        }

        .topbar,
        .summary,
        .controls,
        .search-row,
        .filter-groups {
          grid-template-columns: 1fr;
        }

        .actions,
        .filter-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .btn {
          width: 100%;
        }

        .item-main,
        .result-head,
        .file-row {
          grid-template-columns: 1fr;
        }

        .file-row .btn {
          width: fit-content;
        }

        .to-top {
          right: 14px;
          bottom: 16px;
        }

        .icp-footer {
          bottom: 6px;
          font-size: 11px;
        }
      }
    </style>
  </head>
  <body>
    <section class="auth-shell" id="authPanel">
      <div class="auth-card">
        <h1>字体蓝奏下载台</h1>
        <p class="auth-status" id="authStatus">请输入口令进入</p>
        <div class="auth-fields">
          <label for="homePasscode">访问口令</label>
          <input
            class="auth-input"
            id="homePasscode"
            type="password"
            autocomplete="current-password"
          />
        </div>
        <div class="actions">
          <button class="btn" id="homeAuthBtn" type="button">进入</button>
          <a class="btn secondary" id="homeAdminLink" href="/admin">管理后台</a>
        </div>
      </div>
    </section>

    <div class="shell app-shell hidden" id="appShell">
      <header class="topbar">
        <div>
          <h1>字体蓝奏下载台</h1>
          <div class="subline">
            <span class="dot" id="statusDot"></span>
            <span id="statusText">待同步</span>
          </div>
        </div>
        <div class="actions">
          <a class="btn secondary" href="/admin">管理后台</a>
          <button class="btn" id="syncBtn" type="button">同步文档</button>
        </div>
      </header>

      <section class="summary">
        <div class="stat"><strong id="totalCount">0</strong><span>字体条目</span></div>
        <div class="stat"><strong id="visibleCount">0</strong><span>当前显示</span></div>
        <div class="stat"><strong id="parsedCount">0</strong><span>已解析</span></div>
        <div class="stat"><strong id="fileCount">0</strong><span>可下载文件</span></div>
      </section>

      <section class="controls">
        <div class="search-row">
          <input
            class="search"
            id="searchInput"
            autocomplete="off"
            placeholder="搜索字体名"
          />
          <div class="filter-actions">
            <button class="btn secondary" id="parsedFilterBtn" type="button">
              只看已解析
            </button>
            <button class="btn secondary" id="clearFiltersBtn" type="button">
              清空筛选
            </button>
          </div>
        </div>

        <div class="filter-groups">
          <fieldset class="filter-group">
            <legend>字体类别</legend>
            <div class="checks">
              <label class="check">
                <input type="checkbox" data-filter-group="family" value="wan" />
                <span>丸系</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="family" value="yuan" />
                <span>圆系</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="family" value="super" />
                <span>超级系</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="family" value="hei" />
                <span>黑系</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="family" value="kai" />
                <span>楷系</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="filter-group">
            <legend>字重</legend>
            <div class="checks">
              <label class="check">
                <input type="checkbox" data-filter-group="weight" value="w3" />
                <span>三字重</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="weight" value="w4" />
                <span>四字重</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="weight" value="w5" />
                <span>五字重</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="weight" value="w6" />
                <span>六字重</span>
              </label>
              <label class="check">
                <input type="checkbox" data-filter-group="weight" value="multi" />
                <span>多字重</span>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      <main class="list" id="fontList">
        <div class="empty">点击“同步文档”获取字体列表</div>
      </main>
    </div>

    <button class="to-top" id="topButton" type="button" aria-label="回到顶部">
      ↑
    </button>

    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        苏ICP备2021038338号-1
      </a>
    </footer>

    <script>
      var state = {
        items: [],
        parsed: {},
        loadingIds: {},
        openIds: {},
        filterParsed: false,
        familyFilters: [],
        weightFilters: [],
        searchQuery: '',
        ready: false,
      };

      var els = {
        appShell: document.getElementById('appShell'),
        authPanel: document.getElementById('authPanel'),
        authStatus: document.getElementById('authStatus'),
        homePasscode: document.getElementById('homePasscode'),
        homeAuthBtn: document.getElementById('homeAuthBtn'),
        homeAdminLink: document.getElementById('homeAdminLink'),
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),
        syncBtn: document.getElementById('syncBtn'),
        searchInput: document.getElementById('searchInput'),
        parsedFilterBtn: document.getElementById('parsedFilterBtn'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        topButton: document.getElementById('topButton'),
        totalCount: document.getElementById('totalCount'),
        visibleCount: document.getElementById('visibleCount'),
        parsedCount: document.getElementById('parsedCount'),
        fileCount: document.getElementById('fileCount'),
        fontList: document.getElementById('fontList'),
        filterInputs: document.querySelectorAll('[data-filter-group]'),
      };

      var familyOptions = [
        { id: 'wan', label: '丸系', keywords: ['丸'] },
        { id: 'yuan', label: '圆系', keywords: ['圆'] },
        { id: 'super', label: '超级系', keywords: ['超级'] },
        { id: 'hei', label: '黑系', keywords: ['黑'] },
        { id: 'kai', label: '楷系', keywords: ['楷'] },
      ];

      var weightOptions = [
        { id: 'w3', label: '三字重', pattern: /(?:三|3)\s*字重/ },
        { id: 'w4', label: '四字重', pattern: /(?:四|4)\s*字重/ },
        { id: 'w5', label: '五字重', pattern: /(?:五|5)\s*字重/ },
        { id: 'w6', label: '六字重', pattern: /(?:六|6)\s*字重/ },
        {
          id: 'multi',
          label: '多字重',
          pattern: /多\s*字重|(?:七|八|九|十|[7-9]|1[0-9])\s*字重/,
        },
      ];

      function setStatus(text, kind) {
        els.statusText.textContent = text;
        els.statusDot.className = 'dot' + (kind ? ' ' + kind : '');
      }

      function setAuthStatus(text, kind) {
        els.authStatus.textContent = text || '';
        els.authStatus.className = 'auth-status' + (kind ? ' ' + kind : '');
      }

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function isHttpUrl(value) {
        try {
          var url = new URL(String(value || ''));
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      }

      function renderDownloadButton(file) {
        if (isHttpUrl(file.downloadUrl)) {
          return (
            '<a class="btn green small" href="' +
            escapeHtml(file.downloadUrl) +
            '" target="_blank" rel="noopener">下载</a>'
          );
        }

        return (
          '<span class="btn small disabled" title="' +
          escapeHtml(file.error || '未获取到下载地址') +
          '">解析失败</span>'
        );
      }

      function formatTime(value) {
        if (!value) return '';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('zh-CN', { hour12: false });
      }

      function optionById(options, id) {
        return options.find(function (option) {
          return option.id === id;
        });
      }

      function optionMatches(option, fontName) {
        if (!option) return false;
        if (option.keywords) {
          return option.keywords.some(function (keyword) {
            return fontName.indexOf(keyword) !== -1;
          });
        }
        return option.pattern ? option.pattern.test(fontName) : false;
      }

      function matchesOptionGroup(fontName, selectedIds, options) {
        if (selectedIds.length === 0) return true;
        return selectedIds.some(function (id) {
          return optionMatches(optionById(options, id), fontName);
        });
      }

      function fontTags(fontName) {
        return familyOptions.concat(weightOptions).filter(function (option) {
          return optionMatches(option, fontName);
        });
      }

      function selectedFilterValues(group) {
        return Array.prototype.slice
          .call(document.querySelectorAll('[data-filter-group="' + group + '"]:checked'))
          .map(function (input) {
            return input.value;
          });
      }

      function syncFilterState() {
        state.familyFilters = selectedFilterValues('family');
        state.weightFilters = selectedFilterValues('weight');
      }

      function hasActiveListFilter() {
        return Boolean(
          state.searchQuery.trim() ||
            state.filterParsed ||
            state.familyFilters.length ||
            state.weightFilters.length,
        );
      }

      function applyFontData(data) {
        state.items = data.items || [];
        state.parsed = {};
        state.loadingIds = {};
        state.openIds = {};
        state.filterParsed = false;
        render();
      }

      function showAuth(message, kind) {
        els.appShell.classList.add('hidden');
        els.authPanel.classList.remove('hidden');
        setAuthStatus(message || '请输入口令进入', kind);
        els.homePasscode.value = '';
        setTimeout(function () {
          els.homePasscode.focus();
        }, 0);
      }

      async function showApp() {
        els.authPanel.classList.add('hidden');
        els.appShell.classList.remove('hidden');
        await loadConfig();
        await loadCachedFonts();
      }

      function showBurst(text) {
        var old = document.querySelector('.burst');
        if (old) old.remove();
        var node = document.createElement('div');
        node.className = 'burst';
        node.textContent = text;
        document.body.appendChild(node);
        setTimeout(function () {
          node.remove();
        }, 1800);
      }

      function updateStats(visibleCount) {
        var parsedValues = Object.values(state.parsed);
        var parsedOk = parsedValues.filter(function (entry) {
          return entry && entry.files;
        });
        var files = parsedOk.reduce(function (sum, entry) {
          return sum + (entry.files || []).length;
        }, 0);

        els.totalCount.textContent = String(state.items.length);
        els.visibleCount.textContent = String(visibleCount);
        els.parsedCount.textContent = String(parsedOk.length);
        els.fileCount.textContent = String(files);
        els.parsedFilterBtn.className =
          'btn secondary' + (state.filterParsed ? ' active' : '');
        els.clearFiltersBtn.disabled = !hasActiveListFilter();
      }

      function filteredItems() {
        var query = state.searchQuery.trim().toLowerCase();
        return state.items.filter(function (item) {
          var fontName = item.fontName || '';
          var matchesSearch =
            !query || fontName.toLowerCase().includes(query);
          var matchesParsed =
            !state.filterParsed ||
            Boolean(state.parsed[item.id] && state.parsed[item.id].files);
          var matchesFamily = matchesOptionGroup(
            fontName,
            state.familyFilters,
            familyOptions,
          );
          var matchesWeight = matchesOptionGroup(
            fontName,
            state.weightFilters,
            weightOptions,
          );
          return matchesSearch && matchesParsed && matchesFamily && matchesWeight;
        });
      }

      function render() {
        var items = filteredItems();
        updateStats(items.length);

        if (state.items.length === 0) {
          els.fontList.innerHTML =
            '<div class="empty">点击“同步文档”获取字体列表</div>';
          return;
        }

        if (items.length === 0) {
          els.fontList.innerHTML =
            '<div class="empty">没有符合条件的字体条目</div>';
          return;
        }

        els.fontList.innerHTML = items
          .map(function (item, index) {
            var parsed = state.parsed[item.id];
            var loading = state.loadingIds[item.id];
            var isOpen = state.openIds[item.id] !== false;
            var tags = fontTags(item.fontName || '');
            var tagsHtml = tags.length
              ? '<div class="tags">' +
                tags
                  .map(function (tag) {
                    return '<span class="tag">' + escapeHtml(tag.label) + '</span>';
                  })
                  .join('') +
                '</div>'
              : '';
            var resultHtml = '';

            if (loading) {
              resultHtml =
                '<div class="result"><div class="progress-wrap"><div class="progress"><span></span></div></div></div>';
            } else if (parsed && parsed.error) {
              resultHtml =
                '<div class="result"><div class="result-head"><span class="badge err">' +
                escapeHtml(parsed.error) +
                '</span></div></div>';
            } else if (parsed && parsed.files) {
              var files = parsed.files || [];
              resultHtml =
                '<div class="result">' +
                '<div class="result-head">' +
                '<span class="badge ok">已解析 ' +
                files.length +
                ' 个文件</span>' +
                '<button class="btn secondary small" data-toggle-id="' +
                escapeHtml(item.id) +
                '" type="button">' +
                (isOpen ? '折叠列表' : '展开列表') +
                '</button>' +
                '</div>' +
                '<div class="files ' +
                (isOpen ? 'open' : 'closed') +
                '">' +
                files
                  .map(function (file) {
                    return (
                      '<div class="file-row">' +
                      '<div class="file-name">' +
                      escapeHtml(file.name || '未命名文件') +
                      '</div>' +
                      '<div>' +
                      escapeHtml(file.size || '-') +
                      '</div>' +
                      '<div>' +
                      escapeHtml(file.date || '-') +
                      '</div>' +
                      renderDownloadButton(file) +
                      '</div>'
                    );
                  })
                  .join('') +
                '</div></div>';
            }

            return (
              '<article class="item" style="animation-delay:' +
              Math.min(index * 18, 180) +
              'ms">' +
              '<div class="item-main">' +
              '<div>' +
              '<p class="font-name">' +
              escapeHtml(item.fontName) +
              '</p>' +
              tagsHtml +
              '<div class="url">' +
              escapeHtml(item.lanzouUrl) +
              '</div>' +
              '</div>' +
              '<button class="btn small" data-parse-id="' +
              escapeHtml(item.id) +
              '" type="button"' +
              (loading ? ' disabled' : '') +
              '>' +
              (parsed && parsed.files ? '重新解析' : '解析下载') +
              '</button>' +
              '</div>' +
              resultHtml +
              '</article>'
            );
          })
          .join('');
      }

      function responseErrorMessage(data, fallback) {
        var message = (data && (data.msg || data.message)) || fallback;
        var detail =
          data &&
          (data.error ||
            (typeof data.data === 'string' ? data.data : '') ||
            (data.data && data.data.error ? data.data.error : ''));
        if (detail && detail !== message) return message + '：' + detail;
        return message;
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

        if (response.status === 401) {
          var authMessage = responseErrorMessage(data, '需要登录后访问');
          showAuth(authMessage, 'err');
          throw new Error(authMessage);
        }

        if (!response.ok || data.code !== 0) {
          throw new Error(responseErrorMessage(data, '请求失败'));
        }
        return data.data;
      }

      function postJson(url, body) {
        return requestJson(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body || {}),
        });
      }

      async function syncFonts() {
        els.syncBtn.disabled = true;
        setStatus('正在刷新腾讯文档缓存', '');
        try {
          var data = await postJson('/api/fonts/sync', {});
          applyFontData(data);
          if (data.fallbackSource === 'seed') {
            setStatus(
              '已显示内置缓存，发现 ' +
                state.items.length +
                ' 项',
              'ok',
            );
          } else if (data.cacheError) {
            setStatus(
              '同步成功，但缓存写入失败：' + data.cacheError,
              'err',
            );
          } else if (data.syncError) {
            setStatus(
              '刷新失败，已显示上次缓存：' + data.syncError,
              'err',
            );
          } else {
            setStatus('同步成功，发现 ' + state.items.length + ' 项', 'ok');
          }
        } catch (error) {
          setStatus(error.message, 'err');
        } finally {
          els.syncBtn.disabled = !state.ready;
        }
      }

      async function parseItem(id) {
        var item = state.items.find(function (entry) {
          return entry.id === id;
        });
        if (!item) return;

        state.loadingIds[id] = true;
        render();
        try {
          var data = await postJson('/api/lanzou/parse', {
            url: item.lanzouUrl,
          });
          state.parsed[id] = { files: data.files || [] };
          state.openIds[id] = true;
          setStatus('解析成功：' + item.fontName, 'ok');
          showBurst('解析完成');
        } catch (error) {
          state.parsed[id] = { error: error.message };
          setStatus(error.message, 'err');
        } finally {
          delete state.loadingIds[id];
          render();
        }
      }

      async function loadConfig() {
        var data = await requestJson('/api/config');
        state.ready = Boolean(data.isReady);
        els.syncBtn.disabled = !state.ready;
        return data;
      }

      async function loadCachedFonts() {
        var data = await requestJson('/api/fonts/cache');
        if (data.fromCache) {
          applyFontData(data);
          var timeText = formatTime(data.fetchedAt || data.cachedAt);
          var cacheLabel =
            data.fallbackSource === 'seed' ? '内置缓存' : '缓存';
          setStatus(
            '已载入' +
              cacheLabel +
              (timeText ? '（' + timeText + '）' : '') +
              '，发现 ' +
              state.items.length +
              ' 项',
            'ok',
          );
          return true;
        }

        state.items = [];
        render();
        setStatus(
          state.ready ? '暂无缓存，可点击同步文档' : '请先在管理后台保存配置',
          state.ready ? '' : 'err',
        );
        return false;
      }

      async function boot() {
        try {
          var status = await requestJson('/api/access/status');
          els.homeAdminLink.textContent = '管理后台';
          if (!status.hasAccessPasscodes) {
            showAuth('请先在管理后台添加主界面访问口令', 'err');
            return;
          }

          if (status.isAuthenticated) {
            await showApp();
          } else {
            showAuth('请输入主界面访问口令', '');
          }
        } catch (error) {
          showAuth(error.message, 'err');
        }
      }

      els.syncBtn.addEventListener('click', syncFonts);
      els.searchInput.addEventListener('input', function () {
        state.searchQuery = els.searchInput.value;
        render();
      });
      els.parsedFilterBtn.addEventListener('click', function () {
        state.filterParsed = !state.filterParsed;
        render();
      });
      els.clearFiltersBtn.addEventListener('click', function () {
        state.searchQuery = '';
        state.filterParsed = false;
        state.familyFilters = [];
        state.weightFilters = [];
        els.searchInput.value = '';
        els.filterInputs.forEach(function (input) {
          input.checked = false;
        });
        render();
      });
      els.filterInputs.forEach(function (input) {
        input.addEventListener('change', function () {
          syncFilterState();
          render();
        });
      });
      els.homeAuthBtn.addEventListener('click', async function () {
        try {
          els.homeAuthBtn.disabled = true;
          setAuthStatus('正在验证口令', '');
          await postJson('/api/access/login', {
            passcode: els.homePasscode.value.trim(),
          });
          setAuthStatus('登录成功', 'ok');
          await showApp();
        } catch (error) {
          setAuthStatus(error.message, 'err');
        } finally {
          els.homeAuthBtn.disabled = false;
        }
      });
      els.homePasscode.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') els.homeAuthBtn.click();
      });
      els.topButton.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      window.addEventListener('scroll', function () {
        els.topButton.classList.toggle('visible', window.scrollY > 420);
      });
      els.fontList.addEventListener('click', function (event) {
        var parseButton = event.target.closest('[data-parse-id]');
        if (parseButton) {
          parseItem(parseButton.getAttribute('data-parse-id'));
          return;
        }

        var toggleButton = event.target.closest('[data-toggle-id]');
        if (toggleButton) {
          var id = toggleButton.getAttribute('data-toggle-id');
          state.openIds[id] = state.openIds[id] === false;
          render();
        }
      });

      boot();
    </script>
  </body>
</html>`;
}
