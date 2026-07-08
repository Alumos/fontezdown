# Cloudflare Pages 部署说明

这个项目可以部署到 Cloudflare Pages，使用 Pages Functions 提供页面和 API，使用 Workers KV 保存后台设置、口令状态和字体缓存。

## 构建设置

推荐优先使用 **Git integration**，不要使用 Cloudflare Dashboard 的网页拖拽/上传。

```text
Framework preset: None
Build command: corepack pnpm run cloudflare:check
Build output directory: public
Root directory: /
Deploy command: 留空
```

如果 Cloudflare 没有自动安装 pnpm 依赖，可以改成：

```text
Build command: corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run cloudflare:check
```

注意：如果你使用 Cloudflare Pages 的 Git integration，不要在控制台里填写 `npx wrangler deploy` 作为 Deploy command。Pages 会在构建成功后自动部署 `public` 和 `functions/`。

如果日志里出现：

```text
It seems that you have run `wrangler deploy` on a Pages project
Missing entry-point to Worker script or to assets directory
```

说明当前配置把 Pages 项目当成普通 Worker 部署了。把 Deploy command 清空，或者改用下面的 `wrangler pages deploy` 命令。

## 不能用网页拖拽上传

Cloudflare Pages 的 Direct Upload 分两种：

- Dashboard 拖拽/上传：只适合纯静态文件，不会编译 `functions/`，也不会完整处理 `wrangler.toml`。
- Wrangler CLI：可以上传静态资源，同时上传 `functions/`。

如果你看到类似提示：

```text
此上传程序暂不支持需要构建过程的项目。
您似乎正在尝试上传带有 wrangler 配置文件的项目。
请改用 wrangler deploy 以获得完整功能支持。
```

说明你走的是 Dashboard 上传路径。这个项目不要用这个方式。

## 用 Wrangler 直接部署

如果你不想接 Git 仓库，可以本地执行：

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm run cloudflare:check
npx wrangler login
npx wrangler pages deploy public --project-name 你的项目名
```

仓库里也提供了脚本：

```bash
pnpm run cloudflare:deploy
```

注意：必须在项目根目录执行 `wrangler pages deploy public`，这样 Wrangler 才会把同级的 `functions/` 一起上传。

## 必要配置

后台口令、腾讯文档配置和字体缓存都需要持久化保存，Pages Functions 本身不保存本地文件，所以必须绑定 KV。

本项目的绑定由 `wrangler.toml` 管理，文件里已经声明：

```toml
[[kv_namespaces]]
binding = "FONTSEZ_KV"
```

Cloudflare 部署时会按这个 binding 创建或绑定 KV。绑定生效后，可以在：

```text
Workers & Pages -> 你的 Pages 项目 -> Settings -> Functions -> Bindings
```

看到 `FONTSEZ_KV`。如果控制台提示“此项目的绑定通过 wrangler.toml 管理”，这是正常的，继续通过仓库里的 `wrangler.toml` 修改绑定即可。

至少设置一个访问口令，建议用 Secret：

```text
ADMIN_PASSCODE=你的访问口令
```

Cloudflare Workers 的 PBKDF2 迭代次数上限是 100000，项目里的后台口令哈希已按这个限制处理。

可选环境变量：

```text
TENCENT_DOC_URL=腾讯文档地址
TENCENT_DOC_CLIENT_ID=腾讯 Client ID
TENCENT_DOC_ACCESS_TOKEN=腾讯 Access Token
TENCENT_DOC_OPEN_ID=腾讯 Open ID
LANZOU_PWD=蓝奏云默认密码
```

## 兼容性

`wrangler.toml` 已启用：

```text
compatibility_flags = ["nodejs_compat"]
```

这是为了让 Cloudflare Workers Runtime 更好地兼容 axios、cheerio 以及少量 Node 风格 API。

## 路由

Cloudflare Pages Functions 使用 `functions/` 目录做文件路由。本项目已有：

```text
functions/index.ts
functions/admin.ts
functions/lanzou.ts
functions/api/[[default]].ts
```

`public/_routes.json` 会让所有请求都进入 Functions。
