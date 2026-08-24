/*
 * Приемник на запитванията от формите.
 *
 * Работи като функция във Vercel и записва реда в базата „Запитвания“ в Notion.
 * Ползва същия токен, с който се дърпа съдържанието — няма втори доставчик и
 * няма месечна такса. Ако е зададен RESEND_API_KEY, праща и писмо; без него
 * записът в Notion е единственият изход и това е достатъчно.
 */

const NOTION_VERSION = '2022-06-28';
const PHONE = /^[+\d][\d\s()-]{6,}$/;

const text = (value) => (value ? [{ type: 'text', text: { content: String(value).slice(0, 1900) } }] : []);

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

async function saveToNotion(lead) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: process.env.NOTION_LEADS_DB },
      properties: {
        'Име': { title: text(lead.name) },
        'Телефон': { phone_number: lead.phone },
        'Услуга': { rich_text: text(lead.service) },
        'Съобщение': { rich_text: text(lead.message) },
        'Страница': { rich_text: text(lead.page) },
        'Квартал': { rich_text: text(lead.district) },
        'Статус': { select: { name: 'Ново' } },
        'Получено': { date: { start: new Date().toISOString() } },
        'Съгласие': { checkbox: true },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion ${response.status}: ${await response.text()}`);
  }
}

/** Писмото е допълнение. Ако падне, запитването вече е записано и не се губи. */
async function sendEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO;
  const from = process.env.LEAD_EMAIL_FROM;
  if (!key || !to || !from) return;

  const lines = [
    `Име: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.service ? `Услуга: ${lead.service}` : '',
    lead.district ? `Квартал: ${lead.district}` : '',
    lead.page ? `Страница: ${lead.page}` : '',
    '',
    lead.message || '(без описание)',
  ].filter(Boolean);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: to.split(',').map((address) => address.trim()),
      reply_to: undefined,
      subject: `Ново запитване от ${lead.name}`,
      text: lines.join('\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Само POST.' });
  }

  const body = readBody(req);

  // Скритото поле го пълнят само ботове. Отговаряме с успех, за да не опитват пак.
  if (body.company) return res.status(200).json({ ok: true });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  if (name.length < 2) return res.status(400).json({ error: 'Липсва име.' });
  if (!PHONE.test(phone)) return res.status(400).json({ error: 'Телефонът е непълен.' });
  if (!body.consent) return res.status(400).json({ error: 'Липсва съгласие.' });

  if (!process.env.NOTION_API_KEY || !process.env.NOTION_LEADS_DB) {
    console.error('Липсва NOTION_API_KEY или NOTION_LEADS_DB.');
    return res.status(500).json({ error: 'Приемникът не е настроен.' });
  }

  const lead = {
    name,
    phone,
    service: String(body.service ?? '').trim(),
    message: String(body.message ?? '').trim(),
    page: String(body.page ?? '').trim(),
    district: String(body.district ?? '').trim(),
  };

  try {
    await saveToNotion(lead);
  } catch (error) {
    console.error('Запитването не влезе в Notion:', error);
    return res.status(502).json({ error: 'Записът не мина.' });
  }

  try {
    await sendEmail(lead);
  } catch (error) {
    console.error('Писмото не тръгна, но запитването е записано:', error);
  }

  return res.status(200).json({ ok: true });
}
