/*
 * Приемникът на запитванията в Cloudflare Pages.
 *
 * Файлът в functions/ дава адреса /api/lead. Настройките идват от `env`, а не
 * от process.env — Workers нямат такова нещо. Самата работа е в shared/lead.js,
 * за да е една и съща и тук, и на Vercel.
 */

import { handleLead, configFrom } from '../../shared/lead.js';

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(405, { error: 'Само POST.' }, { Allow: 'POST' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Очаква се JSON.' });
  }

  const { status, body: payload } = await handleLead(body, configFrom(env));
  return json(status, payload);
}
