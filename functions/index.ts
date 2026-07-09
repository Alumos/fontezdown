import { renderIndexPage } from '../src/ui/indexPage.js';

export function onRequest(): Response {
  return new Response(renderIndexPage(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
