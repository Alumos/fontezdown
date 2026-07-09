# EdgeOne Pages 部署说明

这个项目保留 Node 服务器入口，同时提供 EdgeOne Pages Functions 入口：

- 普通服务器：`src/app.ts` -> `dist/app.js`
- EdgeOne：`functions/[[path]].ts`

EdgeOne 版本不会使用本地 `data/*.json`，后台口令、腾讯文档配置和字体缓存会写入 EdgeOne Pages Blob。

## 1. 存储方式

不需要创建或绑定 KV。

项目使用 `@edgeone/pages-blob`：

```ts
const store = getStore("fontezdown");
```

Blob Store 会在首次调用时由 EdgeOne 自动创建。当前使用的对象路径：

```text
config/settings.json
cache/fonts.json
```

读取使用强一致模式，避免刚保存后台设置后立刻刷新读到旧数据。

## 2. 环境变量

建议至少配置一个初始口令：

```text
ADMIN_PASSCODE=你的访问口令
```

如果设置了 `ADMIN_PASSCODE`，后台口令由环境变量管理，页面可以直接用这个口令登录；后台里的“修改口令”会提示由环境变量管理。

腾讯文档和蓝奏密码可以用环境变量，也可以登录后台后保存到 Blob。
主界面访问口令不再使用 `ADMIN_PASSCODE`，请在管理后台的“主界面访问口令”区域添加。可以自定义，也可以随机生成，并支持多个口令同时有效。

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

## 3. 构建设置

推荐设置：

```text
Install Command: corepack pnpm install --frozen-lockfile
Build Command: corepack pnpm run edgeone:check
Output Directory: public
```

`public` 目录只是占位，真实页面和 API 由 `functions/[[path]].ts` 响应。

## 4. 首次使用

1. 打开 EdgeOne 分配的域名。
2. 进入 `/admin`，用 `ADMIN_PASSCODE` 登录，或者按页面提示初始化后台口令。
3. 在管理后台检查或保存腾讯文档配置。
4. 在“主界面访问口令”区域添加至少一个访问口令。
5. 回首页用主界面访问口令进入，点击“同步文档”，成功后字体列表会写入 Blob 缓存。

## 5. 注意事项

- EdgeOne Blob 控制台只读浏览，写入由函数里的 SDK 完成。
- 当前蓝奏云解析依赖第三方页面结构和反爬流程；EdgeOne 国内链路通常更适合访问蓝奏云。
- `.env.example` 只保留占位示例，不包含真实腾讯文档地址。
