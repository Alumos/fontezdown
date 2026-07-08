# Fontezdown

基于原项目 **Lanzou URL Parser** 改造的字体下载工具。

这个项目保留了蓝奏云分享链接解析能力，并在此基础上增加了字体清单同步、后台配置、缓存和下载入口页面。适合把字体资源放在蓝奏云，再用腾讯文档维护字体名称和分享链接，最后通过一个轻量 Web 服务生成可浏览、可解析、可下载的字体列表。

## 项目来源

Fontezdown 的蓝奏云解析部分来源于 **Lanzou URL Parser** 的思路：接收蓝奏云分享链接，模拟必要请求，处理分享密码、页面解析和蓝奏云的防护逻辑，最终拿到真实下载地址。

在这个基础上，本项目主要做了这些改造：

- 从单纯的蓝奏云链接解析 API，扩展为字体下载站点。
- 增加腾讯文档同步能力，用文档维护字体名和蓝奏云链接。
- 增加首页 UI，用于展示字体列表和发起下载。
- 增加后台页面，用于配置腾讯文档凭据、蓝奏云默认密码和管理口令。
- 增加本地缓存，腾讯文档同步失败时可以继续使用上一次缓存。
- 适配 Node 本地运行、Cloudflare Pages Functions 和 EdgeOne Pages Functions。

## 基本原理

项目整体流程可以理解为四步：

1. 在腾讯文档中维护字体信息，每一行或文本内容里包含字体名称和蓝奏云分享链接。
2. 后台调用腾讯文档 OpenAPI，读取文档内容，并从文本、超链接字段里提取蓝奏云 URL。
3. 提取到的字体条目会写入缓存文件，首页读取缓存后展示字体列表。
4. 用户点击下载时，服务端调用蓝奏云解析器，把分享链接转换成可访问的下载地址，再返回给前端或直接重定向。

这样做的好处是字体资源不用写死在代码里：字体清单可以在腾讯文档里维护，蓝奏云负责文件托管，Fontezdown 负责同步、解析和展示。

## 功能特性

- 字体列表首页：访问 `/` 查看已同步的字体资源。
- 后台管理页：访问 `/admin` 设置口令、腾讯文档凭据和蓝奏云默认密码。
- 腾讯文档同步：从腾讯文档中提取字体名称和蓝奏云链接。
- 蓝奏云解析：支持普通链接、带密码链接，以及文件夹/文件结果。
- 下载缓存：同步结果会缓存到本地，接口失败时可回退到上一次缓存。
- 速率限制：默认 15 分钟内限制请求次数，避免服务被滥用。
- 跨域支持：内置 CORS，方便前端调用。
- 多平台部署：支持本地 Node、Cloudflare Pages 和 EdgeOne Pages。

## 快速开始

### 环境要求

- Node.js 16+
- pnpm 10.33.0+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

可以复制 `.env.example` 为 `.env`，然后填入自己的腾讯文档配置：

```bash
PORT=1103
TENCENT_DOC_URL=https://docs.qq.com/doc/xxxx
TENCENT_DOC_CLIENT_ID=your_client_id
TENCENT_DOC_ACCESS_TOKEN=your_access_token
TENCENT_DOC_OPEN_ID=your_open_id
```

也可以启动后进入 `/admin` 在后台页面里配置。后台保存的配置会写入 `data/settings.local`，同步缓存会写入 `data/fonts.cache.json`。

`data/` 目录包含本地口令、凭据和缓存，已经被 `.gitignore` 忽略，不应该上传到 GitHub。

### 本地运行

```bash
pnpm run dev
```

默认地址：

```text
http://localhost:1103
```

### 构建

```bash
pnpm run build
pnpm start
```

## 页面说明

| 路径 | 说明 |
| --- | --- |
| `/` | 字体下载首页 |
| `/admin` | 后台配置页面 |
| `/lanzou` | 兼容原蓝奏云解析接口 |
| `/api/*` | 项目内部 API |

首次进入后台时需要设置管理口令。口令会经过 PBKDF2 哈希后保存在本地配置文件中，不会明文保存。

## 主要 API

### 查看配置状态

```http
GET /api/config
```

返回后台是否已配置口令、腾讯文档凭据和蓝奏云默认密码。

### 同步字体列表

```http
POST /api/fonts/sync
```

需要后台登录。接口会读取腾讯文档，提取字体项，写入缓存并返回同步结果。

### 读取字体缓存

```http
GET /api/fonts/cache
```

需要后台登录。用于查看当前缓存中的字体列表。

### 解析蓝奏云链接

```http
POST /api/lanzou/parse
Content-Type: application/json

{
  "url": "https://lanzou.com/xxxx",
  "pwd": "可选密码"
}
```

如果请求里没有传 `pwd`，会尝试使用后台配置的蓝奏云默认密码。

### 兼容原解析接口

```http
GET /lanzou?url=https://lanzou.com/xxxx&pwd=1234&type=json
GET /lanzou?url=https://lanzou.com/xxxx&type=redirect
```

`type=json` 返回解析结果，`type=redirect` 会直接跳转到解析出的下载地址。

## 项目结构

```text
├── functions/                  # Pages Functions 入口
├── public/                     # 静态资源和 Pages 路由配置
├── src/
│   ├── app.ts                  # Node 本地服务入口
│   ├── config/                 # 环境变量和运行配置
│   ├── routes/                 # HTTP 路由
│   ├── ui/                     # 首页和后台页面渲染
│   └── utils/
│       ├── fontCache.ts        # 字体缓存读写
│       ├── settingsStore.ts    # 后台配置和会话管理
│       ├── tencentDocs.ts      # 腾讯文档同步和链接提取
│       └── lanzou/             # 蓝奏云解析逻辑
├── README_CLOUDFLARE.md        # Cloudflare Pages 部署说明
├── README_EDGEONE.md           # EdgeOne Pages 部署说明
└── wrangler.toml               # Cloudflare Pages 配置
```

## 部署

Cloudflare Pages 部署可以参考：

```text
README_CLOUDFLARE.md
```

EdgeOne Pages 部署可以参考：

```text
README_EDGEONE.md
```

部署时建议把敏感信息放在平台的环境变量或 Secret 里，不要写入仓库。

## 隐私和安全

- 不要提交 `.env`、`.env.local` 和 `data/`。
- `data/settings.local` 可能包含后台口令哈希、腾讯文档凭据和蓝奏云默认密码。
- `data/fonts.cache.json` 可能包含字体清单和蓝奏云分享链接。
- 如果部署到公共网络，建议设置强一点的后台口令，并限制凭据权限。

## 技术栈

- Hono
- TypeScript
- Axios
- Cheerio
- dayjs
- hono-rate-limiter

## 说明

本项目仅用于个人字体资源整理和下载入口搭建。请确保你拥有字体文件的使用和分发权限，并遵守腾讯文档、蓝奏云及相关字体授权协议。
