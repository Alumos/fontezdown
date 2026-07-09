import type {
  AjaxmResponse,
  LanzouClient,
  ParseFileItem,
  ParseResult,
  ParseSuccessData,
} from '../types.js';
import { createLanzouClient, getHeaders } from './lanzouHttpClient.js';
import * as cheerio from 'cheerio';

interface LanzouUrlCandidate {
  baseUrl: string;
  inputUrl: string;
}

interface FolderAjaxResponse {
  zt: number | string;
  info?: string;
  text?: FolderAjaxItem[];
}

interface FolderAjaxItem {
  id: string;
  name_all?: string;
  size?: string;
  time?: string;
  t?: number;
}

/**
 * 解析蓝奏云分享链接
 */
async function parseLanzouUrl(params: {
  url: string;
  pwd?: string;
  type?: string;
  n?: string;
}): Promise<ParseResult> {
  const { url, pwd, type, n: rename } = params;
  if (!url) return { code: 1, msg: '请输入URL' };

  const candidates = buildUrlCandidates(url);
  if (candidates.length === 0) {
    return { code: 1, msg: '请输入正确的蓝奏云分享链接' };
  }

  // 为每次解析创建新的客户端实例（隔离 Cookie）
  const client = createLanzouClient();

  let lastError: ParseResult | null = null;

  for (const { baseUrl, inputUrl } of candidates) {
    try {
      // Step 0: 访问主页获取初始 Cookie
      await getInitialCookies(client, baseUrl);

      // Step 1: 初次请求（自动处理 acw_sc__v2）
      const firstResponse = await client.getWithAcwRetry(inputUrl, {
        headers: getHeaders(inputUrl),
      });

      if (!firstResponse.data) {
        lastError = { code: 1, msg: '页面无内容' };
        continue;
      }
      if (firstResponse.data.includes('文件取消分享了')) {
        lastError = { code: 1, msg: '文件取消分享了' };
        continue;
      }

      const $ = cheerio.load(firstResponse.data);

      let fileName = extractFileName($);
      const fileSize = extractFileSize($);

      if (firstResponse.data.includes('filemoreajax.php')) {
        return await parseFolderPage(client, firstResponse.data, {
          baseUrl,
          inputUrl,
          pwd,
        });
      }

      // Step 2: 需要密码
      if (firstResponse.data.includes('function down_p()')) {
        if (!pwd) return { code: 1, msg: '请输入分享密码' };

        const cleanCode = firstResponse.data.replace(/\/\*[\s\S]*?\*\//g, '');
        const sign = matchOne(cleanCode, /'sign':'(.*?)',/);
        const fileId = matchOne(
          cleanCode,
          /url\s*:\s*'\/ajaxm\.php\?file=(\d+)(?=[^/]*')/,
        );
        if (!sign || !fileId) {
          lastError = { code: 1, msg: '获取文件标识失败' };
          continue;
        }

        const postResult = await getAjaxmResult(
          client,
          baseUrl,
          baseUrl,
          fileId,
          {
            action: 'downprocess',
            sign,
            p: pwd,
            kd: 1,
          },
        );

        if (postResult.zt !== 1) {
          lastError = { code: 1, msg: postResult.inf || '解析失败' };
          continue;
        }

        fileName = postResult.inf || fileName;
        return await handleFinalUrl(client, postResult, {
          fileName,
          fileSize,
          rename: rename || '',
          type: type || 'json',
        });
      }

      // Step 3: 无密码
      const iframeSrc = $('iframe').attr('src');
      if (!iframeSrc) {
        lastError = { code: 1, msg: '无法解析下载页面' };
        continue;
      }
      const iframeUrl = new URL(iframeSrc, baseUrl).toString();

      const iframeResponse = await client.getWithAcwRetry(iframeUrl, {
        headers: getHeaders(inputUrl),
      });

      const signs = matchOne(iframeResponse.data, /ajaxdata = '(.*?)'/);
      const sign = matchOne(iframeResponse.data, /wp_sign = '(.*?)'/);
      const fileId = matchOne(
        iframeResponse.data.replace(`//url : '/ajaxm.php?file=1',//`, ''),
        /url\s*:\s*'\/ajaxm\.php\?file=(\d+)(?=[^/]*')/,
      );
      if (!sign || !fileId || !signs) {
        lastError = { code: 1, msg: '获取文件标识失败' };
        continue;
      }

      const postResult = await getAjaxmResult(
        client,
        baseUrl,
        iframeSrc,
        fileId,
        {
          action: 'downprocess',
          websignkey: signs,
          signs,
          sign,
          websign: '',
          kd: 1,
          ves: 1,
        },
      );

      if (postResult.zt !== 1) {
        lastError = { code: 1, msg: postResult.inf || '解析失败' };
        continue;
      }

      return await handleFinalUrl(client, postResult, {
        fileName,
        fileSize,
        rename: rename || '',
        type: type || 'json',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('解析失败:', message);
      lastError = {
        code: 1,
        msg: '解析异常',
        error: message,
      };
      continue;
    }
  }
  return lastError || { code: 1, msg: '解析失败' };
}

async function parseFolderPage(
  client: LanzouClient,
  html: string,
  {
    baseUrl,
    inputUrl,
    pwd,
  }: { baseUrl: string; inputUrl: string; pwd?: string },
): Promise<ParseResult> {
  if (html.includes('pwdload') && !pwd) {
    return { code: 1, msg: '请输入分享密码' };
  }

  const postPath = matchOne(
    html,
    /url\s*:\s*['"]([^'"]*\/filemoreajax\.php\?file=\d+)['"]/,
  );
  if (!postPath) return { code: 1, msg: '无法解析文件夹列表接口' };

  const items: FolderAjaxItem[] = [];
  for (let page = 1; page <= 20; page++) {
    const response = await getFolderAjaxResult(client, html, {
      baseUrl,
      inputUrl,
      page,
      postPath,
      pwd: pwd || '',
    });

    const zt = Number(response.zt);
    if (zt === 3) return { code: 1, msg: response.info || '分享密码错误' };
    if (zt === 2) break;
    if (zt !== 1)
      return { code: 1, msg: response.info || '获取文件夹列表失败' };

    const pageItems = Array.isArray(response.text) ? response.text : [];
    items.push(...pageItems.filter((item) => item.id && item.id !== '-1'));
    if (pageItems.length < 50) break;
  }

  const files: ParseFileItem[] = [];
  for (const item of items) {
    const fileUrl = new URL(item.id, baseUrl).toString();
    const parsed = await parseLanzouUrl({ url: fileUrl, type: 'json' });
    const parsedFile =
      parsed.code === 0 && 'downUrl' in parsed.data
        ? (parsed.data as ParseSuccessData)
        : null;

    files.push({
      name: stripHtml(item.name_all || parsedFile?.name || item.id),
      size: item.size || parsedFile?.filesize || '',
      date: item.time || '',
      downloadUrl: parsedFile?.downUrl || '',
      ...(parsed.code === 1 ? { error: parsed.msg } : {}),
    });
  }

  return {
    code: 0,
    msg: '解析成功',
    data: { files },
  };
}

async function getFolderAjaxResult(
  client: LanzouClient,
  html: string,
  {
    baseUrl,
    inputUrl,
    page,
    postPath,
    pwd,
  }: {
    baseUrl: string;
    inputUrl: string;
    page: number;
    postPath: string;
    pwd: string;
  },
): Promise<FolderAjaxResponse> {
  const payload = extractFolderPayload(html, page, pwd);
  const res = await client.postWithAcwRetry(
    new URL(postPath, baseUrl).toString(),
    new URLSearchParams(payload),
    {
      headers: {
        ...getHeaders(inputUrl),
        'content-type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/javascript, */*',
        origin: baseUrl,
        'x-requested-with': 'XMLHttpRequest',
      },
    },
  );

  return res.data as FolderAjaxResponse;
}

function extractFolderPayload(
  html: string,
  page: number,
  pwd: string,
): Record<string, string> {
  const tVar = matchOne(html, /'t'\s*:\s*([A-Za-z_$][\w$]*)/);
  const kVar = matchOne(html, /'k'\s*:\s*([A-Za-z_$][\w$]*)/);
  const payload: Record<string, string> = {
    lx: matchOne(html, /'lx'\s*:\s*(\d+)/) || '2',
    fid: matchOne(html, /'fid'\s*:\s*(\d+)/) || '',
    uid: matchOne(html, /'uid'\s*:\s*'([^']*)'/) || '',
    puid: matchOne(html, /'puid'\s*:\s*'([^']*)'/) || '',
    pg: String(page),
    rep: matchOne(html, /'rep'\s*:\s*'([^']*)'/) || '0',
    t: tVar ? matchVariableValue(html, tVar) || '' : '',
    k: kVar ? matchVariableValue(html, kVar) || '' : '',
    up: matchOne(html, /'up'\s*:\s*(\d+)/) || '1',
    ls: matchOne(html, /'ls'\s*:\s*(\d+)/) || '1',
    pwd,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== ''),
  );
}

