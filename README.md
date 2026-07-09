# 犬神志字库

基于 Node.js 的私有字体资源下载站。项目保留蓝奏云分享链接解析能力，并增加腾讯文档同步、后台配置、本地缓存、访问口令和前台字体目录页面，适合部署在自己的 VPS 上长期运行。

## 基本流程

1. 在腾讯文档里维护字体名称和蓝奏云分享链接。
2. 后台读取腾讯文档 OpenAPI，从文本和超链接字段提取字体条目。
3. 同步结果写入本地 `data/fonts.cache.json`。
4. 用户进入首页筛选字体，点击解析后由服务端把蓝奏云分享链接转换为下载地址。

## 功能

- 首页字体目录：自适应分栏、分类筛选、已解析缓存和下载入口。
- 后台管理：配置腾讯文档凭据、蓝奏云默认密码、后台口令和首页访问口令。
- 腾讯文档同步：从文档内容自动提取字体名称和蓝奏云链接。
- 蓝奏云解析：支持普通链接、带密码链接，以及文件夹/文件结果。
- 本地缓存：同步结果和解析结果保存在 `data/`，腾讯文档暂时失败时仍可读取上次缓存。
- Node/VPS 部署：项目只保留稳定的 Node 服务入口。

## 环境要求

- Node.js 20+ 推荐，最低请使用 Node.js 18+
- pnpm 10.33.0+

## 本地运行

```bash
pnpm install
pnpm run dev
```

默认地址：

```text
http://localhost:1103
```

首次进入 `/admin` 设置后台口令，然后保存腾讯文档凭据和蓝奏云默认密码，再添加首页访问口令。回到 `/` 输入访问口令后即可同步和浏览字体列表。

## 配置

可以用环境变量提供默认配置，也可以启动后在后台页面保存配置。后台保存内容会写入 `data/settings.local`。

```bash
PORT=1103
TENCENT_DOC_URL=https://docs.qq.com/doc/xxxx
TENCENT_DOC_CLIENT_ID=your_client_id
TENCENT_DOC_ACCESS_TOKEN=your_access_token
TENCENT_DOC_OPEN_ID=your_open_id
```

`data/` 目录包含口令哈希、腾讯文档凭据、字体缓存和已解析下载结果，已经被 `.gitignore` 忽略，不要提交到公开仓库。

## 构建

```bash
pnpm run build
pnpm start
```

## VPS 部署建议

1. 把仓库放到服务器，例如 `/opt/inugamishi-fonts`。
2. 安装依赖并构建：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build
```

3. 用 systemd 托管 Node 进程：

```ini
[Unit]
Description=Inugamishi Fonts
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/inugamishi-fonts
Environment=NODE_ENV=production
Environment=PORT=1103
ExecStart=/usr/bin/node dist/app.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

4. 用 Nginx/Caddy 反向代理到 `127.0.0.1:1103`，并配置 HTTPS。

## 页面和 API

| 路径      | 说明                 |
| --------- | -------------------- |
| `/`       | 字体目录首页         |
| `/admin`  | 后台配置页面         |
| `/api/*`  | 项目内部 API         |
| `/lanzou` | 兼容原蓝奏云解析接口 |

常用接口：

```http
GET /api/config
POST /api/fonts/sync
GET /api/fonts/cache
POST /api/lanzou/parse
GET /lanzou?url=https://lanzou.com/xxxx&pwd=1234&type=json
```

## 项目结构

```text
src/
├── app.ts                  # Node 服务入口
├── config/                 # 环境变量和运行配置
├── routes/                 # HTTP 路由
├── ui/                     # 首页和后台页面渲染
└── utils/
    ├── fontCache.ts        # 字体缓存读写
    ├── parsedCache.ts      # 解析结果缓存
    ├── settingsStore.ts    # 后台配置和会话管理
    ├── tencentDocs.ts      # 腾讯文档同步和链接提取
    └── lanzou/             # 蓝奏云解析逻辑
```

## 安全提醒

- 不要提交 `.env`、`.env.local` 和 `data/`。
- `data/settings.local` 可能包含后台口令哈希、腾讯文档凭据和蓝奏云默认密码。
- `data/fonts.cache.json` 可能包含字体名称和蓝奏云分享链接。
- `data/parsed.cache.json` 可能包含已解析的文件列表和下载地址。
- 公网部署时请设置强口令，并限制腾讯文档凭据权限。

本项目仅用于个人字体资源整理和下载入口搭建。请确保你拥有字体文件的使用和分发权限，并遵守腾讯文档、蓝奏云及相关字体授权协议。
