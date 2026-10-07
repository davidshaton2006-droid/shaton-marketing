/* Cloudflare Worker: protected proxy between the site builder and an AI provider.
   The AI key lives only in the Worker secrets, never in the website code.
   Setup (Cloudflare dashboard or wrangler):
     1. Create a Worker and paste this file.
     2. Add secrets: AI_KEY (provider API key), AI_URL (OpenAI-compatible chat completions URL), AI_MODEL (model name).
     3. Add variable ALLOWED_ORIGIN = https://davidshaton2006-droid.github.io
     4. Put the Worker URL into catalog.html: SiteBuilder.ai.endpoint = 'https://<your-worker>.workers.dev'.
   The Worker only accepts POST {task, data} from the allowed origin, limits input size, and returns {text}. */
const PROMPTS = {
  tagline: d => `Предложи один заголовок первого экрана сайта (до 70 символов) для: ${d.role}${d.city ? ', город ' + d.city : ''}${d.audience ? ', клиенты: ' + d.audience : ''}${d.diff ? ', отличие: ' + d.diff : ''}. Без слов "лучший", "профессиональный", без выдуманных фактов и цифр. Ответь только заголовком.`,
  seoDesc: d => `Напиши description для страницы сайта (до 160 символов): ${d.role}${d.city ? ', ' + d.city : ''}. Не придумывай факты. Ответь только текстом.`,
  benefit: d => `Сформулируй выгоду клиента одной строкой (до 90 символов) для услуги «${d.service}». Не добавляй цифры и гарантии, которых нет в данных. Ответь только строкой.`
};
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': origin === env.ALLOWED_ORIGIN ? origin : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403, headers: cors });
    let body; try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400, headers: cors }); }
    const make = PROMPTS[body.task]; if (!make) return new Response('Unknown task', { status: 400, headers: cors });
    const data = {}; for (const k of Object.keys(body.data || {})) data[k] = String(body.data[k] || '').slice(0, 300);
    const r = await fetch(env.AI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.AI_KEY },
      body: JSON.stringify({ model: env.AI_MODEL, temperature: 0.7, max_tokens: 200, messages: [{ role: 'system', content: 'Ты редактор сайтов малого бизнеса. Пиши кратко, по-русски, без выдуманных фактов.' }, { role: 'user', content: make(data) }] }) });
    if (!r.ok) return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
    const j = await r.json(); const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim().replace(/^["«]|["»]$/g, '');
    return new Response(JSON.stringify({ text }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
