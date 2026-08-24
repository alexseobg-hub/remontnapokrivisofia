/*
 * Приемникът на запитванията във Vercel.
 *
 * Пази се, докато трае преминаването към Cloudflare, за да работи формата и на
 * двете места. Работата е в shared/lead.js — тук стои само превода от заявката
 * на Vercel към общата функция.
 */

import { handleLead, configFrom } from '../shared/lead.js';

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Само POST.' });
  }

  const { status, body } = await handleLead(readBody(req), configFrom(process.env));
  return res.status(status).json(body);
}
