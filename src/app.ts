import config from './config/config.js';
import apiRouter from './routes/api.js';
import lanzouRouter from './routes/lanzou.js';
import { renderAdminPage } from './ui/adminPage.js';
import { renderIndexPage } from './ui/indexPage.js';
import { startDailySync, stopDailySync } from './utils/dailySync.js';
import { serve } from '@hono/node-server';
import dayjs from 'dayjs';
import { Hono } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(cors());

app.use(rateLimiter(config.rateLimit));

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  console.log(
    `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${c.req.method} ${url.pathname}`,
  );
  await next();
});

app.get('/', (c) => c.html(renderIndexPage()));
app.get('/admin', (c) => c.html(renderAdminPage()));

app.route('/api', apiRouter);
app.route('/lanzou', lanzouRouter);

app.notFound((c) => {
  return c.json({ success: false, message: '接口不存在' }, 404);
});

app.onError((err, c) => {
  console.error(
    `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 未捕获错误:`,
    err.message,
  );
  return c.json(
    {
      success: false,
      message: '服务器内部错误',
      data: { error: err.message },
    },
    500,
  );
});

const server = serve({ fetch: app.fetch, port: config.PORT }, () => {
  console.log(
    `[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Server running at http://127.0.0.1:${config.PORT}`,
  );
  startDailySync();
});

process.on('SIGINT', () => {
  stopDailySync();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopDailySync();
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
