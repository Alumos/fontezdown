import { renderAdminPage } from '../src/ui/adminPage.js';

export function onRequest(): Response {
  return new Response(renderAdminPage(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