function buildUrlCandidates(url: string): LanzouUrlCandidate[] {
  const normalizedUrl = /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : `https://${url.trim()}`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return [];
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (
    !/(^|\.)lanzou[\w-]*\.com$/.test(host) &&
    !/(^|\.)lanzn\.com$/.test(host)
  ) {
    return [];
  }

  const pathAndSearch = `${parsedUrl.pathname}${parsedUrl.search}`;
  const baseUrls = [
    parsedUrl.origin,
    'https://www.lanzoux.com',
    'https://www.lanzouf.com',
    'https://www.lanzouj.com',
    'https://www.lanzouu.com',
    'https://www.lanzouw.com',
    'https://www.lanzouv.com',
  ];
  const seen = new Set<string>();
  const candidates: LanzouUrlCandidate[] = [];

  for (const baseUrl of baseUrls) {
    if (seen.has(baseUrl)) continue;

    seen.add(baseUrl);
    candidates.push({
      baseUrl,
      inputUrl: `${baseUrl}${pathAndSearch}`,
    });
  }

  return candidates;
}

/**
 * 获取初始 Cookie
 */
async function getInitialCookies(
  client: LanzouClient,
  baseUrl: string,
): Promise<void> {
  try {
    await client.instance.get(baseUrl, {
      headers: getHeaders(baseUrl),
    });
  } catch (err: unknown) {
    console.warn(
      '获取初始cookie失败:',
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * 获取 ajaxm 结果（自动处理 acw_sc__v2）
 */
async function getAjaxmResult(
  client: LanzouClient,
  baseUrl: string,
  iframeSrc: string,
  fileId: string,
  payload: Record<string, string | number>,
): Promise<AjaxmResponse> {
  const postUrl = `${baseUrl}/ajaxm.php?file=${fileId}`;
  const res = await client.postWithAcwRetry(
    postUrl,
    new URLSearchParams(
      Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, String(v)]),
      ),
    ),
    {
      headers: {
        ...getHeaders(`${baseUrl}${iframeSrc}`),
        'content-type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/javascript, */*',
        origin: baseUrl,
        'x-requested-with': 'XMLHttpRequest',
      },
    },
  );
  return res.data as AjaxmResponse;
}

