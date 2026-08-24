/*
 * Обработката на едно запитване, без нищо платформено.
 *
 * Ползва се и от Cloudflare, и от Vercel. Двете обвивки само подават настройките
 * и връщат отговора по своя начин — правилата за валидност и записът са тук, за
 * да не се разминат.
 */

const NOTION_VERSION = '2022-06-28';
const PHONE = /^[+\d][\d\s()-]{6,}$/;

const text = (value) => (value ? [{ type: 'text', text: { content: String(value).slice(0, 1900) } }] : []);

/** Отговорът, който обвивката превръща в HTTP отговор. */
const reply = (status, body) => ({ status, body });

async function saveToNotion(lead, config) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.notionKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: config.leadsDb },
      properties: {
        'Име': { title: text(lead.name) },
        'Телефон': { phone_number: lead.phone },
        'Имейл': { email: lead.email || null },
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

  if (!response.ok) throw new Error(`Notion ${response.status}: ${await response.text()}`);
}

/** Писмото е допълнение. Ако падне, запитването вече е записано и не се губи. */
async function sendEmail(lead, config) {
  if (!config.resendKey || !config.emailTo || !config.emailFrom) return;

  const lines = [
    `Име: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.email ? `Имейл: ${lead.email}` : '',
    lead.service ? `Услуга: ${lead.service}` : '',
    lead.district ? `Квартал: ${lead.district}` : '',
    lead.page ? `Страница: ${lead.page}` : '',
    '',
    lead.message || '(без описание)',
  ].filter(Boolean);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: config.emailFrom,
      to: config.emailTo.split(',').map((address) => address.trim()),
      subject: `Ново запитване от ${lead.name}`,
      text: lines.join('\n'),
    }),
  });
}

/**
 * Приема тялото на заявката и настройките, връща { status, body }.
 * Не хвърля — всяка грешка излиза като отговор, за да не пада функцията.
 */
export async function handleLead(body, config) {
  // Скритото поле го пълнят само ботове. Отговаряме с успех, за да не опитват пак.
  if (body.company) return reply(200, { ok: true });

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();

  if (name.length < 2) return reply(400, { error: 'Липсва име.' });
  if (!PHONE.test(phone)) return reply(400, { error: 'Телефонът е непълен.' });
  if (!body.consent) return reply(400, { error: 'Липсва съгласие.' });

  if (!config.notionKey || !config.leadsDb) {
    console.error('Липсва NOTION_API_KEY или NOTION_LEADS_DB.');
    return reply(500, { error: 'Приемникът не е настроен.' });
  }

  const lead = {
    name,
    phone,
    email: String(body.email ?? '').trim(),
    service: String(body.service ?? '').trim(),
    message: String(body.message ?? '').trim(),
    page: String(body.page ?? '').trim(),
    district: String(body.district ?? '').trim(),
  };

  try {
    await saveToNotion(lead, config);
  } catch (error) {
    console.error('Запитването не влезе в Notion:', error);
    return reply(502, { error: 'Записът не мина.' });
  }

  try {
    await sendEmail(lead, config);
  } catch (error) {
    console.error('Писмото не тръгна, но запитването е записано:', error);
  }

  return reply(200, { ok: true });
}

/** Настройките, извадени от каквото носи платформата. */
export const configFrom = (env) => ({
  notionKey: env.NOTION_API_KEY,
  leadsDb: env.NOTION_LEADS_DB,
  resendKey: env.RESEND_API_KEY,
  emailTo: env.LEAD_EMAIL_TO,
  emailFrom: env.LEAD_EMAIL_FROM,
});
