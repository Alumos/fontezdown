import { externalFontCssUrl, fontFamilyStack, siteName } from "./brand.js";

export function renderIndexPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${siteName}</title>
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

      .liquid {
        border: 1px solid var(--liquid-border);
        background: var(--liquid-bg);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
      }

      .shell {
        width: min(1480px, calc(100% - 28px));
        margin: 0 auto;
        padding: 18px 0 42px;
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
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg-strong);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
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
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.62);
        color: var(--ink);
        outline: 0;
        padding: 11px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .auth-input:focus {
        border-color: rgba(61, 111, 146, 0.62);
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 0 0 5px rgba(61, 111, 146, 0.13);
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
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
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
        border-radius: var(--radius-md);
        padding: 9px 14px;
        color: #fff;
        background: linear-gradient(180deg, var(--blue), var(--blue-deep));
        box-shadow: 0 12px 24px rgba(61, 111, 146, 0.24);
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
        color: var(--ink);
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.58);
        box-shadow: 0 8px 18px rgba(33, 36, 32, 0.06);
      }

      .btn.green {
        background: linear-gradient(180deg, var(--green), var(--green-deep));
        box-shadow: 0 12px 22px rgba(66, 120, 95, 0.2);
      }

      .btn.small {
        min-height: 36px;
        border-radius: var(--radius-md);
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
        border-color: rgba(61, 111, 146, 0.32);
        box-shadow: var(--shadow-soft);
      }

      .btn.disabled {
        color: var(--muted);
        background: rgba(232, 228, 219, 0.86);
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
        grid-template-columns: repeat(5, minmax(150px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }

      .stat {
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(165%);
        box-shadow: var(--liquid-shadow-soft);
        padding: 14px;
      }

      .stat strong {
        display: block;
        font-size: 26px;
        line-height: 1;
        color: #263f37;
      }

      .stat span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }

      .stat.source strong {
        font-size: 20px;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }

      .stat.source strong.live {
        color: var(--green);
      }

      .stat.source strong.cache,
      .stat.source strong.seed {
        color: var(--gold);
      }

      .stat.source strong.empty {
        color: var(--muted);
      }

      .controls {
        display: grid;
        gap: 12px;
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(170%);
        box-shadow: var(--liquid-shadow);
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
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.58);
        color: var(--ink);
        outline: 0;
        padding: 10px 14px;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .search:focus {
        border-color: rgba(61, 111, 146, 0.58);
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 0 0 5px rgba(61, 111, 146, 0.12);
      }

      .btn.active {
        color: #fff;
        background: linear-gradient(180deg, var(--green), var(--green-deep));
        box-shadow: 0 12px 22px rgba(66, 120, 95, 0.2);
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
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
        gap: 8px;
      }

      .check {
        position: relative;
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.46);
        color: var(--ink);
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 760;
        text-align: center;
        overflow: hidden;
        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease,
          color 0.18s ease;
      }

      .check:hover {
        transform: translateY(-1px);
        border-color: rgba(61, 111, 146, 0.34);
      }

      .check::before {
        content: "";
        position: absolute;
        inset: -1px;
        z-index: 0;
        opacity: 0;
        background: linear-gradient(
          105deg,
          rgba(33, 99, 79, 0.98) 0%,
          rgba(61, 120, 157, 0.96) 28%,
          rgba(185, 133, 48, 0.94) 48%,
          rgba(61, 120, 157, 0.96) 68%,
          rgba(33, 99, 79, 0.98) 100%
        );
        background-size: 240% 100%;
        transition: opacity 0.18s ease;
      }

      .check span {
        position: relative;
        z-index: 1;
      }

      .check:has(input:checked) {
        border-color: rgba(36, 90, 69, 0.5);
        background: rgba(33, 99, 79, 0.86);
        color: #fff;
        box-shadow: 0 10px 22px rgba(36, 90, 69, 0.16);
      }

      .check:has(input:checked)::before {
        opacity: 1;
        animation: selectedSheen 2.2s linear infinite;
      }

      .check:focus-within {
        border-color: rgba(61, 111, 146, 0.55);
        box-shadow: 0 0 0 4px rgba(61, 111, 146, 0.12);
      }

      .check input {
        position: absolute;
        inset: 0;
        z-index: 2;
        opacity: 0;
        cursor: pointer;
      }

      @keyframes selectedSheen {
        to {
          background-position: -220% 0;
        }
      }

      .list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(292px, 1fr));
        gap: 12px;
        align-items: stretch;
      }

      .item {
        position: relative;
        min-height: 226px;
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: var(--liquid-bg);
        box-shadow: var(--liquid-shadow-soft);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(165%);
        overflow: hidden;
        animation: rise 0.36s ease both;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .item:hover {
        transform: translateY(-2px);
        border-color: rgba(61, 111, 146, 0.26);
        box-shadow: 0 18px 38px rgba(33, 36, 32, 0.13);
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
        height: 100%;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: stretch;
        padding: 16px;
      }

      .font-name {
        margin: 0;
        font-size: 17px;
        font-weight: 820;
        line-height: 1.35;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .url {
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        max-height: 30px;
        overflow: hidden;
      }

      .tag {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(61, 111, 146, 0.18);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.48);
        color: var(--blue-deep);
        font-size: 12px;
        font-weight: 800;
        padding: 3px 8px;
      }

      .article-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .article-link {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(61, 111, 146, 0.2);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.5);
        color: var(--blue-deep);
        font-size: 12px;
        font-weight: 850;
        text-decoration: none;
        padding: 5px 9px;
        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease;
      }

      .article-link:hover {
        transform: translateY(-1px);
        border-color: rgba(61, 111, 146, 0.38);
        background: rgba(232, 244, 248, 0.72);
      }

      .progress-wrap {
        padding: 0;
      }

      .progress {
        height: 8px;
        border-radius: var(--radius-pill);
        background: rgba(105, 114, 110, 0.2);
        overflow: hidden;
      }

      .progress span {
        display: block;
        width: 42%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--blue), var(--green), var(--gold));
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

      .item-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        align-items: stretch;
        min-height: 80px;
      }

      .item-status {
        min-width: 0;
        grid-column: 1 / -1;
      }

      .item-actions .btn {
        width: 100%;
        min-height: 38px;
      }

      .item-actions .btn.only {
        grid-column: 1 / -1;
        align-self: end;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        width: 100%;
        min-height: 28px;
        border-radius: var(--radius-pill);
        padding: 5px 10px;
        color: var(--gold);
        background: rgba(255, 241, 214, 0.9);
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .badge.ok {
        color: var(--green);
        background: rgba(228, 242, 233, 0.92);
      }

      .badge.err {
        color: var(--red);
        background: rgba(255, 229, 224, 0.9);
      }

      .file-popover {
        position: fixed;
        z-index: 30;
        width: min(500px, calc(100vw - 28px));
        max-height: min(520px, calc(100vh - 28px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.14);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(175%);
        padding: 12px;
        overflow: hidden;
        opacity: 0;
        transform: translateY(6px) scale(0.98);
        pointer-events: none;
        transition:
          opacity 0.18s ease,
          transform 0.18s ease;
      }

      .file-popover.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .file-popover-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: start;
      }

      .file-popover-title {
        min-width: 0;
      }

      .file-popover-title strong {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        color: var(--ink);
        font-size: 15px;
        line-height: 1.35;
      }

      .file-popover-title span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 750;
      }

      .file-popover-close {
        width: 34px;
        height: 34px;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.48);
        color: var(--ink);
        font-size: 18px;
        font-weight: 900;
        line-height: 1;
      }

      .files {
        min-height: 0;
        display: grid;
        align-content: start;
        gap: 14px;
        overflow: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
        padding: 2px 4px 4px 2px;
      }

      .file-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
        align-items: stretch;
        width: 100%;
        min-height: 74px;
        border: 1px solid rgba(39, 59, 67, 0.22);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.62);
        color: var(--muted);
        font-size: 13px;
        text-align: left;
        padding: 14px;
        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease,
          box-shadow 0.18s ease;
      }

      .file-row:not(.disabled):hover,
      .file-row.selected {
        transform: translateY(-1px);
        border-color: rgba(61, 111, 146, 0.48);
        background: rgba(232, 244, 248, 0.76);
        box-shadow: 0 12px 26px rgba(61, 111, 146, 0.16);
      }

      .file-row.selected {
        outline: 2px solid rgba(61, 120, 157, 0.22);
        outline-offset: 2px;
      }

      .file-row.disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      .file-name {
        color: var(--ink);
        font-weight: 750;
        line-height: 1.42;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .file-meta {
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.35;
      }

      .download-modal {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        background: rgba(18, 27, 32, 0.22);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s ease;
        padding: 18px;
      }

      .download-modal.open {
        opacity: 1;
        pointer-events: auto;
      }

      .download-dialog {
        width: min(420px, 100%);
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.22);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(175%);
        padding: 16px;
        transform: translateY(8px) scale(0.98);
        transition: transform 0.18s ease;
      }

      .download-modal.open .download-dialog {
        transform: translateY(0) scale(1);
      }

      .download-dialog p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }

      .download-file-name {
        display: block;
        margin-top: 8px;
        color: var(--ink);
        font-size: 15px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .download-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }

      .preview-modal {
        position: fixed;
        inset: 0;
        z-index: 45;
        display: grid;
        place-items: center;
        background: rgba(18, 27, 32, 0.28);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s ease;
        padding: 18px;
      }

      .preview-modal.open {
        opacity: 1;
        pointer-events: auto;
      }

      .preview-dialog {
        width: min(980px, 100%);
        max-height: min(820px, calc(100vh - 36px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 12px;
        border: 1px solid var(--liquid-border);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.2);
        box-shadow: var(--liquid-shadow);
        backdrop-filter: blur(4px) url(#liquid_glass_filter) saturate(175%);
        padding: 14px;
        overflow: hidden;
        transform: translateY(8px) scale(0.98);
        transition: transform 0.18s ease;
      }

      .preview-modal.open .preview-dialog {
        transform: translateY(0) scale(1);
      }

      .preview-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }

      .preview-title {
        min-width: 0;
      }

      .preview-title strong {
        display: block;
        color: var(--ink);
        font-size: 16px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .preview-title span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 750;
      }

      .preview-close {
        width: 36px;
        height: 36px;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.5);
        color: var(--ink);
        font-size: 18px;
        font-weight: 900;
        line-height: 1;
      }

      .preview-gallery {
        min-height: 0;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        gap: 10px;
        align-items: center;
      }

      .preview-stage {
        width: 100%;
        min-height: 340px;
        max-height: min(56vh, 520px);
        display: grid;
        place-items: center;
        border: 1px solid rgba(39, 59, 67, 0.16);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.52);
        padding: 10px;
        overflow: hidden;
        cursor: zoom-in;
        touch-action: none;
        user-select: none;
      }

      .preview-stage img {
        max-width: 100%;
        max-height: min(52vh, 500px);
        width: auto;
        height: auto;
        display: block;
        border-radius: 12px;
        box-shadow: 0 10px 24px rgba(33, 36, 32, 0.09);
        pointer-events: none;
        transform: translate3d(0, 0, 0) scale(1);
        transform-origin: center center;
        transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
        user-select: none;
        -webkit-user-drag: none;
        will-change: transform;
      }

      .preview-stage.zoom-active {
        cursor: grab;
      }

      .preview-stage.dragging {
        cursor: grabbing;
      }

      .preview-stage.interacting img {
        transition: none;
      }

      .preview-nav {
        width: 44px;
        height: 70px;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.54);
        color: var(--blue-deep);
        font-size: 30px;
        font-weight: 850;
        line-height: 1;
      }

      .preview-nav:disabled {
        opacity: 0.35;
      }

      .preview-thumbs {
        display: flex;
        gap: 8px;
        min-width: 0;
        overflow-x: auto;
        overscroll-behavior-x: contain;
        padding: 2px 2px 8px;
      }

      .preview-thumb {
        flex: 0 0 72px;
        width: 72px;
        height: 92px;
        border: 1px solid rgba(39, 59, 67, 0.18);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.52);
        padding: 2px;
        overflow: hidden;
      }

      .preview-thumb.active {
        border-color: rgba(61, 120, 157, 0.66);
        outline: 2px solid rgba(61, 120, 157, 0.18);
        outline-offset: 2px;
      }

      .preview-thumb img {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 9px;
        object-fit: cover;
      }

      .preview-actions {
        display: flex;
        justify-content: end;
      }

      .empty {
        min-height: 280px;
        display: grid;
        place-items: center;
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius-lg);
        color: var(--muted);
        background: rgba(255, 255, 255, 0.44);
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
        border: 1px solid rgba(66, 120, 95, 0.25);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.72);
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
        right: max(18px, calc((100vw - 1480px) / 2 + 18px));
        bottom: 22px;
        z-index: 12;
        width: 48px;
        height: 48px;
        border-radius: var(--radius-pill);
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.64);
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
        .controls,
        .search-row,
        .filter-groups {
          grid-template-columns: 1fr;
        }

        .summary,
        .list {
          grid-template-columns: 1fr;
        }

        .list {
          align-items: stretch;
        }

        .actions,
        .filter-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .btn {
          width: 100%;
        }

        .file-row {
          gap: 9px;
          min-height: 78px;
          padding: 14px;
          border-radius: 16px;
        }

        .file-name {
          font-size: 13px;
          line-height: 1.42;
        }

        .file-meta {
          gap: 8px;
          font-size: 12px;
          line-height: 1.35;
        }

        .file-popover {
          left: 10px !important;
          right: 10px;
          top: 10px !important;
          bottom: 10px;
          width: auto;
          height: calc(100vh - 20px);
          height: calc(100dvh - 20px);
          max-height: none;
          padding: 12px;
          border-radius: 24px;
        }

        .files {
          gap: 12px;
          padding: 2px 2px 10px 0;
        }

        .download-modal {
          align-items: end;
          padding: 10px;
        }

        .download-dialog {
          border-radius: 22px;
          padding: 14px;
        }

        .preview-modal {
          align-items: stretch;
          padding: 10px;
        }

        .preview-dialog {
          max-height: calc(100vh - 20px);
          max-height: calc(100dvh - 20px);
          border-radius: 22px;
        }

        .preview-gallery {
          grid-template-columns: 38px minmax(0, 1fr) 38px;
          gap: 7px;
        }

        .preview-stage {
          min-height: 320px;
          max-height: 58vh;
          padding: 6px;
        }

        .preview-stage img {
          max-height: 56vh;
        }

        .preview-nav {
          width: 38px;
          height: 62px;
          font-size: 26px;
        }

        .preview-thumb {
          flex-basis: 62px;
          width: 62px;
          height: 78px;
        }

        .download-file-name {
          font-size: 14px;
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

    <section class="auth-shell" id="authPanel">
      <div class="auth-card">
        <h1>${siteName}</h1>
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
          <h1>${siteName}</h1>
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
        <div class="stat source"><strong id="sourceName">未载入</strong><span id="sourceDetail">数据来源</span></div>
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

    <div
      class="file-popover"
      id="filePopover"
      role="dialog"
      aria-modal="false"
      aria-hidden="true"
    ></div>

    <div
      class="download-modal"
      id="downloadModal"
      role="dialog"
      aria-modal="true"
      aria-hidden="true"
    >
      <div class="download-dialog">
        <p>确认下载</p>
        <strong class="download-file-name" id="downloadFileName"></strong>
        <div class="download-actions">
          <button class="btn secondary" id="cancelDownloadBtn" type="button">
            取消
          </button>
          <button class="btn green" id="confirmDownloadBtn" type="button">
            确认下载
          </button>
        </div>
      </div>
    </div>

    <div
      class="preview-modal"
      id="previewModal"
      role="dialog"
      aria-modal="true"
      aria-hidden="true"
    >
      <div class="preview-dialog">
        <div class="preview-head">
          <div class="preview-title">
            <strong id="previewTitle"></strong>
            <span id="previewMeta"></span>
          </div>
          <button
            class="preview-close"
            id="closePreviewBtn"
            type="button"
            aria-label="关闭预览图"
          >
            ×
          </button>
        </div>
        <div class="preview-gallery">
          <button
            class="preview-nav"
            id="previewPrevBtn"
            type="button"
            aria-label="上一张"
          >
            &lsaquo;
          </button>
          <button
            class="preview-stage"
            id="previewStage"
            type="button"
            aria-label="放大当前预览图"
          >
            <img
              id="previewMainImage"
              alt=""
              decoding="async"
              referrerpolicy="no-referrer"
            />
          </button>
          <button
            class="preview-nav"
            id="previewNextBtn"
            type="button"
            aria-label="下一张"
          >
            &rsaquo;
          </button>
        </div>
        <div class="preview-thumbs" id="previewThumbs"></div>
        <div class="preview-actions">
          <a
            class="btn secondary small"
            id="previewArticleLink"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            打开原文
          </a>
        </div>
      </div>
    </div>

    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        苏ICP备2021038338号-1
      </a>
    </footer>

    <script>
      var state = {
        items: [],
        parsed: {},
        articleMatches: {},
        loadingIds: {},
        floatingFiles: {
          itemId: '',
          anchor: null,
          files: [],
        },
        pendingDownload: null,
        activePreviewId: '',
        previewImages: [],
        previewIndex: 0,
        previewTransform: {
          scale: 1,
          x: 0,
          y: 0,
        },
        previewPointers: {},
        previewGesture: {
          mode: '',
          startX: 0,
          startY: 0,
          startTranslateX: 0,
          startTranslateY: 0,
          startDistance: 0,
          startScale: 1,
          moved: false,
          suppressClick: false,
        },
        filterParsed: false,
        familyFilters: [],
        weightFilters: [],
        searchQuery: '',
        ready: false,
        source: {
          label: '未载入',
          detail: '数据来源',
          kind: 'empty',
        },
        articleCache: null,
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
        sourceName: document.getElementById('sourceName'),
        sourceDetail: document.getElementById('sourceDetail'),
        fontList: document.getElementById('fontList'),
        filePopover: document.getElementById('filePopover'),
        downloadModal: document.getElementById('downloadModal'),
        downloadFileName: document.getElementById('downloadFileName'),
        cancelDownloadBtn: document.getElementById('cancelDownloadBtn'),
        confirmDownloadBtn: document.getElementById('confirmDownloadBtn'),
        previewModal: document.getElementById('previewModal'),
        previewTitle: document.getElementById('previewTitle'),
        previewMeta: document.getElementById('previewMeta'),
        previewStage: document.getElementById('previewStage'),
        previewMainImage: document.getElementById('previewMainImage'),
        previewPrevBtn: document.getElementById('previewPrevBtn'),
        previewNextBtn: document.getElementById('previewNextBtn'),
        previewThumbs: document.getElementById('previewThumbs'),
        previewArticleLink: document.getElementById('previewArticleLink'),
        closePreviewBtn: document.getElementById('closePreviewBtn'),
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
        { id: 'w3', label: '三字重', pattern: /(?:三|3)\\s*字重/ },
        { id: 'w4', label: '四字重', pattern: /(?:四|4)\\s*字重/ },
        { id: 'w5', label: '五字重', pattern: /(?:五|5)\\s*字重/ },
        { id: 'w6', label: '六字重', pattern: /(?:六|6)\\s*字重/ },
        {
          id: 'multi',
          label: '多字重',
          pattern: /多\\s*字重|(?:七|八|九|十|[7-9]|1[0-9])\\s*字重/,
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

      function closePreviewModal() {
        state.activePreviewId = '';
        state.previewImages = [];
        state.previewIndex = 0;
        resetPreviewTransform(false);
        state.previewPointers = {};
        state.previewGesture.mode = '';
        els.previewModal.classList.remove('open');
        els.previewModal.setAttribute('aria-hidden', 'true');
        els.previewTitle.textContent = '';
        els.previewMeta.textContent = '';
        els.previewMainImage.removeAttribute('src');
        els.previewMainImage.alt = '';
        els.previewThumbs.innerHTML = '';
        els.previewArticleLink.href = '#';
      }

      function closeFilePopover() {
        closeDownloadModal();
        state.floatingFiles.itemId = '';
        state.floatingFiles.anchor = null;
        state.floatingFiles.files = [];
        els.filePopover.classList.remove('open');
        els.filePopover.setAttribute('aria-hidden', 'true');
      }

      function findFileToggle(id) {
        return Array.prototype.find.call(
          document.querySelectorAll('[data-toggle-id]'),
          function (button) {
            return button.getAttribute('data-toggle-id') === id;
          },
        );
      }

      function renderFileRows(files) {
        return files
          .map(function (file, index) {
            var canDownload = isHttpUrl(file.downloadUrl);
            return (
              '<button class="file-row' +
              (canDownload ? '' : ' disabled') +
              '" data-file-index="' +
              index +
              '" type="button"' +
              (canDownload
                ? ''
                : ' disabled title="' +
                  escapeHtml(file.error || '未获取到下载地址') +
                  '"') +
              '>' +
              '<div class="file-name">' +
              escapeHtml(file.name || '未命名文件') +
              '</div>' +
              '<div class="file-meta"><span>' +
              escapeHtml(file.size || '-') +
              '</span><span>' +
              escapeHtml(file.date || '-') +
              '</span><span>' +
              escapeHtml(canDownload ? '点按选择' : '解析失败') +
              '</span></div>' +
              '</button>'
            );
          })
          .join('');
      }

      function clearSelectedFileRow() {
        Array.prototype.forEach.call(
          els.filePopover.querySelectorAll('.file-row.selected'),
          function (row) {
            row.classList.remove('selected');
          },
        );
      }

      function openDownloadModal(file, index) {
        if (!file || !isHttpUrl(file.downloadUrl)) return;

        clearSelectedFileRow();
        var row = els.filePopover.querySelector('[data-file-index="' + index + '"]');
        if (row) row.classList.add('selected');

        state.pendingDownload = file;
        els.downloadFileName.textContent = file.name || '未命名文件';
        els.downloadModal.classList.add('open');
        els.downloadModal.setAttribute('aria-hidden', 'false');
      }

      function closeDownloadModal() {
        state.pendingDownload = null;
        clearSelectedFileRow();
        els.downloadModal.classList.remove('open');
        els.downloadModal.setAttribute('aria-hidden', 'true');
        els.downloadFileName.textContent = '';
      }

      function activePreviewArticle() {
        return state.articleMatches[state.activePreviewId] || null;
      }

      function activePreviewItem() {
        return state.items.find(function (entry) {
          return entry.id === state.activePreviewId;
        });
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
      }

      function previewScale() {
        return state.previewTransform.scale;
      }

      function applyPreviewTransform(smooth) {
        var transform = state.previewTransform;
        els.previewMainImage.style.transition =
          smooth === false ? 'none' : '';
        els.previewMainImage.style.transform =
          'translate3d(' +
          transform.x.toFixed(1) +
          'px, ' +
          transform.y.toFixed(1) +
          'px, 0) scale(' +
          transform.scale.toFixed(3) +
          ')';
        els.previewStage.classList.toggle('zoom-active', transform.scale > 1.01);
        els.previewStage.setAttribute(
          'aria-label',
          transform.scale > 1.01 ? '恢复预览图大小' : '放大当前预览图',
        );
      }

      function resetPreviewTransform(smooth) {
        state.previewTransform = {
          scale: 1,
          x: 0,
          y: 0,
        };
        applyPreviewTransform(smooth);
      }

      function setPreviewTransform(next, smooth) {
        state.previewTransform = {
          scale: clamp(next.scale, 1, 5),
          x: next.x || 0,
          y: next.y || 0,
        };
        if (state.previewTransform.scale <= 1.01) {
          state.previewTransform.scale = 1;
          state.previewTransform.x = 0;
          state.previewTransform.y = 0;
        }
        applyPreviewTransform(smooth);
      }

      function togglePreviewZoom() {
        if (previewScale() > 1.01) {
          resetPreviewTransform(true);
          return;
        }

        setPreviewTransform(
          {
            scale: 2.2,
            x: 0,
            y: 0,
          },
          true,
        );
      }

      function previewPointerList() {
        return Object.values(state.previewPointers);
      }

      function pointerDistance(first, second) {
        var x = first.clientX - second.clientX;
        var y = first.clientY - second.clientY;
        return Math.hypot(x, y);
      }

      function startPreviewPan(pointer) {
        state.previewGesture.mode = previewScale() > 1.01 ? 'pan' : 'tap';
        state.previewGesture.startX = pointer.clientX;
        state.previewGesture.startY = pointer.clientY;
        state.previewGesture.startTranslateX = state.previewTransform.x;
        state.previewGesture.startTranslateY = state.previewTransform.y;
        state.previewGesture.moved = false;
      }

      function startPreviewPinch(pointers) {
        if (pointers.length < 2) return;
        state.previewGesture.mode = 'pinch';
        state.previewGesture.startDistance = pointerDistance(pointers[0], pointers[1]);
        state.previewGesture.startScale = previewScale();
        state.previewGesture.startTranslateX = state.previewTransform.x;
        state.previewGesture.startTranslateY = state.previewTransform.y;
        state.previewGesture.moved = true;
        state.previewGesture.suppressClick = true;
      }

      function handlePreviewPointerDown(event) {
        if (!state.previewImages.length) return;

        event.preventDefault();
        els.previewStage.setPointerCapture(event.pointerId);
        state.previewPointers[event.pointerId] = {
          clientX: event.clientX,
          clientY: event.clientY,
        };
        els.previewStage.classList.add('interacting');

        var pointers = previewPointerList();
        if (pointers.length >= 2) {
          startPreviewPinch(pointers);
        } else {
          startPreviewPan(pointers[0]);
        }
      }

      function handlePreviewPointerMove(event) {
        var pointer = state.previewPointers[event.pointerId];
        if (!pointer) return;

        event.preventDefault();
        pointer.clientX = event.clientX;
        pointer.clientY = event.clientY;

        var pointers = previewPointerList();
        if (pointers.length >= 2) {
          if (state.previewGesture.mode !== 'pinch') {
            startPreviewPinch(pointers);
          }

          var distance = pointerDistance(pointers[0], pointers[1]);
          if (state.previewGesture.startDistance > 0) {
            setPreviewTransform(
              {
                scale:
                  state.previewGesture.startScale *
                  (distance / state.previewGesture.startDistance),
                x: state.previewTransform.x,
                y: state.previewTransform.y,
              },
              false,
            );
          }
          state.previewGesture.moved = true;
          state.previewGesture.suppressClick = true;
          return;
        }

        if (state.previewGesture.mode !== 'pan' || previewScale() <= 1.01) {
          var tapDelta = Math.hypot(
            event.clientX - state.previewGesture.startX,
            event.clientY - state.previewGesture.startY,
          );
          if (tapDelta > 8) {
            state.previewGesture.moved = true;
            state.previewGesture.suppressClick = true;
          }
          return;
        }

        var deltaX = event.clientX - state.previewGesture.startX;
        var deltaY = event.clientY - state.previewGesture.startY;
        if (Math.hypot(deltaX, deltaY) > 2) {
          state.previewGesture.moved = true;
          state.previewGesture.suppressClick = true;
          els.previewStage.classList.add('dragging');
        }

        setPreviewTransform(
          {
            scale: previewScale(),
            x: state.previewGesture.startTranslateX + deltaX,
            y: state.previewGesture.startTranslateY + deltaY,
          },
          false,
        );
      }

      function handlePreviewPointerEnd(event) {
        var modeBeforeEnd = state.previewGesture.mode;
        var movedBeforeEnd = state.previewGesture.moved;
        if (state.previewPointers[event.pointerId]) {
          delete state.previewPointers[event.pointerId];
        }

        try {
          els.previewStage.releasePointerCapture(event.pointerId);
        } catch {
          // Pointer capture can already be released by the browser.
        }

        var pointers = previewPointerList();
        if (pointers.length === 0) {
          els.previewStage.classList.remove('interacting', 'dragging');
          applyPreviewTransform(true);
          if (!movedBeforeEnd && modeBeforeEnd !== 'pinch') {
            togglePreviewZoom();
            state.previewGesture.suppressClick = true;
          }
          return;
        }

        startPreviewPan(pointers[0]);
        state.previewGesture.suppressClick = true;
      }

      function handlePreviewWheel(event) {
        if (!state.previewImages.length) return;

        event.preventDefault();
        var nextScale = previewScale() * (event.deltaY < 0 ? 1.12 : 0.88);
        setPreviewTransform(
          {
            scale: nextScale,
            x: state.previewTransform.x,
            y: state.previewTransform.y,
          },
          false,
        );
      }

      function setPreviewIndex(index) {
        if (!state.previewImages.length) return;

        var count = state.previewImages.length;
        state.previewIndex = ((index % count) + count) % count;
        resetPreviewTransform(false);
        renderPreviewGallery();
      }

      function renderPreviewGallery() {
        var article = activePreviewArticle();
        var item = activePreviewItem();
        var imageUrl = state.previewImages[state.previewIndex];
        if (!article || !item || !imageUrl) return;

        var label = article.topic || item.fontName || '字体预览';
        var count = state.previewImages.length;
        els.previewTitle.textContent = article.title || item.fontName || '字体预览';
        els.previewMeta.textContent =
          label +
          ' · ' +
          (state.previewIndex + 1) +
          '/' +
          count +
          (article.score ? ' · 匹配 ' + Math.round(article.score * 100) + '%' : '');
        els.previewMainImage.src = imageUrl;
        els.previewMainImage.alt = label + ' ' + (state.previewIndex + 1);
        els.previewPrevBtn.disabled = count <= 1;
        els.previewNextBtn.disabled = count <= 1;
        els.previewThumbs.innerHTML = state.previewImages
          .map(function (thumbUrl, index) {
            return (
              '<button class="preview-thumb' +
              (index === state.previewIndex ? ' active' : '') +
              '" data-preview-index="' +
              index +
              '" type="button" aria-label="查看第 ' +
              (index + 1) +
              ' 张预览图">' +
              '<img src="' +
              escapeHtml(thumbUrl) +
              '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />' +
              '</button>'
            );
          })
          .join('');
        applyPreviewTransform(true);
      }

      function openPreviewModal(id) {
        var item = state.items.find(function (entry) {
          return entry.id === id;
        });
        var article = state.articleMatches[id];
        if (!item || !article || !Array.isArray(article.images)) return;

        var images = article.images.filter(isHttpUrl);
        if (!images.length) return;

        state.activePreviewId = id;
        state.previewImages = images;
        state.previewIndex = 0;
        resetPreviewTransform(false);
        closeFilePopover();
        els.previewArticleLink.href = article.link || '#';
        renderPreviewGallery();
        els.previewModal.classList.add('open');
        els.previewModal.setAttribute('aria-hidden', 'false');
      }

      function positionFilePopover(anchor) {
        if (!anchor || !els.filePopover.classList.contains('open')) return;

        var gap = 10;
        var rect = anchor.getBoundingClientRect();
        var popoverRect = els.filePopover.getBoundingClientRect();

        if (window.innerWidth <= 820) {
          return;
        }

        var left = rect.right + gap;
        if (left + popoverRect.width > window.innerWidth - gap) {
          left = rect.left - popoverRect.width - gap;
        }
        left = Math.max(gap, Math.min(left, window.innerWidth - popoverRect.width - gap));

        var top = rect.top + rect.height / 2 - popoverRect.height / 2;
        top = Math.max(gap, Math.min(top, window.innerHeight - popoverRect.height - gap));

        els.filePopover.style.left = left + 'px';
        els.filePopover.style.top = top + 'px';
      }

      function showFilePopover(id, anchor) {
        var item = state.items.find(function (entry) {
          return entry.id === id;
        });
        var parsed = state.parsed[id];
        if (!item || !parsed || !Array.isArray(parsed.files)) return;

        state.floatingFiles.itemId = id;
        state.floatingFiles.anchor = anchor;
        state.floatingFiles.files = parsed.files || [];
        els.filePopover.innerHTML =
          '<div class="file-popover-head">' +
          '<div class="file-popover-title"><strong>' +
          escapeHtml(item.fontName || '未命名字体') +
          '</strong><span>' +
          escapeHtml(parsed.fromParsedCache ? '已缓存解析' : '本次解析') +
          ' · ' +
          parsed.files.length +
          ' 个文件</span></div>' +
          '<button class="file-popover-close" data-close-files type="button" aria-label="关闭文件列表">×</button>' +
          '</div><div class="files">' +
          renderFileRows(parsed.files) +
          '</div>';
        els.filePopover.classList.add('open');
        els.filePopover.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () {
          positionFilePopover(anchor);
        });
      }

      function formatTime(value) {
        if (!value) return '';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('zh-CN', { hour12: false });
      }

      function emptySourceInfo() {
        return {
          label: '未载入',
          detail: '数据来源',
          kind: 'empty',
        };
      }

      function sourceTimeText(data) {
        if (!data || data.fallbackSource === 'seed') return '';
        return formatTime(data.fetchedAt || data.cachedAt);
      }

      function sourceInfoForData(data) {
        if (!data || !Array.isArray(data.items)) return emptySourceInfo();

        var timeText = sourceTimeText(data);
        if (data.fallbackSource === 'seed') {
          return {
            label: '内置缓存',
            detail: '不是最新文档',
            kind: 'seed',
          };
        }

        if (data.fromCache) {
          return {
            label: '上次缓存',
            detail: timeText ? '缓存时间 ' + timeText : '不是本次刷新',
            kind: 'cache',
          };
        }

        return {
          label: '腾讯文档',
          detail: timeText ? '本次刷新 ' + timeText : '本次刷新',
          kind: 'live',
        };
      }

      function errorSuffix(message) {
        return message ? '：' + message : '';
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

      function applyParsedCache(parsedCache) {
        var cache = parsedCache || {};
        state.items.forEach(function (item) {
          var entry = cache[item.id];
          if (!entry || !Array.isArray(entry.files)) return;

          state.parsed[item.id] = {
            files: entry.files,
            parsedAt: entry.parsedAt || '',
            fromParsedCache: true,
          };
        });
      }

      function applyFontData(data) {
        state.items = data.items || [];
        state.parsed = {};
        state.articleMatches = data.articleMatches || {};
        state.loadingIds = {};
        closeFilePopover();
        closePreviewModal();
        state.filterParsed = false;
        state.source = sourceInfoForData(data);
        state.articleCache = data.articleCache || null;
        applyParsedCache(data.parsedCache);
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
        els.sourceName.textContent = state.source.label;
        els.sourceName.className = state.source.kind || 'empty';
        els.sourceDetail.textContent = state.source.detail;
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
          closeFilePopover();
          els.fontList.innerHTML =
            '<div class="empty">点击“同步文档”获取字体列表</div>';
          return;
        }

        if (items.length === 0) {
          closeFilePopover();
          els.fontList.innerHTML =
            '<div class="empty">没有符合条件的字体条目</div>';
          return;
        }

        els.fontList.innerHTML = items
          .map(function (item, index) {
            var parsed = state.parsed[item.id];
            var article = state.articleMatches[item.id];
            var loading = state.loadingIds[item.id];
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
            var articleHtml =
              article && Array.isArray(article.images) && article.images.length
                ? '<div class="article-links">' +
                  '<button class="article-link" data-preview-id="' +
                  escapeHtml(item.id) +
                  '" type="button">预览图 ' +
                  article.images.length +
                  '</button>' +
                  '<a class="article-link" href="' +
                  escapeHtml(article.link) +
                  '" target="_blank" rel="noopener noreferrer">相关文章</a>' +
                  '</div>'
                : '';
            var actionHtml = '';

            if (loading) {
              actionHtml =
                '<div class="item-status"><div class="progress-wrap"><div class="progress"><span></span></div></div></div>';
            } else if (parsed && parsed.error) {
              actionHtml =
                '<div class="item-status"><span class="badge err" title="' +
                escapeHtml(parsed.error) +
                '">' +
                escapeHtml(parsed.error) +
                '</span></div>' +
                '<button class="btn small only" data-parse-id="' +
                escapeHtml(item.id) +
                '" type="button">重新解析</button>';
            } else if (parsed && parsed.files) {
              var files = parsed.files || [];
              var parsedLabel = parsed.fromParsedCache ? '已缓存解析 ' : '已解析 ';
              actionHtml =
                '<div class="item-status"><span class="badge ok">' +
                parsedLabel +
                files.length +
                ' 个文件</span></div>' +
                '<button class="btn secondary small" data-toggle-id="' +
                escapeHtml(item.id) +
                '" type="button">' +
                (state.floatingFiles.itemId === item.id ? '隐藏文件' : '查看文件') +
                '</button>' +
                '<button class="btn small" data-parse-id="' +
                escapeHtml(item.id) +
                '" type="button">重新解析</button>';
            } else {
              actionHtml =
                '<button class="btn small only" data-parse-id="' +
                escapeHtml(item.id) +
                '" type="button">解析下载</button>';
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
              articleHtml +
              '<div class="url">' +
              escapeHtml(item.lanzouUrl) +
              '</div>' +
              '</div>' +
              '<div class="item-actions">' +
              actionHtml +
              '</div>' +
              '</div>' +
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
              '刷新失败，显示内置缓存，不是最新文档，发现 ' +
                state.items.length +
                ' 项' +
                errorSuffix(data.syncError),
              'err',
            );
          } else if (data.cacheError) {
            setStatus(
              '已从腾讯文档刷新，发现 ' +
                state.items.length +
                ' 项，但缓存写入失败：' +
                data.cacheError,
              'err',
            );
          } else if (data.syncError) {
            var cacheTime = sourceTimeText(data);
            setStatus(
              '刷新失败，显示上次缓存' +
                (cacheTime ? '（' + cacheTime + '）' : '') +
                '，不是最新文档：' +
                data.syncError,
              'err',
            );
          } else {
            var syncTime = sourceTimeText(data);
            setStatus(
              '同步成功，已显示腾讯文档最新结果，发现 ' +
                state.items.length +
                ' 项' +
                (syncTime ? '（' + syncTime + '）' : ''),
              'ok',
            );
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
            itemId: item.id,
            fontName: item.fontName,
            url: item.lanzouUrl,
          });
          state.parsed[id] = {
            files: data.files || [],
            parsedAt: data.parsedAt || '',
            fromParsedCache: false,
          };
          if (data.parsedCacheError) {
            setStatus(
              '解析成功，但服务端缓存写入失败：' + data.parsedCacheError,
              'err',
            );
          } else {
            setStatus('解析成功：' + item.fontName, 'ok');
          }
          showBurst('解析完成');
        } catch (error) {
          closeFilePopover();
          state.parsed[id] = { error: error.message };
          setStatus(error.message, 'err');
        } finally {
          delete state.loadingIds[id];
          render();
          var anchor = findFileToggle(id);
          if (anchor && state.parsed[id] && state.parsed[id].files) {
            showFilePopover(id, anchor);
          }
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
          if (data.fallbackSource === 'seed') {
            setStatus(
              '已载入内置缓存，不是最新文档，发现 ' +
                state.items.length +
                ' 项',
              'err',
            );
          } else {
            var timeText = sourceTimeText(data);
            setStatus(
              '已载入上次缓存' +
                (timeText ? '（' + timeText + '）' : '') +
                '，发现 ' +
                state.items.length +
                ' 项',
              'ok',
            );
          }
          return true;
        }

        state.items = [];
        state.parsed = {};
        state.articleMatches = {};
        state.loadingIds = {};
        closeFilePopover();
        closePreviewModal();
        state.source = emptySourceInfo();
        state.articleCache = data.articleCache || null;
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
        closeFilePopover();
        render();
      });
      els.parsedFilterBtn.addEventListener('click', function () {
        state.filterParsed = !state.filterParsed;
        closeFilePopover();
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
        closeFilePopover();
        render();
      });
      els.filterInputs.forEach(function (input) {
        input.addEventListener('change', function () {
          syncFilterState();
          closeFilePopover();
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
        if (state.floatingFiles.anchor) {
          positionFilePopover(state.floatingFiles.anchor);
        }
      });
      window.addEventListener('resize', closeFilePopover);
      els.fontList.addEventListener('click', function (event) {
        var previewButton = event.target.closest('[data-preview-id]');
        if (previewButton) {
          openPreviewModal(previewButton.getAttribute('data-preview-id'));
          return;
        }

        var parseButton = event.target.closest('[data-parse-id]');
        if (parseButton) {
          parseItem(parseButton.getAttribute('data-parse-id'));
          return;
        }

        var toggleButton = event.target.closest('[data-toggle-id]');
        if (toggleButton) {
          var id = toggleButton.getAttribute('data-toggle-id');
          if (state.floatingFiles.itemId === id) {
            closeFilePopover();
            render();
          } else {
            state.floatingFiles.itemId = id;
            render();
            var nextAnchor = findFileToggle(id);
            if (nextAnchor) {
              showFilePopover(id, nextAnchor);
            }
          }
        }
      });
      els.filePopover.addEventListener('click', function (event) {
        if (event.target.closest('[data-close-files]')) {
          closeFilePopover();
          render();
          return;
        }

        var fileRow = event.target.closest('[data-file-index]');
        if (fileRow) {
          var index = Number(fileRow.getAttribute('data-file-index'));
          var file = state.floatingFiles.files[index];
          openDownloadModal(file, index);
        }
      });
      els.cancelDownloadBtn.addEventListener('click', closeDownloadModal);
      els.confirmDownloadBtn.addEventListener('click', function () {
        var file = state.pendingDownload;
        if (file && isHttpUrl(file.downloadUrl)) {
          window.open(file.downloadUrl, '_blank', 'noopener');
        }
        closeDownloadModal();
      });
      els.downloadModal.addEventListener('click', function (event) {
        if (event.target === els.downloadModal) closeDownloadModal();
      });
      els.closePreviewBtn.addEventListener('click', closePreviewModal);
      els.previewPrevBtn.addEventListener('click', function () {
        setPreviewIndex(state.previewIndex - 1);
      });
      els.previewNextBtn.addEventListener('click', function () {
        setPreviewIndex(state.previewIndex + 1);
      });
      els.previewStage.addEventListener('click', function () {
        if (!state.previewImages.length) return;
        if (state.previewGesture.suppressClick) {
          state.previewGesture.suppressClick = false;
          return;
        }
        togglePreviewZoom();
      });
      els.previewStage.addEventListener('pointerdown', handlePreviewPointerDown);
      els.previewStage.addEventListener('pointermove', handlePreviewPointerMove);
      els.previewStage.addEventListener('pointerup', handlePreviewPointerEnd);
      els.previewStage.addEventListener('pointercancel', handlePreviewPointerEnd);
      els.previewStage.addEventListener('wheel', handlePreviewWheel, { passive: false });
      els.previewThumbs.addEventListener('click', function (event) {
        var thumb = event.target.closest('[data-preview-index]');
        if (!thumb) return;
        setPreviewIndex(Number(thumb.getAttribute('data-preview-index')));
      });
      els.previewModal.addEventListener('click', function (event) {
        if (event.target === els.previewModal) closePreviewModal();
      });
      document.addEventListener('click', function (event) {
        if (els.previewModal.contains(event.target)) return;
        if (!state.floatingFiles.itemId) return;
        if (els.downloadModal.contains(event.target)) return;
        if (els.filePopover.contains(event.target)) return;
        if (event.target.closest('[data-toggle-id]')) return;
        closeFilePopover();
        render();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          if (els.previewModal.classList.contains('open')) {
            closePreviewModal();
          } else if (els.downloadModal.classList.contains('open')) {
            closeDownloadModal();
          } else {
            closeFilePopover();
            render();
          }
        } else if (
          els.previewModal.classList.contains('open') &&
          event.key === 'ArrowLeft'
        ) {
          setPreviewIndex(state.previewIndex - 1);
        } else if (
          els.previewModal.classList.contains('open') &&
          event.key === 'ArrowRight'
        ) {
          setPreviewIndex(state.previewIndex + 1);
        }
      });

      boot();
    </script>
  </body>
</html>`;
}