/**
 * 处理最终直链
 */
async function handleFinalUrl(
  client: LanzouClient,
  data: AjaxmResponse,
  {
    fileName,
    fileSize,
    rename,
    type,
  }: { fileName: string; fileSize: string; rename: string; type: string },
): Promise<ParseResult> {
  const downUrl1 = `${data.dom}/file/${data.url}`;
  const finalUrl = await resolveFinalUrl(client, downUrl1);
  if (type === 'down' || type === 'redirect') {
    return { code: 0, msg: '跳转下载', data: { redirect: finalUrl } };
  }
  return {
    code: 0,
    msg: '解析成功',
    data: { name: rename || fileName, filesize: fileSize, downUrl: finalUrl },
  };
}

/**
 * 通过 HEAD 请求解析跳转后的直链（自动处理 acw_sc__v2）
 */
async function resolveFinalUrl(
  client: LanzouClient,
  url: string,
): Promise<string> {
  try {
    const res = await client.headWithAcwRetry(url, {
      headers: getHeaders(url),
      maxRedirects: 0,
      validateStatus: (s: number) => s >= 200 && s < 400,
    });
    return (res.headers.location as string | undefined) ?? url;
  } catch (err: unknown) {
    if (
      err instanceof Object &&
      'response' in err &&
      err.response instanceof Object &&
      'status' in err.response &&
      typeof err.response.status === 'number' &&
      err.response.status >= 300 &&
      err.response.status < 400 &&
      'headers' in err.response &&
      err.response.headers instanceof Object &&
      'location' in err.response.headers
    ) {
      return (err.response.headers as Record<string, string>).location ?? url;
    }
    console.error('解析最终URL失败:', err instanceof Error ? err.message : err);
    return url;
  }
}

function extractFileName($: cheerio.CheerioAPI): string {
  return (
    $('.n_box_3fn').text().trim() ||
    $('.b span').text().trim() ||
    $('title').text().replace(' 蓝奏云', '') ||
    ''
  );
}

function extractFileSize($: cheerio.CheerioAPI): string {
  return (
    $('.n_filesize').text().replace('大小：', '').trim() ||
    $('span.p7')
      .parent()
      .contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .text()
      .trim()
  );
}

function matchOne(text: string, regex: RegExp): string | null {
  const m = text.match(regex);
  return m?.[1] ?? null;
}

function matchVariableValue(text: string, variableName: string): string | null {
  return matchOne(
    text,
    new RegExp(`var\\s+${escapeRegExp(variableName)}\\s*=\\s*'([^']*)'`),
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(text: string): string {
  return cheerio.load(`<span>${text}</span>`)('span').text().trim();
}

export { parseLanzouUrl };
