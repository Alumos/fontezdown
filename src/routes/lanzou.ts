import { parseLanzouUrl } from '../utils/lanzou/lanzouParser.js';
import { reply } from '../utils/reply/reply.js';
import { getManagedSettings } from '../utils/settingsStore.js';
import type { Context } from 'hono';
import { Hono } from 'hono';

const router = new Hono();

async function handleLanzouRequest(c: Context) {
  try {
    const url = c.req.query('url') as string;
    if (!url) {
      return c.json(reply(1, '缺少 url 参数'));
    }
    const pwd =
      (c.req.query('pwd') as string | undefined) ||
      getManagedSettings().lanzouPwd;
    const type = (c.req.query('type') as string) || 'json';

    const data = await parseLanzouUrl({
      url,
      pwd,
      type,
    });

    if (data.code === 0 && data.data && 'redirect' in data.data) {
      return c.redirect(data.data.redirect);
    }
    return c.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json(reply(1, '获取信息失败', message));
  }
}

router.get('', handleLanzouRequest);
router.get('/', handleLanzouRequest);

export default router;
