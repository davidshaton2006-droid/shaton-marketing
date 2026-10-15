/* Shaton Prime: user ideas (video / article topics).
   Cloudflare Worker + KV namespace IDEAS. Secrets: ADMIN_SECRET (panel), BOT_TOKEN (verifies Telegram initData),
   optional NOTIFY_TOKEN + NOTIFY_CHAT (admin bot token and chat id: pings the author about a new idea).
   Routes:
     POST /idea        {initData?, device, kind, text}          -> {ok, id}
     GET  /my?initData=..&device=..                             -> [{id, kind, text, ts, status, reason}]
     GET  /admin/list      (X-Admin: secret)                    -> all ideas
     POST /admin/set       (X-Admin: secret) {key, status, reason}
   Status values: new | review | accepted | declined. */
const ORIGINS = ['https://davidshaton2006-droid.github.io', 'http://localhost:8765'];
const KINDS = { video: 1, article: 1 }, STATUSES = { new: 1, review: 1, accepted: 1, declined: 1 };

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, X-Admin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function json(req, data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } }); }

async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? new TextEncoder().encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data)));
}
const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');

/* Telegram Mini App initData check: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app */
async function tgUser(initData, botToken) {
  if (!initData || !botToken) return null;
  const p = new URLSearchParams(initData), h = p.get('hash'); if (!h) return null;
  p.delete('hash');
  const str = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const secret = await hmac('WebAppData', botToken);
  const sig = hex(await hmac(secret, str));
  if (sig !== h) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 7 * 86400) return null;
  try { return JSON.parse(p.get('user')); } catch (e) { return null; }
}
async function who(req, env, initData, device) {
  const u = await tgUser(initData, env.BOT_TOKEN);
  if (u && u.id) return { uid: 'tg' + u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '' };
  const d = String(device || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  return d.length >= 12 ? { uid: 'dv' + d, name: '', username: '' } : null;
}
const isAdmin = (req, env) => env.ADMIN_SECRET && req.headers.get('X-Admin') === env.ADMIN_SECRET;

async function listBy(env, prefix) {
  const out = []; let cursor;
  do {
    const r = await env.IDEAS.list({ prefix, cursor, limit: 1000 });
    for (const k of r.keys) { const v = await env.IDEAS.get(k.name, 'json'); if (v) out.push(Object.assign({ key: k.name }, v)); }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor && out.length < 2000);
  return out;
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url), path = url.pathname;
    try {
      if (path === '/idea' && req.method === 'POST') {
        const b = await req.json();
        const me = await who(req, env, b.initData, b.device); if (!me) return json(req, { ok: false, error: 'no-identity' }, 400);
        const text = String(b.text || '').trim().slice(0, 600), kind = String(b.kind || '');
        if (text.length < 5 || !KINDS[kind]) return json(req, { ok: false, error: 'bad-input' }, 400);
        const idx = (await env.IDEAS.get('u:' + me.uid, 'json')) || [];
        const today = Date.now() - 86400000;
        if (idx.filter((i) => i.ts > today).length >= 5) return json(req, { ok: false, error: 'limit' }, 429);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const rec = { id, uid: me.uid, name: me.name, username: me.username, kind, text, ts: Date.now(), status: 'new', reason: '' };
        await env.IDEAS.put('i:' + me.uid + ':' + id, JSON.stringify(rec));
        idx.push({ id, ts: rec.ts }); await env.IDEAS.put('u:' + me.uid, JSON.stringify(idx.slice(-50)));
        if (env.NOTIFY_TOKEN && env.NOTIFY_CHAT) {
          const msg = 'Новая идея для ' + (kind === 'video' ? 'видео' : 'статьи') + (me.name ? ' от ' + me.name : '') + ':\n\n' + text + '\n\nОтветить: панель управления → Идеи.';
          await fetch('https://api.telegram.org/bot' + env.NOTIFY_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.NOTIFY_CHAT, text: msg }) }).catch(() => {});
        }
        return json(req, { ok: true, id });
      }
      if (path === '/my' && req.method === 'GET') {
        const me = await who(req, env, url.searchParams.get('initData'), url.searchParams.get('device'));
        if (!me) return json(req, []);
        const idx = (await env.IDEAS.get('u:' + me.uid, 'json')) || [], list = [];
        for (const e of idx.slice(-30)) { const v = await env.IDEAS.get('i:' + me.uid + ':' + e.id, 'json'); if (v) list.push(v); }
        return json(req, list.sort((a, b) => b.ts - a.ts).slice(0, 30).map((i) => ({ id: i.id, kind: i.kind, text: i.text, ts: i.ts, status: i.status, reason: i.reason || '' })));
      }
      if (path === '/admin/list' && req.method === 'GET') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const list = await listBy(env, 'i:');
        return json(req, list.sort((a, b) => b.ts - a.ts));
      }
      if (path === '/admin/set' && req.method === 'POST') {
        if (!isAdmin(req, env)) return json(req, { error: 'forbidden' }, 403);
        const b = await req.json(), cur = String(b.key || '').startsWith('i:') ? await env.IDEAS.get(b.key, 'json') : null;
        if (!cur || !STATUSES[b.status]) return json(req, { ok: false, error: 'bad-input' }, 400);
        cur.status = b.status; cur.reason = String(b.reason || '').slice(0, 300); cur.upd = Date.now();
        await env.IDEAS.put(b.key, JSON.stringify(cur));
        return json(req, { ok: true });
      }
      return json(req, { error: 'not-found' }, 404);
    } catch (e) { return json(req, { ok: false, error: 'server' }, 500); }
  },
};
