# EdgeOne Makers 部署说明

这个项目保留了原来的 Node 服务器入口，同时新增了 EdgeOne Makers/Pages Functions 入口：

- 普通服务器：`src/app.ts` -> `dist/app.js`
- EdgeOne：`functions/[[path]].ts`

EdgeOne 版本不会使用本地 `data/*.json`，而是通过 KV 保存后台口令、腾讯文档配置和字体缓存。

## 1. 在 EdgeOne 创建 KV

在 EdgeOne Makers/Pages 控制台创建一个 KV 命名空间，然后绑定到项目。

绑定变量名必须是：

```text
FONTSEZ_KV
```

没有绑定 KV 时，页面能打开，但后台设置、口令初始化、字体缓存无法持久化。

## 2. 配置环境变量

建议至少配置一个初始口令：

```text
ADMIN_PASSCODE=你的访问口令
```

如果设置了 `ADMIN_PASSCODE`，后台口令由环境变量管理，页面可以直接用这个口令登录；后台里的“修改口令”会提示由环境变量管理。

腾讯文档和蓝奏密码可以用环境变量，也可以登录后台后保存到 KV。

可选环境变量：

```text
TENCENT_DOC_URL=腾讯文档地址
TENCENT_DOC_CLIENT_ID=腾讯 Client ID
TENCENT_DOC_ACCESS_TOKEN=腾讯 Access Token
TENCENT_DOC_OPEN_ID=腾讯 Open ID
LANZOU_PWD=蓝奏云默认密码
```

兼容旧变量名：

```text
QQ_DOC_URL
QQ_DOC_CLIENT_ID
QQ_DOC_ACCESS_TOKEN
QQ_DOC_OPEN_ID
```

## 3. EdgeOne 构建设置

推荐设置：

```text
Install Command: corepack pnpm install --frozen-lockfile
Build Command: corepack pnpm run edgeone:check
Output Directory: public
```

`public` 目录只是占位，真实页面和 API 由 `functions/[[path]].ts` 响应。

## 4. 首次使用

1. 打开 EdgeOne 分配的域名。
2. 用 `ADMIN_PASSCODE` 登录首页。
3. 进入管理后台，检查或保存腾讯文档配置。
4. 回首页点击“同步文档”，成功后字体列表会写入 KV 缓存。

## 5. 注意事项

- KV 是边缘键值存储，写入后不同边缘节点可能有短暂同步延迟。
- 当前蓝奏云解析依赖第三方页面结构和反爬流程，在 EdgeOne 边缘运行时可能比普通 Node 服务器更容易受网络或运行时限制影响。
- 如果 EdgeOne 上蓝奏解析不稳定，建议只把首页和腾讯文档缓存放 EdgeOne，蓝奏解析继续走普通服务器 API。
